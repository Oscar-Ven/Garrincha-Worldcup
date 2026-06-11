/**
 * Antwerpen player import runner — queue-based.
 * Creates accounts in batch, queues InvitationJob records for deferred email delivery.
 * Email dispatch happens separately via /api/admin/import/antwerpen/send-batch.
 * Excluded from test coverage — integration-only (DB + FS).
 */
import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import {
  ANTWERPEN_NOORD,
  ANTWERPEN_ZUID,
  assignCenters,
  centerDisplayName,
  extractFirstName,
  generateNickname,
  parseCsvBuffer,
  type DryRunReport,
  type ImportReport,
} from "./player-import";

// ---------------------------------------------------------------------------
// File discovery — CSV takes priority over Excel variants
// ---------------------------------------------------------------------------

const IMPORT_FILE_VARIANTS = [
  path.join(process.cwd(), "data", "import", "antwerpen_import_ready_with_centers.csv"),
];

export function findImportFile(): { filePath: string } | null {
  for (const p of IMPORT_FILE_VARIANTS) {
    if (fs.existsSync(p)) {
      return { filePath: p };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Batch nickname generation — 2–3 DB queries for any number of rows
// ---------------------------------------------------------------------------

async function generateBatchNicknames(
  rows: Array<{ email: string; fullName: string }>,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const usedInBatch = new Set<string>();

  // Round 1: Generate candidates, deduplicated within the batch
  const candidates = rows.map((row) => {
    const firstName = extractFirstName(row.fullName);
    let nickname = "";
    for (let attempt = 0; attempt < 200; attempt++) {
      const num = 100 + Math.floor(Math.random() * 900);
      const candidate = generateNickname(firstName, num);
      if (!usedInBatch.has(candidate)) {
        nickname = candidate;
        usedInBatch.add(candidate);
        break;
      }
    }
    if (!nickname) {
      // Widen range if all 900 slots were taken by same first name
      const num = 1000 + Math.floor(Math.random() * 9000);
      nickname = generateNickname(firstName, num);
      usedInBatch.add(nickname);
    }
    return { email: row.email, nickname, firstName };
  });

  // Round 2: One batch query to find DB conflicts
  const existingInDb = new Set(
    (
      await prisma.user.findMany({
        where: { nickname: { in: candidates.map((c) => c.nickname) } },
        select: { nickname: true },
      })
    ).map((u) => u.nickname),
  );

  // Round 3: Regenerate the (rare) DB conflicts with a wider number range
  for (const c of candidates) {
    if (existingInDb.has(c.nickname)) {
      let resolved = "";
      for (let attempt = 0; attempt < 500; attempt++) {
        const num = 10_000 + Math.floor(Math.random() * 90_000);
        const candidate = generateNickname(c.firstName, num);
        if (!usedInBatch.has(candidate) && !existingInDb.has(candidate)) {
          resolved = candidate;
          usedInBatch.delete(c.nickname);
          usedInBatch.add(resolved);
          break;
        }
      }
      if (!resolved) {
        resolved = generateNickname(c.firstName, Date.now() % 10_000_000);
      }
      c.nickname = resolved;
    }
    result.set(c.email, c.nickname);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
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

function emptyReport(dryRun: DryRunReport): ImportReport {
  return {
    dryRun,
    accountsCreated: 0,
    accountsSkippedExisting: 0,
    accountsFailedCreate: 0,
    jobsCreated: 0,
    errors: dryRun.criticalErrors,
  };
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

export interface ImportFileOverride {
  buffer: Buffer;
  fileName: string;
}

export async function runAntwerpenImport(
  override?: ImportFileOverride,
): Promise<ImportReport> {
  let filePath: string;
  let buffer: Buffer;

  if (override) {
    filePath = override.fileName;
    buffer = override.buffer;
  } else {
    // Step 1: Locate the import file on the local filesystem
    const found = findImportFile();
    if (!found) {
      return emptyReport(
        emptyDryRun([
          `File not found on server. Upload the CSV using the file picker, or deploy the file to: ${IMPORT_FILE_VARIANTS.map((p) => path.basename(p)).join(", ")}`,
        ]),
      );
    }
    filePath = found.filePath;

    // Step 2: Read buffer
    try {
      buffer = fs.readFileSync(filePath);
    } catch (err) {
      return emptyReport(
        emptyDryRun([
          `File cannot be read: ${err instanceof Error ? err.message : String(err)}`,
        ]),
      );
    }
  }

  // Step 3: Parse CSV
  const { rows: allRows, criticalErrors: parseErrors } = parseCsvBuffer(buffer);

  if (parseErrors.length > 0) {
    return emptyReport(emptyDryRun(parseErrors));
  }

  // Step 4: Classify rows — deduplicate within the file
  const validRows = allRows.filter((r) => r.valid);
  const invalidRows = allRows.filter((r) => !r.valid);

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

  // Step 5: Check which emails already exist in DB (one batch query)
  const candidateEmails = deduplicatedValid.map((r) => r.email);
  let existingEmails: string[] = [];
  try {
    const found = await prisma.user.findMany({
      where: { email: { in: candidateEmails } },
      select: { email: true },
    });
    existingEmails = found.map((u) => u.email);
  } catch (err) {
    return emptyReport(
      emptyDryRun([
        `Database connection failure: ${err instanceof Error ? err.message : String(err)}`,
      ]),
    );
  }

  const existingSet = new Set(existingEmails);
  const newRows = deduplicatedValid.filter((r) => !existingSet.has(r.email));
  const newEmails = newRows.map((r) => r.email);

  // Step 6: Determine center assignments
  // Prefer CENTER column from CSV; fall back to deterministic 50/50 split.
  const hasCenterColumn = allRows.some((r) => r.centerName !== undefined);
  let assignments: Array<{ email: string; centerName: string }>;

  if (hasCenterColumn) {
    assignments = newRows.map((r) => ({
      email: r.email,
      centerName: r.centerName ?? ANTWERPEN_ZUID,
    }));
  } else {
    assignments = assignCenters(newEmails);
  }

  const centerMap = new Map(assignments.map((a) => [a.email, a.centerName]));
  const zuidCount = assignments.filter((a) => a.centerName === ANTWERPEN_ZUID).length;
  const noordCount = assignments.filter((a) => a.centerName === ANTWERPEN_NOORD).length;

  // Build dry-run report
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
    criticalErrors: [],
    emailConfigured: isEmailConfigured(),
  };

  // Nothing new to do
  if (newRows.length === 0) {
    return {
      dryRun,
      accountsCreated: 0,
      accountsSkippedExisting: existingEmails.length,
      accountsFailedCreate: 0,
      jobsCreated: 0,
      errors: [],
    };
  }

  // Step 7: Resolve center IDs dynamically from whatever centers are in the assignments
  const uniqueCenterNames = [...new Set(assignments.map((a) => a.centerName))];
  const foundCenters = await prisma.garrinchaCenter.findMany({
    where: { name: { in: uniqueCenterNames } },
    select: { id: true, name: true },
  });
  const centerIdMap = new Map(foundCenters.map((c) => [c.name, c.id]));
  const centerDisplayMap = new Map(foundCenters.map((c) => [c.id, centerDisplayName(c.name)]));

  const missingCenters = uniqueCenterNames.filter((n) => !centerIdMap.has(n));
  if (missingCenters.length > 0) {
    const msg = `Centers not found in DB: ${missingCenters.join(", ")}. Run seed first.`;
    return emptyReport({ ...dryRun, criticalErrors: [msg] });
  }

  // Step 8: Generate all nicknames — at most 3 DB queries regardless of batch size
  const nicknameMap = await generateBatchNicknames(newRows);

  // Step 9: Bulk-create all user accounts in one INSERT ... RETURNING
  const importRunId = crypto.randomUUID();
  const fallbackCenterId = foundCenters[0].id;
  const userInsertData = newRows.map((row) => {
    const centerName = centerMap.get(row.email) ?? ANTWERPEN_ZUID;
    const centerId = centerIdMap.get(centerName) ?? fallbackCenterId;
    const nickname =
      nicknameMap.get(row.email) ??
      generateNickname(extractFirstName(row.fullName), 999);
    return {
      email: row.email,
      fullName: row.fullName,
      nickname,
      displayName: nickname,
      phoneNumber: row.phone || "",
      role: Role.USER,
      centerId,
      competitionCenterId: centerId,
      firstActivatedAt: new Date(),
    };
  });

  let createdUsers: Array<{ id: string; email: string; centerId: string }>;
  try {
    createdUsers = await prisma.user.createManyAndReturn({
      data: userInsertData,
      skipDuplicates: true,
      select: { id: true, email: true, centerId: true },
    });
  } catch (err) {
    const msg = `Bulk user creation failed: ${err instanceof Error ? err.message : String(err)}`;
    return emptyReport({ ...dryRun, criticalErrors: [msg] });
  }

  // Step 10: Create InvitationJob records for newly created users
  let jobsCreated = 0;
  if (createdUsers.length > 0) {
    const emailToFullName = new Map(newRows.map((r) => [r.email, r.fullName]));
    const jobInsertData = createdUsers.map((u) => ({
      userId: u.id,
      email: u.email,
      displayName: emailToFullName.get(u.email) ?? u.email,
      centerName: centerDisplayMap.get(u.centerId) ?? u.centerId,
      importRunId,
      status: "pending",
    }));

    try {
      const result = await prisma.invitationJob.createMany({
        data: jobInsertData,
        skipDuplicates: true,
      });
      jobsCreated = result.count;
    } catch (err) {
      const msg = `Invitation job creation failed: ${err instanceof Error ? err.message : String(err)}`;
      return {
        dryRun,
        accountsCreated: createdUsers.length,
        accountsSkippedExisting: existingEmails.length,
        accountsFailedCreate: newRows.length - createdUsers.length,
        jobsCreated: 0,
        errors: [msg],
      };
    }
  }

  return {
    dryRun,
    accountsCreated: createdUsers.length,
    accountsSkippedExisting: existingEmails.length,
    accountsFailedCreate: newRows.length - createdUsers.length,
    jobsCreated,
    errors: [],
  };
}
