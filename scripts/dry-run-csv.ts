/**
 * Generic CSV dry-run: parse any import CSV and report what would happen.
 * Does NOT touch the database — pure local check.
 * Usage: node --import tsx/esm scripts/dry-run-csv.ts <filename>
 */
import { readFileSync } from "fs";
import { join } from "path";

function normalizeCenterName(raw: string): string | null {
  const lower = raw.trim().toLowerCase();
  if (lower.includes("antwerpen") && lower.includes("noord")) return "GARRINCHA Antwerpen Noord";
  if (lower.includes("antwerpen") && lower.includes("zuid"))  return "GARRINCHA Antwerpen Zuid";
  if (lower.includes("gent") && lower.includes("arsenaal"))   return "GARRINCHA Gent Arsenaal";
  if (lower.includes("gent") && lower.includes("loop"))       return "GARRINCHA Gent The Loop";
  if (lower.includes("kortrijk"))                             return "GARRINCHA Kortrijk";
  if (lower.includes("diegem"))                               return "GARRINCHA Diegem";
  return null;
}

function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function splitLine(line: string): string[] {
  const cells: string[] = []; let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (c === ',' && !inQ) { cells.push(cur); cur = ""; }
    else cur += c;
  }
  cells.push(cur); return cells;
}

const csvFile = process.argv[2] ?? "Kortrijk.csv";
const csvPath = join(process.cwd(), "data", "import", csvFile);
let text = readFileSync(csvPath, "utf8");
if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

const lines = text.split(/\r?\n/).filter(l => l.trim());
const headers = splitLine(lines[0]).map(h => h.trim().toUpperCase());
const nameCol   = headers.findIndex(h => h.includes("NAME") || h.includes("NAAM"));
const emailCol  = headers.findIndex(h => h.includes("MAIL") || h.includes("EMAIL"));
const centerCol = headers.findIndex(h => h.includes("CENTER") || h.includes("CENTRE"));

console.log(`File   : ${csvFile}`);
console.log(`Headers: ${headers.join(" | ")}\n`);

let valid = 0, noEmail = 0, badEmail = 0, fileDupes = 0, blankRows = 0, missingCenter = 0;
const centerCounts = new Map<string, number>();
const emailSet = new Set<string>();
const noEmailSamples: string[] = [];

for (let i = 1; i < lines.length; i++) {
  const cells = splitLine(lines[i]);
  const name   = cells[nameCol]?.trim()  ?? "";
  const rawEmail = cells[emailCol]?.trim() ?? "";
  const email  = rawEmail.toLowerCase();
  const center = centerCol >= 0 ? (cells[centerCol]?.trim() ?? "") : "";

  // Completely blank row
  if (!name && !rawEmail) { blankRows++; continue; }

  // No email — rejected (email is mandatory)
  if (!rawEmail) {
    noEmail++;
    if (noEmailSamples.length < 5) noEmailSamples.push(`row ${i+1}: "${name}"`);
    continue;
  }

  // Bad email format — rejected
  if (!isValidEmail(email)) { badEmail++; continue; }

  // Duplicate within file — rejected
  if (emailSet.has(email)) { fileDupes++; continue; }
  emailSet.add(email);

  const normalized = normalizeCenterName(center);
  if (!normalized) missingCenter++;
  else centerCounts.set(normalized, (centerCounts.get(normalized) ?? 0) + 1);
  valid++;
}

console.log(`Total data rows      : ${lines.length - 1}`);
console.log(`Blank rows (skipped) : ${blankRows}`);
console.log(`No email → REJECTED  : ${noEmail}${noEmailSamples.length ? "\n  e.g. " + noEmailSamples.join("\n       ") : ""}`);
console.log(`Bad email → REJECTED : ${badEmail}`);
console.log(`File duplicates      : ${fileDupes}`);
console.log(`Missing center       : ${missingCenter}`);
console.log(`\nWill be imported     : ${valid}`);
console.log(`\nCenter breakdown:`);
for (const [name, count] of centerCounts) console.log(`  ${name}: ${count}`);
