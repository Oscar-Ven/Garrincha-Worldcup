/**
 * Antwerpen player import runner.
 * Handles file discovery, dry-run, account creation, and batched email dispatch.
 * Excluded from test coverage — integration-only (DB + email + FS).
 */
import "server-only";
import fs from "fs";
import path from "path";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateAccessToken } from "@/lib/auth";
import { buildAccessLinkEmail, isEmailConfigured, sendEmail } from "@/lib/email";
import {
  ANTWERPEN_NOORD,
  ANTWERPEN_ZUID,
  assignCenters,
  extractFirstName,
  generateNickname,
  parseExcelBuffer,
  type DryRunReport,
  type ImportReport,
  type ImportedPlayerResult,
} from "./player-import";

// ---------------------------------------------------------------------------
// File discovery — tries multiple path/case variants
// ---------------------------------------------------------------------------

const IMPORT_FILE_VARIANTS = [
  path.join(process.cwd(), "data", "import", "antwerpen.xls"),
  path.join(process.cwd(), "data", "import", "Antwerpen.xlsx"),
  path.join(process.cwd(), "data", "import", "antwerpen.xlsx"),
  path.join(process.cwd(), "data", "import", "Antwerpen.xls"),
];

export function findImportFile(): string | null {
  return IMPORT_FILE_VARIANTS.find((p) => fs.existsSync(p)) ?? null;
}

// ---------------------------------------------------------------------------
// Nickname generation with DB uniqueness guarantee
// ---------------------------------------------------------------------------

async function generateUniqueNickname(firstName: string): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const num = 100 + Math.floor(Math.random() * 900); // 100–999
    const candidate = generateNickname(firstName, num);
    const existing = await prisma.user.findUnique({
      where: { nickname: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  // Ultimate fallback — epoch-mod suffix guarantees uniqueness within a run
  return generateNickname(firstName, Date.now() % 1_000_000);
}

// ---------------------------------------------------------------------------
// Access token generation + invitation email dispatch
// Mirrors rotateAndSendAccessLink but also passes centerName and displayName.
// ---------------------------------------------------------------------------

async function sendInvitationEmail(
  userId: string,
  email: string,
  displayName: string,
  centerName: string,
): Promise<{ status: "sent" | "failed" | "skipped_unsubscribed"; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailUnsubscribedAt: true },
  });

  if (user?.emailUnsubscribedAt) {
    return { status: "skipped_unsubscribed" };
  }

  const { raw: token, hash: accessTokenHash } = generateAccessToken();
  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: {
      accessTokenHash,
      accessTokenCreatedAt: now,
      accessTokenRevokedAt: null,
      lastAccessLinkSentAt: now,
    },
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://worldcup.garrincha.be";
  const accessUrl = `${appUrl}/auth/access?token=${token}`;

  try {
    await sendEmail(
      buildAccessLinkEmail({ email, accessUrl, displayName, centerName, userId }),
    );
    return { status: "sent" };
  } catch (err) {
    return {
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Empty dry-run report helper
// ---------------------------------------------------------------------------

function emptyDryRun(criticalErrors: string[]): DryRunReport {
  return {
    filePath: IMPORT_FILE_VARIANTS[0],
    totalRows: 0,
    validRowCount: 0,
    invalidRowCount: 0,
    newAccountCount: 0,
    existingAccountCount: 0,
    excelDuplicateCount: 0,
    missingPhoneCount: 0,
    zuidCount: 0,
    noordCount: 0,
    centerAssignments: [],
    newEmails: [],
    existingEmails: [],
    excelDuplicateEmails: [],
    invalidRows: [],
    criticalErrors,
    emailConfigured: isEmailConfigured(),
  };
}

// ---------------------------------------------------------------------------
// Main runner — dry-run then import (single call, no second confirmation)
// ---------------------------------------------------------------------------

export async function runAntwerpenImport(): Promise<ImportReport> {
  const runErrors: string[] = [];

  // --- Step 1: Locate file ---
  const filePath = findImportFile();
  if (!filePath) {
    return {
      dryRun: emptyDryRun([
        `File not found. Searched: ${IMPORT_FILE_VARIANTS.map((p) => path.basename(p)).join(", ")}`,
      ]),
      accountsCreated: 0,
      accountsSkippedExisting: 0,
      accountsFailedCreate: 0,
      emailsSent: 0,
      emailsFailed: 0,
      emailsSkippedExisting: 0,
      emailsSkippedUnsubscribed: 0,
      players: [],
      errors: [],
    };
  }

  // --- Step 2: Read + parse ---
  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (err) {
    return {
      dryRun: emptyDryRun([
        `File cannot be read: ${err instanceof Error ? err.message : String(err)}`,
      ]),
      accountsCreated: 0,
      accountsSkippedExisting: 0,
      accountsFailedCreate: 0,
      emailsSent: 0,
      emailsFailed: 0,
      emailsSkippedExisting: 0,
      emailsSkippedUnsubscribed: 0,
      players: [],
      errors: [],
    };
  }

  const { rows: allRows, criticalErrors: parseErrors } = parseExcelBuffer(buffer);
  if (parseErrors.length > 0) {
    return {
      dryRun: emptyDryRun(parseErrors),
      accountsCreated: 0,
      accountsSkippedExisting: 0,
      accountsFailedCreate: 0,
      emailsSent: 0,
      emailsFailed: 0,
      emailsSkippedExisting: 0,
      emailsSkippedUnsubscribed: 0,
      players: [],
      errors: [],
    };
  }

  // --- Step 3: Dry-run analysis ---

  const validRows = allRows.filter((r) => r.valid);
  const invalidRows = allRows.filter((r) => !r.valid);

  // Detect in-file duplicates — keep first occurrence of each email
  const seenInFile = new Set<string>();
  const excelDuplicateEmails: string[] = [];
  const deduplicatedValid = validRows.filter((r) => {
    if (seenInFile.has(r.email)) {
      excelDuplicateEmails.push(r.email);
      return false;
    }
    seenInFile.add(r.email);
    return true;
  });

  // Check which emails already exist in the database
  const candidateEmails = deduplicatedValid.map((r) => r.email);
  let existingEmails: string[] = [];
  try {
    const found = await prisma.user.findMany({
      where: { email: { in: candidateEmails } },
      select: { email: true },
    });
    existingEmails = found.map((u) => u.email);
  } catch (err) {
    return {
      dryRun: emptyDryRun([
        `Database connection failure: ${err instanceof Error ? err.message : String(err)}`,
      ]),
      accountsCreated: 0,
      accountsSkippedExisting: 0,
      accountsFailedCreate: 0,
      emailsSent: 0,
      emailsFailed: 0,
      emailsSkippedExisting: 0,
      emailsSkippedUnsubscribed: 0,
      players: [],
      errors: [],
    };
  }

  const existingSet = new Set(existingEmails);
  const newEmails = deduplicatedValid
    .filter((r) => !existingSet.has(r.email))
    .map((r) => r.email);

  const dryRunCriticals: string[] = [];
  if (!isEmailConfigured()) {
    dryRunCriticals.push(
      "Existing invitation email sender cannot be called: RESEND_API_KEY or EMAIL_FROM is not configured.",
    );
  }

  // Deterministic center assignment — sorted emails, alternating
  const assignments = assignCenters(newEmails);
  const centerMap = new Map(assignments.map((a) => [a.email, a.centerName]));
  const zuidCount = assignments.filter((a) => a.centerName === ANTWERPEN_ZUID).length;
  const noordCount = assignments.filter((a) => a.centerName === ANTWERPEN_NOORD).length;

  const dryRun: DryRunReport = {
    filePath,
    totalRows: allRows.length,
    validRowCount: deduplicatedValid.length,
    invalidRowCount: invalidRows.length,
    newAccountCount: newEmails.length,
    existingAccountCount: existingEmails.length,
    excelDuplicateCount: excelDuplicateEmails.length,
    missingPhoneCount: deduplicatedValid.filter((r) => !r.phone).length,
    zuidCount,
    noordCount,
    centerAssignments: assignments,
    newEmails,
    existingEmails,
    excelDuplicateEmails,
    invalidRows: invalidRows.map((r) => ({
      rowIndex: r.rowIndex,
      email: r.rawEmail,
      fullName: r.fullName,
      errors: r.errors,
      warnings: r.warnings,
    })),
    criticalErrors: dryRunCriticals,
    emailConfigured: isEmailConfigured(),
  };

  // Stop immediately if any critical errors found in dry-run
  if (dryRunCriticals.length > 0) {
    return {
      dryRun,
      accountsCreated: 0,
      accountsSkippedExisting: existingEmails.length,
      accountsFailedCreate: 0,
      emailsSent: 0,
      emailsFailed: 0,
      emailsSkippedExisting: existingEmails.length,
      emailsSkippedUnsubscribed: 0,
      players: [],
      errors: dryRunCriticals,
    };
  }

  // --- Step 4: Resolve center IDs ---
  const [zuidCenter, noordCenter] = await Promise.all([
    prisma.garrinchaCenter.findFirst({
      where: { name: ANTWERPEN_ZUID },
      select: { id: true },
    }),
    prisma.garrinchaCenter.findFirst({
      where: { name: ANTWERPEN_NOORD },
      select: { id: true },
    }),
  ]);

  if (!zuidCenter || !noordCenter) {
    const msg = `Centers not found in DB. Expected "${ANTWERPEN_ZUID}" and "${ANTWERPEN_NOORD}". Run seed first.`;
    return {
      dryRun: { ...dryRun, criticalErrors: [msg] },
      accountsCreated: 0,
      accountsSkippedExisting: existingEmails.length,
      accountsFailedCreate: 0,
      emailsSent: 0,
      emailsFailed: 0,
      emailsSkippedExisting: existingEmails.length,
      emailsSkippedUnsubscribed: 0,
      players: [],
      errors: [msg],
    };
  }

  // --- Step 5: Create accounts + send emails ---
  const newRows = deduplicatedValid.filter((r) => !existingSet.has(r.email));
  const players: ImportedPlayerResult[] = [];
  let accountsCreated = 0;
  let accountsFailedCreate = 0;
  let emailsSent = 0;
  let emailsFailed = 0;
  let emailsSkippedUnsubscribed = 0;

  for (const row of newRows) {
    const centerName = centerMap.get(row.email) ?? ANTWERPEN_ZUID;
    const centerId =
      centerName === ANTWERPEN_NOORD ? noordCenter.id : zuidCenter.id;
    const firstName = extractFirstName(row.fullName);

    // Generate nickname with DB uniqueness check
    let nickname: string;
    try {
      nickname = await generateUniqueNickname(firstName);
    } catch (err) {
      const msg = `Nickname generation failed for ${row.email}: ${err instanceof Error ? err.message : String(err)}`;
      runErrors.push(msg);
      players.push({
        email: row.email,
        fullName: row.fullName,
        userId: "",
        nickname: "",
        centerName,
        emailStatus: "failed",
        emailError: msg,
      });
      accountsFailedCreate++;
      continue;
    }

    // Create user — catch P2002 (unique constraint) as idempotency protection
    let userId: string;
    try {
      const user = await prisma.user.create({
        data: {
          email: row.email,
          fullName: row.fullName,
          nickname,
          displayName: nickname,
          phoneNumber: row.phone || "",
          role: Role.USER,
          centerId,
          competitionCenterId: centerId,
          firstActivatedAt: new Date(),
        },
      });
      userId = user.id;
      accountsCreated++;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "P2002") {
        // Concurrent insert — treat as already-existing, skip silently
        players.push({
          email: row.email,
          fullName: row.fullName,
          userId: "",
          nickname: "",
          centerName,
          emailStatus: "skipped_existing",
        });
        continue;
      }
      const msg = `Account creation failed for ${row.email}: ${err instanceof Error ? err.message : String(err)}`;
      runErrors.push(msg);
      players.push({
        email: row.email,
        fullName: row.fullName,
        userId: "",
        nickname: "",
        centerName,
        emailStatus: "failed",
        emailError: msg,
      });
      accountsFailedCreate++;
      continue;
    }

    // Dispatch invitation email (uses existing template + sender)
    const { status: emailStatus, error: emailError } =
      await sendInvitationEmail(userId, row.email, row.fullName, centerName);

    if (emailStatus === "sent") {
      emailsSent++;
    } else if (emailStatus === "failed") {
      emailsFailed++;
      if (emailError) runErrors.push(`Email failed for ${row.email}: ${emailError}`);
    } else if (emailStatus === "skipped_unsubscribed") {
      emailsSkippedUnsubscribed++;
    }

    players.push({
      email: row.email,
      fullName: row.fullName,
      userId,
      nickname,
      centerName,
      emailStatus,
      emailError,
    });

    // 150 ms courtesy delay between emails — avoids burst on Resend
    await new Promise<void>((resolve) => setTimeout(resolve, 150));
  }

  return {
    dryRun,
    accountsCreated,
    accountsSkippedExisting: existingEmails.length,
    accountsFailedCreate,
    emailsSent,
    emailsFailed,
    emailsSkippedExisting: existingEmails.length,
    emailsSkippedUnsubscribed,
    players,
    errors: runErrors,
  };
}
