/**
 * Pure helpers for the Antwerpen player import.
 * No side effects — no DB, no file I/O, no email sending.
 * Safe to import in tests without mocking infrastructure.
 */
import "server-only";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ANTWERPEN_ZUID = "GARRINCHA Antwerpen Zuid";
export const ANTWERPEN_NOORD = "GARRINCHA Antwerpen Noord";
export const GENT_ARSENAAL = "GARRINCHA Gent Arsenaal";
export const GENT_THE_LOOP = "GARRINCHA Gent The Loop";
export const KORTRIJK = "GARRINCHA Kortrijk";
export const DIEGEM = "GARRINCHA Diegem";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedRow {
  rowIndex: number;
  fullName: string;
  email: string;      // normalized: trimmed + lowercase
  rawEmail: string;   // original value from cell/column
  phone: string;
  centerName?: string; // from CENTER column if present (already normalized to DB name)
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

export interface ImportReport {
  dryRun: DryRunReport;
  accountsCreated: number;
  accountsSkippedExisting: number;
  accountsFailedCreate: number;
  jobsCreated: number;
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
// Center helpers
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

/**
 * Map a raw CENTER column value (as found in the CSV) to the canonical DB name.
 * Returns null if the value is unrecognized.
 */
export function normalizeCenterName(raw: string): string | null {
  const lower = raw.trim().toLowerCase();
  if (lower.includes("antwerpen") && lower.includes("noord")) return ANTWERPEN_NOORD;
  if (lower.includes("antwerpen") && lower.includes("zuid")) return ANTWERPEN_ZUID;
  if (lower.includes("gent") && lower.includes("arsenaal")) return GENT_ARSENAAL;
  if (lower.includes("gent") && lower.includes("loop")) return GENT_THE_LOOP;
  if (lower.includes("kortrijk")) return KORTRIJK;
  if (lower.includes("diegem"))   return DIEGEM;
  return null;
}

/**
 * Map a DB center name to the display name used in invitation emails.
 * Gent sub-centers both show as "GARRINCHA Gent".
 */
export function centerDisplayName(centerName: string): string {
  const lower = centerName.toLowerCase();
  if (lower.includes("gent")) return "GARRINCHA Gent";
  return centerName;
}

// ---------------------------------------------------------------------------
// Shared column finder
// ---------------------------------------------------------------------------

function findCol(headers: string[], ...terms: string[]): number {
  return headers.findIndex((h) => terms.some((t) => h.includes(t)));
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

/**
 * Parse a UTF-8 CSV buffer (with optional BOM) and return validated rows.
 * Supports CENTER column — values are normalized to canonical DB names.
 */
export function parseCsvBuffer(buffer: Buffer): {
  rows: ParsedRow[];
  criticalErrors: string[];
} {
  let text = buffer.toString("utf8");
  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], criticalErrors: ["CSV file has no data rows."] };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toUpperCase());
  const nameCol = findCol(headers, "NAME", "NAAM", "NOM");
  const emailCol = findCol(headers, "MAIL", "EMAIL");
  const phoneCol = findCol(headers, "PHONE", "GSM", "MOBILE", "NUMMER", "TELEPHONE");
  const centerCol = findCol(headers, "CENTER", "CENTRE", "CENTRUM");

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

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const rawName = cells[nameCol]?.trim() ?? "";
    const rawEmail = cells[emailCol]?.trim() ?? "";
    const rawPhone = phoneCol >= 0 ? (cells[phoneCol]?.trim() ?? "") : "";
    const rawCenter = centerCol >= 0 ? (cells[centerCol]?.trim() ?? "") : "";

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

    // Normalize center name: "Garrincha Antwerpen Noord" → "GARRINCHA Antwerpen Noord"
    const centerName = rawCenter ? (normalizeCenterName(rawCenter) ?? undefined) : undefined;

    rows.push({
      rowIndex: i + 1,
      fullName: rawName,
      email,
      rawEmail,
      phone: rawPhone,
      centerName,
      valid: errors.length === 0,
      errors,
      warnings,
    });
  }

  return { rows, criticalErrors: [] };
}
