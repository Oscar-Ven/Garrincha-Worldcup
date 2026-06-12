/**
 * Standalone Antwerpen production import script.
 * Run with: node --env-file=.env --import tsx/esm scripts/run-prod-import.ts
 *
 * Does NOT go through the HTTP API. Connects directly to the production
 * Supabase database using DATABASE_URL from .env and runs the full import.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// DB connection (same pattern as prisma/seed.ts)
// ---------------------------------------------------------------------------

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Pure helpers (inlined from src/lib/import/player-import.ts — no server-only)
// ---------------------------------------------------------------------------

const ANTWERPEN_ZUID = "GARRINCHA Antwerpen Zuid";
const ANTWERPEN_NOORD = "GARRINCHA Antwerpen Noord";
const GENT_ARSENAAL = "GARRINCHA Gent Arsenaal";
const GENT_THE_LOOP = "GARRINCHA Gent The Loop";
const KORTRIJK = "GARRINCHA Kortrijk";
const DIEGEM   = "GARRINCHA Diegem";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function extractFirstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  const clean = first.replace(/[^a-zA-Z0-9]/g, "");
  return clean || "Player";
}

function generateNickname(firstName: string, num: number): string {
  return `${firstName}${num}`;
}

function assignCenters(emails: string[]): Array<{ email: string; centerName: string }> {
  return [...emails].sort().map((email, i) => ({
    email,
    centerName: i % 2 === 0 ? ANTWERPEN_ZUID : ANTWERPEN_NOORD,
  }));
}

function normalizeCenterName(raw: string): string | null {
  const lower = raw.trim().toLowerCase();
  if (lower.includes("antwerpen") && lower.includes("noord")) return ANTWERPEN_NOORD;
  if (lower.includes("antwerpen") && lower.includes("zuid")) return ANTWERPEN_ZUID;
  if (lower.includes("gent") && lower.includes("arsenaal")) return GENT_ARSENAAL;
  if (lower.includes("gent") && lower.includes("loop")) return GENT_THE_LOOP;
  if (lower.includes("kortrijk")) return KORTRIJK;
  if (lower.includes("diegem"))   return DIEGEM;
  return null;
}

function centerDisplayName(centerName: string): string {
  if (centerName.toLowerCase().includes("gent")) return "GARRINCHA Gent";
  return centerName;
}

function findCol(headers: string[], ...terms: string[]): number {
  return headers.findIndex((h) => terms.some((t) => h.includes(t)));
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === "," && !inQuote) {
      cells.push(current); current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

interface ParsedRow {
  rowIndex: number;
  fullName: string;
  email: string;
  rawEmail: string;
  phone: string;
  centerName?: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function parseCsvBuffer(buffer: Buffer): { rows: ParsedRow[]; criticalErrors: string[] } {
  let text = buffer.toString("utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { rows: [], criticalErrors: ["CSV file has no data rows."] };

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toUpperCase());
  const nameCol  = findCol(headers, "NAME", "NAAM", "NOM");
  const emailCol = findCol(headers, "MAIL", "EMAIL");
  const phoneCol = findCol(headers, "PHONE", "GSM", "MOBILE", "NUMMER", "TELEPHONE");
  const centerCol = findCol(headers, "CENTER", "CENTRE", "CENTRUM");

  const criticalErrors: string[] = [];
  if (nameCol  === -1) criticalErrors.push("Missing FULL NAME column.");
  if (emailCol === -1) criticalErrors.push("Missing MAIL column.");
  if (criticalErrors.length > 0) return { rows: [], criticalErrors };

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const rawName  = cells[nameCol]?.trim()  ?? "";
    const rawEmail = cells[emailCol]?.trim() ?? "";
    const rawPhone = phoneCol  >= 0 ? (cells[phoneCol]?.trim()  ?? "") : "";
    const rawCenter = centerCol >= 0 ? (cells[centerCol]?.trim() ?? "") : "";

    if (!rawName && !rawEmail && !rawPhone) continue;

    const errors: string[] = [];
    const warnings: string[] = [];
    if (!rawName)  errors.push("Missing FULL NAME");
    if (!rawEmail) errors.push("Missing MAIL");

    const email = normalizeEmail(rawEmail);
    if (rawEmail && !isValidEmail(email)) errors.push(`Invalid email format: ${rawEmail}`);
    if (!rawPhone) warnings.push("Missing PHONE (optional)");

    const centerName = rawCenter ? (normalizeCenterName(rawCenter) ?? undefined) : undefined;

    rows.push({ rowIndex: i + 1, fullName: rawName, email, rawEmail, phone: rawPhone, centerName, valid: errors.length === 0, errors, warnings });
  }
  return { rows, criticalErrors: [] };
}

// ---------------------------------------------------------------------------
// Nickname batch generator (same algorithm as player-import-runner.ts)
// ---------------------------------------------------------------------------

async function generateBatchNicknames(
  rows: Array<{ email: string; fullName: string }>,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const usedInBatch = new Set<string>();

  const candidates = rows.map((row) => {
    const firstName = extractFirstName(row.fullName);
    let nickname = "";
    for (let attempt = 0; attempt < 200; attempt++) {
      const num = 100 + Math.floor(Math.random() * 900);
      const candidate = generateNickname(firstName, num);
      if (!usedInBatch.has(candidate)) { nickname = candidate; usedInBatch.add(candidate); break; }
    }
    if (!nickname) {
      const num = 1000 + Math.floor(Math.random() * 9000);
      nickname = generateNickname(firstName, num);
      usedInBatch.add(nickname);
    }
    return { email: row.email, nickname, firstName };
  });

  const existingInDb = new Set(
    (await prisma.user.findMany({
      where: { nickname: { in: candidates.map((c) => c.nickname) } },
      select: { nickname: true },
    })).map((u) => u.nickname),
  );

  for (const c of candidates) {
    if (existingInDb.has(c.nickname)) {
      let resolved = "";
      for (let attempt = 0; attempt < 500; attempt++) {
        const num = 10_000 + Math.floor(Math.random() * 90_000);
        const candidate = generateNickname(c.firstName, num);
        if (!usedInBatch.has(candidate) && !existingInDb.has(candidate)) {
          resolved = candidate; usedInBatch.delete(c.nickname); usedInBatch.add(resolved); break;
        }
      }
      if (!resolved) resolved = generateNickname(c.firstName, Date.now() % 10_000_000);
      c.nickname = resolved;
    }
    result.set(c.email, c.nickname);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const csvFile = process.argv[2] ?? "antwerpen_import_ready_with_centers.csv";
  const csvPath = join(process.cwd(), "data", "import", csvFile);
  console.log(`\nReading CSV: ${csvPath}`);
  const buffer = readFileSync(csvPath);
  console.log(`CSV size: ${(buffer.length / 1024).toFixed(0)} KB`);

  // Parse
  const { rows: allRows, criticalErrors } = parseCsvBuffer(buffer);
  if (criticalErrors.length > 0) {
    console.error("CRITICAL PARSE ERRORS:", criticalErrors);
    process.exit(1);
  }
  console.log(`Parsed: ${allRows.length} data rows`);

  // Deduplicate within file
  const validRows = allRows.filter((r) => r.valid);
  const invalidRows = allRows.filter((r) => !r.valid);
  const seenInFile = new Set<string>();
  const excelDuplicates: string[] = [];
  const deduped = validRows.filter((r) => {
    if (seenInFile.has(r.email)) { excelDuplicates.push(r.email); return false; }
    seenInFile.add(r.email);
    return true;
  });
  console.log(`Valid: ${deduped.length}  Invalid: ${invalidRows.length}  File-duplicates: ${excelDuplicates.length}`);

  // Check existing in DB
  const candidateEmails = deduped.map((r) => r.email);
  console.log(`\nChecking ${candidateEmails.length} emails against production DB...`);
  const existingInDb = await prisma.user.findMany({
    where: { email: { in: candidateEmails } },
    select: { email: true },
  });
  const existingSet = new Set(existingInDb.map((u) => u.email));
  const newRows = deduped.filter((r) => !existingSet.has(r.email));
  console.log(`Already in DB: ${existingInDb.length}  New to insert: ${newRows.length}`);

  if (newRows.length === 0) {
    console.log("\nNothing to import — all emails already exist in DB.");
    await prisma.$disconnect();
    pool.end();
    return;
  }

  // Center assignments
  const hasCenterColumn = allRows.some((r) => r.centerName !== undefined);
  let assignments: Array<{ email: string; centerName: string }>;
  if (hasCenterColumn) {
    const missingCenterRows = newRows.filter((r) => !r.centerName);
    if (missingCenterRows.length > 0) {
      console.error(`ERROR: ${missingCenterRows.length} rows have no parseable CENTER value:`);
      missingCenterRows.slice(0, 10).forEach((r) => console.error(`  row ${r.rowIndex}: ${r.fullName} <${r.rawEmail}>`));
      process.exit(1);
    }
    assignments = newRows.map((r) => ({ email: r.email, centerName: r.centerName! }));
  } else {
    assignments = assignCenters(newRows.map((r) => r.email));
  }
  const centerMap = new Map(assignments.map((a) => [a.email, a.centerName]));
  const zuidCount  = assignments.filter((a) => a.centerName === ANTWERPEN_ZUID).length;
  const noordCount = assignments.filter((a) => a.centerName === ANTWERPEN_NOORD).length;
  console.log(`Center split: Zuid=${zuidCount}  Noord=${noordCount}`);

  // Resolve center IDs dynamically
  const uniqueCenterNames = [...new Set(assignments.map((a) => a.centerName))];
  const foundCenters = await prisma.garrinchaCenter.findMany({
    where: { name: { in: uniqueCenterNames } },
    select: { id: true, name: true },
  });
  const centerIdMap = new Map(foundCenters.map((c) => [c.name, c.id]));
  const centerDisplayMap = new Map(foundCenters.map((c) => [c.id, centerDisplayName(c.name)]));
  const missingCenters = uniqueCenterNames.filter((n) => !centerIdMap.has(n));
  if (missingCenters.length > 0) {
    console.error(`Centers not found in DB: ${missingCenters.join(", ")}`);
    process.exit(1);
  }
  console.log(`Centers resolved: ${foundCenters.map((c) => `${c.name} (${c.id})`).join(", ")}`);

  // Generate nicknames
  console.log(`\nGenerating nicknames for ${newRows.length} users...`);
  const nicknameMap = await generateBatchNicknames(newRows);

  // Bulk create users
  const fallbackCenterId = foundCenters[0].id;
  const importRunId = crypto.randomUUID();
  const userInsertData = newRows.map((row) => {
    const centerName = centerMap.get(row.email) ?? assignments[0].centerName;
    const centerId   = centerIdMap.get(centerName) ?? fallbackCenterId;
    const nickname   = nicknameMap.get(row.email) ?? generateNickname(extractFirstName(row.fullName), 999);
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

  console.log(`Inserting ${userInsertData.length} users...`);
  const createdUsers = await prisma.user.createManyAndReturn({
    data: userInsertData,
    skipDuplicates: true,
    select: { id: true, email: true, centerId: true },
  });
  console.log(`Users created: ${createdUsers.length}  (skipped: ${newRows.length - createdUsers.length})`);

  // Create InvitationJobs
  if (createdUsers.length > 0) {
    const emailToFullName = new Map(newRows.map((r) => [r.email, r.fullName]));
    const jobData = createdUsers.map((u) => ({
      userId:      u.id,
      email:       u.email,
      displayName: emailToFullName.get(u.email) ?? u.email,
      centerName:  centerDisplayMap.get(u.centerId) ?? u.centerId,
      importRunId,
      status:      "pending",
    }));

    console.log(`Queuing ${jobData.length} invitation jobs...`);
    const result = await prisma.invitationJob.createMany({ data: jobData, skipDuplicates: true });
    console.log(`Invitation jobs created: ${result.count}`);
  }

  // Summary
  console.log(`
=== IMPORT COMPLETE ===
  Total CSV rows    : ${allRows.length}
  Valid (deduped)   : ${deduped.length}
  Invalid skipped   : ${invalidRows.length}
  File duplicates   : ${excelDuplicates.length}
  Already in DB     : ${existingInDb.length}
  Accounts created  : ${createdUsers.length}
  Jobs queued       : ${createdUsers.length}
  Import run ID     : ${importRunId}
`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
