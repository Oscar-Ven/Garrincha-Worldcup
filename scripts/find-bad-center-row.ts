import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

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

const csvPath = join(process.cwd(), "data", "import", "Diegem.csv");
let text = readFileSync(csvPath, "utf8");
if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

const lines = text.split(/\r?\n/).filter(l => l.trim());
const headers = splitLine(lines[0]).map(h => h.trim().toUpperCase());
const centerCol = headers.findIndex(h => h.includes("CENTER"));
const EXPECTED = "GARRINCHA Diegem";

let fixCount = 0;
const fixed = [lines[0]];

for (let i = 1; i < lines.length; i++) {
  const cells = splitLine(lines[i]);
  const centerVal = cells[centerCol]?.trim() ?? "";
  if (!centerVal.toLowerCase().includes("diegem")) {
    const bytes = [...centerVal].map(c => `U+${c.charCodeAt(0).toString(16).padStart(4,"0")}`).join(" ");
    console.log(`Row ${i+1}: centerCol=${centerCol} value="${centerVal}" bytes=[${bytes}]`);
    console.log(`  Full line: ${lines[i]}`);
    // Overwrite that cell with the correct value
    cells[centerCol] = EXPECTED;
    fixed.push(cells.join(","));
    fixCount++;
  } else {
    fixed.push(lines[i]);
  }
}

if (fixCount > 0) {
  writeFileSync(csvPath, fixed.join("\n"), "utf8");
  console.log(`\nFixed ${fixCount} row(s) — written back to Diegem.csv`);
} else {
  console.log("No rows needed fixing — all CENTER values contain 'diegem'.");
}
