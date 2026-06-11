/**
 * Pure helpers for the Antwerpen player import.
 * No side effects — no DB, no file I/O, no email sending.
 * Safe to import in tests without mocking infrastructure.
 */
import "server-only";
import * as XLSX from "xlsx";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ANTWERPEN_ZUID = "GARRINCHA Antwerpen Zuid";
export const ANTWERPEN_NOORD = "GARRINCHA Antwerpen Noord";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedRow {
  rowIndex: number;
  fullName: string;
  email: string;     // normalized: trimmed + lowercase
  rawEmail: string;  // original value from cell
  phone: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export type EmailStatus =
  | "pending"
  | "sent"
  | "failed"
  | "skipped_existing"
  | "skipped_duplicate"
  | "skipped_invalid"
  | "skipped_unsubscribed";

export interface CenterAssignment {
  email: string;
  centerName: string;
}

export interface DryRunReport {
  filePath: string;
  totalRows: number;
  validRowCount: number;
  invalidRowCount: number;
  newAccountCount: number;
  existingAccountCount: number;
  excelDuplicateCount: number;
  missingPhoneCount: number;
  zuidCount: number;
  noordCount: number;
  centerAssignments: CenterAssignment[];
  newEmails: string[];
  existingEmails: string[];
  excelDuplicateEmails: string[];
  invalidRows: Array<{
    rowIndex: number;
    email: string;
    fullName: string;
    errors: string[];
    warnings: string[];
  }>;
  criticalErrors: string[];
  emailConfigured: boolean;
}

export interface ImportedPlayerResult {
  email: string;
  fullName: string;
  userId: string;
  nickname: string;
  centerName: string;
  emailStatus: EmailStatus;
  emailError?: string;
}

export interface ImportReport {
  dryRun: DryRunReport;
  accountsCreated: number;
  accountsSkippedExisting: number;
  accountsFailedCreate: number;
  emailsSent: number;
  emailsFailed: number;
  emailsSkippedExisting: number;
  emailsSkippedUnsubscribed: number;
  players: ImportedPlayerResult[];
  errors: string[];
}

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Nickname helpers
// ---------------------------------------------------------------------------

/**
 * Extract the first "word" of a full name, stripping non-alphanumeric chars.
 * Falls back to "Player" when the name is blank or produces no clean chars.
 */
export function extractFirstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  const clean = first.replace(/[^a-zA-Z0-9]/g, "");
  return clean || "Player";
}

/**
 * Build a candidate nickname string. Uniqueness is the caller's responsibility.
 */
export function generateNickname(firstName: string, num: number): string {
  return `${firstName}${num}`;
}

// ---------------------------------------------------------------------------
// Center assignment
// ---------------------------------------------------------------------------

/**
 * Deterministic 50/50 split:
 *   Sort emails alphabetically → even index → Zuid, odd index → Noord.
 * Does NOT mutate the input array.
 */
export function assignCenters(emails: string[]): CenterAssignment[] {
  return [...emails].sort().map((email, i) => ({
    email,
    centerName: i % 2 === 0 ? ANTWERPEN_ZUID : ANTWERPEN_NOORD,
  }));
}

// ---------------------------------------------------------------------------
// Excel parsing
// ---------------------------------------------------------------------------

function findCol(headers: string[], ...terms: string[]): number {
  return headers.findIndex((h) => terms.some((t) => h.includes(t)));
}

/**
 * Parse a raw Excel file buffer and return validated rows + critical errors.
 * Pure function — no DB, no FS, no email.
 */
export function parseExcelBuffer(buffer: Buffer): {
  rows: ParsedRow[];
  criticalErrors: string[];
} {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  } catch (err) {
    return {
      rows: [],
      criticalErrors: [
        `File cannot be parsed: ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], criticalErrors: ["Excel file has no sheets."] };
  }

  const rawData = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
  });

  if (rawData.length < 2) {
    return { rows: [], criticalErrors: ["Excel file has no data rows."] };
  }

  const headers = (rawData[0] as unknown[]).map((h) =>
    String(h ?? "").trim().toUpperCase()
  );

  // Case-insensitive substring matching for flexible column names
  const nameCol = findCol(headers, "NAME", "NAAM", "NOM");
  const emailCol = findCol(headers, "MAIL", "EMAIL");
  const phoneCol = findCol(headers, "PHONE", "GSM", "MOBILE", "NUMMER", "TELEPHONE");

  const criticalErrors: string[] = [];
  if (nameCol === -1) {
    criticalErrors.push(
      "Missing FULL NAME column. Expected a column containing 'NAME', 'NAAM', or 'NOM'."
    );
  }
  if (emailCol === -1) {
    criticalErrors.push(
      "Missing MAIL column. Expected a column containing 'MAIL' or 'EMAIL'."
    );
  }
  if (criticalErrors.length > 0) return { rows: [], criticalErrors };

  const rows: ParsedRow[] = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i] as unknown[];
    const rawName = String(row[nameCol] ?? "").trim();
    const rawEmail = String(row[emailCol] ?? "").trim();
    const rawPhone = phoneCol >= 0 ? String(row[phoneCol] ?? "").trim() : "";

    // Silently skip completely blank rows
    if (!rawName && !rawEmail && !rawPhone) continue;

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!rawName) errors.push("Missing FULL NAME");
    if (!rawEmail) errors.push("Missing MAIL");

    const email = normalizeEmail(rawEmail);
    if (rawEmail && !isValidEmail(email)) {
      errors.push(`Invalid email format: ${rawEmail}`);
    }

    if (!rawPhone) warnings.push("Missing PHONE (optional)");

    rows.push({
      rowIndex: i + 1, // 1-based for human-readable display
      fullName: rawName,
      email,
      rawEmail,
      phone: rawPhone,
      valid: errors.length === 0,
      errors,
      warnings,
    });
  }

  return { rows, criticalErrors: [] };
}
