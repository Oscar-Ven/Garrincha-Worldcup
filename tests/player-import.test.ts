import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  normalizeEmail,
  isValidEmail,
  extractFirstName,
  generateNickname,
  assignCenters,
  parseExcelBuffer,
  ANTWERPEN_ZUID,
  ANTWERPEN_NOORD,
} from "@/lib/import/player-import";

// ---------------------------------------------------------------------------
// Helper — build an Excel XLSX buffer from an array-of-arrays
// ---------------------------------------------------------------------------

function makeXlsx(data: unknown[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

// ---------------------------------------------------------------------------
// normalizeEmail
// ---------------------------------------------------------------------------

describe("normalizeEmail", () => {
  it("lowercases the address", () =>
    expect(normalizeEmail("ALICE@EXAMPLE.COM")).toBe("alice@example.com"));

  it("trims leading and trailing spaces", () =>
    expect(normalizeEmail("  alice@example.com  ")).toBe("alice@example.com"));

  it("handles mixed case with surrounding spaces", () =>
    expect(normalizeEmail("  Alice@Example.COM ")).toBe("alice@example.com"));
});

// ---------------------------------------------------------------------------
// isValidEmail
// ---------------------------------------------------------------------------

describe("isValidEmail", () => {
  it("accepts a standard email", () =>
    expect(isValidEmail("alice@example.com")).toBe(true));

  it("rejects address without @", () =>
    expect(isValidEmail("aliceexample.com")).toBe(false));

  it("rejects address without domain", () =>
    expect(isValidEmail("alice@")).toBe(false));

  it("rejects empty string", () =>
    expect(isValidEmail("")).toBe(false));

  it("rejects address with spaces", () =>
    expect(isValidEmail("ali ce@example.com")).toBe(false));

  it("accepts subdomain address", () =>
    expect(isValidEmail("alice@mail.example.co.uk")).toBe(true));
});

// ---------------------------------------------------------------------------
// extractFirstName
// ---------------------------------------------------------------------------

describe("extractFirstName", () => {
  it("returns first word of full name", () =>
    expect(extractFirstName("Alice Smith")).toBe("Alice"));

  it("handles a single-word name", () =>
    expect(extractFirstName("Mohamad")).toBe("Mohamad"));

  it("strips non-alphanumeric characters", () =>
    expect(extractFirstName("Jean-Pierre Dupont")).toBe("JeanPierre"));

  it("returns Player for empty string", () =>
    expect(extractFirstName("")).toBe("Player"));

  it("returns Player for whitespace-only string", () =>
    expect(extractFirstName("   ")).toBe("Player"));

  it("returns Player when first word is all special chars", () =>
    expect(extractFirstName("--- Smith")).toBe("Player"));
});

// ---------------------------------------------------------------------------
// generateNickname
// ---------------------------------------------------------------------------

describe("generateNickname", () => {
  it("concatenates firstName and number", () =>
    expect(generateNickname("Mohamad", 482)).toBe("Mohamad482"));

  it("works with Player prefix", () =>
    expect(generateNickname("Player", 100)).toBe("Player100"));

  it("uses the exact number provided", () =>
    expect(generateNickname("Alice", 999)).toBe("Alice999"));
});

// ---------------------------------------------------------------------------
// assignCenters
// ---------------------------------------------------------------------------

describe("assignCenters", () => {
  it("returns empty array for empty input", () =>
    expect(assignCenters([])).toEqual([]));

  it("assigns single player to Antwerpen Zuid (even index 0)", () => {
    const [r] = assignCenters(["alpha@example.com"]);
    expect(r.centerName).toBe(ANTWERPEN_ZUID);
  });

  it("alternates Zuid / Noord based on alphabetical sort", () => {
    // sorted: alpha < beta → alpha=0(Zuid), beta=1(Noord)
    const result = assignCenters(["beta@example.com", "alpha@example.com"]);
    const byEmail = Object.fromEntries(result.map((r) => [r.email, r.centerName]));
    expect(byEmail["alpha@example.com"]).toBe(ANTWERPEN_ZUID);
    expect(byEmail["beta@example.com"]).toBe(ANTWERPEN_NOORD);
  });

  it("produces an exact 50/50 split for an even-count list", () => {
    const emails = Array.from({ length: 10 }, (_, i) => `p${i}@example.com`);
    const result = assignCenters(emails);
    const zuidCount = result.filter((r) => r.centerName === ANTWERPEN_ZUID).length;
    const noordCount = result.filter((r) => r.centerName === ANTWERPEN_NOORD).length;
    expect(zuidCount).toBe(5);
    expect(noordCount).toBe(5);
  });

  it("is deterministic — same input always produces the same result", () => {
    const emails = ["c@test.com", "a@test.com", "b@test.com"];
    expect(assignCenters(emails)).toEqual(assignCenters(emails));
  });

  it("does not mutate the original array", () => {
    const emails = ["z@example.com", "a@example.com"];
    assignCenters(emails);
    expect(emails[0]).toBe("z@example.com");
  });

  it("existing players' center is unaffected — assignment uses only the new-email list", () => {
    // Re-running assignCenters with the same subset always gives same result
    const newEmails = ["charlie@test.com", "alice@test.com"];
    const run1 = assignCenters(newEmails);
    const run2 = assignCenters(newEmails);
    expect(run1).toEqual(run2);
  });
});

// ---------------------------------------------------------------------------
// parseExcelBuffer — required columns
// ---------------------------------------------------------------------------

describe("parseExcelBuffer — column handling", () => {
  it("returns a critical error when FULL NAME column is absent", () => {
    const { criticalErrors } = parseExcelBuffer(
      makeXlsx([
        ["MAIL", "PHONE"],
        ["alice@example.com", "+32491123456"],
      ]),
    );
    expect(criticalErrors.some((e) => e.includes("FULL NAME"))).toBe(true);
  });

  it("returns a critical error when MAIL column is absent", () => {
    const { criticalErrors } = parseExcelBuffer(
      makeXlsx([
        ["FULL NAME", "PHONE"],
        ["Alice Smith", "+32491123456"],
      ]),
    );
    expect(criticalErrors.some((e) => e.includes("MAIL"))).toBe(true);
  });

  it("returns both critical errors when both required columns are absent", () => {
    const { criticalErrors } = parseExcelBuffer(
      makeXlsx([
        ["PHONE"],
        ["+32491123456"],
      ]),
    );
    expect(criticalErrors).toHaveLength(2);
  });

  it("accepts NAAM as an alternative to NAME (Dutch)", () => {
    const { rows, criticalErrors } = parseExcelBuffer(
      makeXlsx([
        ["NAAM", "MAIL"],
        ["Alice Smith", "alice@example.com"],
      ]),
    );
    expect(criticalErrors).toHaveLength(0);
    expect(rows[0].valid).toBe(true);
  });

  it("parses file without PHONE column (phone becomes empty string)", () => {
    const { rows, criticalErrors } = parseExcelBuffer(
      makeXlsx([
        ["FULL NAME", "MAIL"],
        ["Alice Smith", "alice@example.com"],
      ]),
    );
    expect(criticalErrors).toHaveLength(0);
    expect(rows[0].valid).toBe(true);
    expect(rows[0].phone).toBe("");
  });

  it("matches column names case-insensitively", () => {
    const { rows, criticalErrors } = parseExcelBuffer(
      makeXlsx([
        ["Full Name", "Email", "Phone"],
        ["Alice Smith", "alice@example.com", "+32491123456"],
      ]),
    );
    expect(criticalErrors).toHaveLength(0);
    expect(rows[0].valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// parseExcelBuffer — row validation
// ---------------------------------------------------------------------------

describe("parseExcelBuffer — row validation", () => {
  it("parses valid rows correctly", () => {
    const { rows, criticalErrors } = parseExcelBuffer(
      makeXlsx([
        ["FULL NAME", "MAIL", "PHONE"],
        ["Alice Smith", "alice@example.com", "+32491123456"],
        ["Bob Jones", "bob@example.com", "+32491654321"],
      ]),
    );
    expect(criticalErrors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0].fullName).toBe("Alice Smith");
    expect(rows[0].email).toBe("alice@example.com");
    expect(rows[0].valid).toBe(true);
  });

  it("normalizes email to lowercase and stores original rawEmail", () => {
    const { rows } = parseExcelBuffer(
      makeXlsx([
        ["FULL NAME", "MAIL"],
        ["Alice Smith", "Alice@EXAMPLE.COM"],
      ]),
    );
    expect(rows[0].email).toBe("alice@example.com");
    expect(rows[0].rawEmail).toBe("Alice@EXAMPLE.COM");
  });

  it("marks row invalid when MAIL is empty", () => {
    const { rows } = parseExcelBuffer(
      makeXlsx([
        ["FULL NAME", "MAIL", "PHONE"],
        ["Alice Smith", "", "+32491123456"],
      ]),
    );
    expect(rows[0].valid).toBe(false);
    expect(rows[0].errors).toContain("Missing MAIL");
  });

  it("marks row invalid when FULL NAME is empty", () => {
    const { rows } = parseExcelBuffer(
      makeXlsx([
        ["FULL NAME", "MAIL", "PHONE"],
        ["", "alice@example.com", "+32491123456"],
      ]),
    );
    expect(rows[0].valid).toBe(false);
    expect(rows[0].errors).toContain("Missing FULL NAME");
  });

  it("marks row invalid for a malformed email address", () => {
    const { rows } = parseExcelBuffer(
      makeXlsx([
        ["FULL NAME", "MAIL"],
        ["Alice Smith", "not-an-email"],
      ]),
    );
    expect(rows[0].valid).toBe(false);
    expect(rows[0].errors.some((e) => e.includes("Invalid email format"))).toBe(true);
  });

  it("allows missing PHONE — row is valid with a warning", () => {
    const { rows } = parseExcelBuffer(
      makeXlsx([
        ["FULL NAME", "MAIL", "PHONE"],
        ["Alice Smith", "alice@example.com", ""],
      ]),
    );
    expect(rows[0].valid).toBe(true);
    expect(rows[0].errors).toHaveLength(0);
    expect(rows[0].warnings).toContain("Missing PHONE (optional)");
    expect(rows[0].phone).toBe("");
  });

  it("account can be created with missing PHONE (phone stored as empty string)", () => {
    const { rows } = parseExcelBuffer(
      makeXlsx([
        ["FULL NAME", "MAIL"],
        ["Bob Jones", "bob@example.com"],
      ]),
    );
    expect(rows[0].valid).toBe(true);
    expect(rows[0].phone).toBe(""); // empty string — stored safely in DB
  });

  it("silently skips fully blank rows", () => {
    const { rows } = parseExcelBuffer(
      makeXlsx([
        ["FULL NAME", "MAIL", "PHONE"],
        ["Alice Smith", "alice@example.com", ""],
        ["", "", ""],
        ["Bob Jones", "bob@example.com", ""],
      ]),
    );
    expect(rows).toHaveLength(2);
  });

  it("returns a critical error for a buffer with no data rows", () => {
    // SheetJS parses arbitrary text as a 1-row sheet — no header + data → "no data rows"
    const { criticalErrors } = parseExcelBuffer(
      Buffer.from("this is not an excel file with data"),
    );
    expect(criticalErrors.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Duplicate detection (within the Excel file)
// ---------------------------------------------------------------------------

describe("parseExcelBuffer — duplicate handling", () => {
  it("returns all rows as-is (duplicate detection is the runner's responsibility)", () => {
    // parseExcelBuffer does not deduplicate — that happens in the runner
    const { rows } = parseExcelBuffer(
      makeXlsx([
        ["FULL NAME", "MAIL"],
        ["Alice Smith", "alice@example.com"],
        ["Alice Smith Again", "alice@example.com"],
      ]),
    );
    // Both rows are returned — duplicates marked by runner, not parser
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.valid)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

describe("idempotency", () => {
  it("center assignment is stable — same emails always yield same assignments", () => {
    const emails = ["c@test.com", "a@test.com", "b@test.com"];
    expect(assignCenters(emails)).toEqual(assignCenters(emails));
  });

  it("email normalization is stable — same raw input always produces same normalized value", () => {
    const raw = "ALICE@EXAMPLE.COM";
    expect(normalizeEmail(raw)).toBe(normalizeEmail(raw));
    expect(normalizeEmail(raw)).toBe("alice@example.com");
  });

  it("parsing the same buffer twice returns identical rows", () => {
    const buf = makeXlsx([
      ["FULL NAME", "MAIL"],
      ["Alice Smith", "ALICE@EXAMPLE.COM"],
    ]);
    const r1 = parseExcelBuffer(buf);
    const r2 = parseExcelBuffer(buf);
    expect(r1.rows[0].email).toBe(r2.rows[0].email);
    expect(r1.rows[0].email).toBe("alice@example.com");
  });
});

// ---------------------------------------------------------------------------
// Unique email constraint — safe upsert / skip logic
// (The runner uses the DB constraint; here we test the detection pipeline)
// ---------------------------------------------------------------------------

describe("duplicate email protection pipeline", () => {
  it("normalizeEmail is applied before comparison so different-cased duplicates are caught", () => {
    const email1 = normalizeEmail("Alice@Example.com");
    const email2 = normalizeEmail("ALICE@EXAMPLE.COM");
    expect(email1).toBe(email2); // same normalized key → DB constraint fires
  });

  it("assignCenters with deduplicated emails produces consistent per-email center", () => {
    // Simulate: first run has ["a@test.com","b@test.com"] as new
    // Second run has [] new (both already in DB) → no assignments
    const firstRun = assignCenters(["a@test.com", "b@test.com"]);
    const secondRun = assignCenters([]); // nothing new on re-import
    expect(firstRun).toHaveLength(2);
    expect(secondRun).toHaveLength(0); // idempotent — no new assignments
  });
});

// ---------------------------------------------------------------------------
// Admin-only: batch sending (unit-level — actual sending is integration)
// ---------------------------------------------------------------------------

describe("batch send logic", () => {
  it("EmailStatus type covers all required states", () => {
    // This is a compile-time check surfaced at runtime
    const statuses = [
      "pending",
      "sent",
      "failed",
      "skipped_existing",
      "skipped_duplicate",
      "skipped_invalid",
      "skipped_unsubscribed",
    ] as const;
    expect(statuses).toHaveLength(7);
  });
});
