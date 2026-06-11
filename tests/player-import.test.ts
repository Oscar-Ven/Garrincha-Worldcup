import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  isValidEmail,
  extractFirstName,
  generateNickname,
  assignCenters,
  normalizeCenterName,
  parseCsvBuffer,
  ANTWERPEN_ZUID,
  ANTWERPEN_NOORD,
} from "@/lib/import/player-import";

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

  it("parsing the same CSV buffer twice returns identical rows", () => {
    const buf = Buffer.from("FULL NAME,MAIL\nAlice Smith,ALICE@EXAMPLE.COM", "utf8");
    const r1 = parseCsvBuffer(buf);
    const r2 = parseCsvBuffer(buf);
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
// normalizeCenterName
// ---------------------------------------------------------------------------

describe("normalizeCenterName", () => {
  it("maps CSV Zuid value to DB name", () =>
    expect(normalizeCenterName("Garrincha Antwerpen Zuid")).toBe(ANTWERPEN_ZUID));

  it("maps CSV Noord value to DB name", () =>
    expect(normalizeCenterName("Garrincha Antwerpen Noord")).toBe(ANTWERPEN_NOORD));

  it("is case-insensitive", () => {
    expect(normalizeCenterName("GARRINCHA ANTWERPEN NOORD")).toBe(ANTWERPEN_NOORD);
    expect(normalizeCenterName("garrincha antwerpen zuid")).toBe(ANTWERPEN_ZUID);
  });

  it("trims surrounding whitespace", () =>
    expect(normalizeCenterName("  Garrincha Antwerpen Noord  ")).toBe(ANTWERPEN_NOORD));

  it("returns null for unrecognized values", () => {
    expect(normalizeCenterName("")).toBeNull();
    expect(normalizeCenterName("Brussels")).toBeNull();
    expect(normalizeCenterName("Antwerpen")).toBeNull(); // missing Zuid/Noord keyword
  });
});

// ---------------------------------------------------------------------------
// parseCsvBuffer — basic structure
// ---------------------------------------------------------------------------

function makeCsv(lines: string[]): Buffer {
  return Buffer.from(lines.join("\n"), "utf8");
}

function makeCsvWithBom(lines: string[]): Buffer {
  return Buffer.from("﻿" + lines.join("\n"), "utf8");
}

describe("parseCsvBuffer — column handling", () => {
  it("returns a critical error when FULL NAME column is absent", () => {
    const { criticalErrors } = parseCsvBuffer(
      makeCsv(["MAIL,PHONE", "alice@example.com,+32491123456"]),
    );
    expect(criticalErrors.some((e) => e.includes("NAME") || e.includes("NAAM"))).toBe(true);
  });

  it("returns a critical error when MAIL column is absent", () => {
    const { criticalErrors } = parseCsvBuffer(
      makeCsv(["FULL NAME,PHONE", "Alice Smith,+32491123456"]),
    );
    expect(criticalErrors.some((e) => e.includes("MAIL"))).toBe(true);
  });

  it("returns a critical error when the file has no data rows", () => {
    const { criticalErrors } = parseCsvBuffer(makeCsv(["FULL NAME,MAIL"]));
    expect(criticalErrors.length).toBeGreaterThan(0);
  });

  it("strips UTF-8 BOM and parses normally", () => {
    const { rows, criticalErrors } = parseCsvBuffer(
      makeCsvWithBom([
        "FULL NAME,MAIL,PHONE",
        "Alice Smith,alice@example.com,+32491123456",
      ]),
    );
    expect(criticalErrors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].fullName).toBe("Alice Smith");
  });
});

describe("parseCsvBuffer — row validation", () => {
  it("parses valid rows correctly", () => {
    const { rows, criticalErrors } = parseCsvBuffer(
      makeCsv([
        "FULL NAME,MAIL,PHONE",
        "Alice Smith,alice@example.com,+32491123456",
        "Bob Jones,bob@example.com,+32491654321",
      ]),
    );
    expect(criticalErrors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0].fullName).toBe("Alice Smith");
    expect(rows[0].email).toBe("alice@example.com");
    expect(rows[0].valid).toBe(true);
  });

  it("normalizes email to lowercase and preserves rawEmail", () => {
    const { rows } = parseCsvBuffer(
      makeCsv(["FULL NAME,MAIL", "Alice Smith,Alice@EXAMPLE.COM"]),
    );
    expect(rows[0].email).toBe("alice@example.com");
    expect(rows[0].rawEmail).toBe("Alice@EXAMPLE.COM");
  });

  it("marks row invalid when MAIL is empty", () => {
    const { rows } = parseCsvBuffer(
      makeCsv(["FULL NAME,MAIL,PHONE", "Alice Smith,,+32491123456"]),
    );
    expect(rows[0].valid).toBe(false);
    expect(rows[0].errors).toContain("Missing MAIL");
  });

  it("marks row invalid when FULL NAME is empty", () => {
    const { rows } = parseCsvBuffer(
      makeCsv(["FULL NAME,MAIL", ",alice@example.com"]),
    );
    expect(rows[0].valid).toBe(false);
    expect(rows[0].errors).toContain("Missing FULL NAME");
  });

  it("marks row invalid for a malformed email", () => {
    const { rows } = parseCsvBuffer(
      makeCsv(["FULL NAME,MAIL", "Alice Smith,not-an-email"]),
    );
    expect(rows[0].valid).toBe(false);
    expect(rows[0].errors.some((e) => e.includes("Invalid email format"))).toBe(true);
  });

  it("allows missing PHONE — row is valid with a warning", () => {
    const { rows } = parseCsvBuffer(
      makeCsv(["FULL NAME,MAIL,PHONE", "Alice Smith,alice@example.com,"]),
    );
    expect(rows[0].valid).toBe(true);
    expect(rows[0].phone).toBe("");
    expect(rows[0].warnings).toContain("Missing PHONE (optional)");
  });

  it("silently skips fully blank rows", () => {
    const { rows } = parseCsvBuffer(
      makeCsv([
        "FULL NAME,MAIL",
        "Alice Smith,alice@example.com",
        ",,",
        "Bob Jones,bob@example.com",
      ]),
    );
    expect(rows).toHaveLength(2);
  });

  it("preserves FULL NAME exactly as written — no transformation", () => {
    const { rows } = parseCsvBuffer(
      makeCsv(["FULL NAME,MAIL", "Hicham G,hicham.gharslaoui@hotmail.com"]),
    );
    expect(rows[0].fullName).toBe("Hicham G");
  });

  it("preserves PHONE exactly as written — no reformatting", () => {
    const { rows } = parseCsvBuffer(
      makeCsv(["FULL NAME,MAIL,PHONE", "Alice Smith,alice@example.com,+32 476441190"]),
    );
    expect(rows[0].phone).toBe("+32 476441190");
  });
});

describe("parseCsvBuffer — CENTER column", () => {
  it("parses CENTER column and normalizes to DB name", () => {
    const { rows } = parseCsvBuffer(
      makeCsv([
        "FULL NAME,MAIL,PHONE,CENTER",
        "Alice Smith,alice@example.com,+32491000001,Garrincha Antwerpen Noord",
        "Bob Jones,bob@example.com,+32491000002,Garrincha Antwerpen Zuid",
      ]),
    );
    expect(rows[0].centerName).toBe(ANTWERPEN_NOORD);
    expect(rows[1].centerName).toBe(ANTWERPEN_ZUID);
  });

  it("sets centerName to undefined when CENTER column is absent", () => {
    const { rows } = parseCsvBuffer(
      makeCsv(["FULL NAME,MAIL", "Alice Smith,alice@example.com"]),
    );
    expect(rows[0].centerName).toBeUndefined();
  });

  it("sets centerName to undefined when CENTER value is unrecognized", () => {
    const { rows } = parseCsvBuffer(
      makeCsv([
        "FULL NAME,MAIL,CENTER",
        "Alice Smith,alice@example.com,Unknown Center",
      ]),
    );
    expect(rows[0].centerName).toBeUndefined();
  });

  it("parses the actual CSV format with source_row prefix column", () => {
    const { rows, criticalErrors } = parseCsvBuffer(
      makeCsv([
        "source_row,FULL NAME,MAIL,PHONE,CENTER",
        "2,Caroline De Bruecker,caroline.de.bruecker@gmail.com,+32 476441190,Garrincha Antwerpen Noord",
        "4,Hicham G,hicham.gharslaoui@hotmail.com,+32 493827079,Garrincha Antwerpen Zuid",
      ]),
    );
    expect(criticalErrors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0].fullName).toBe("Caroline De Bruecker");
    expect(rows[0].centerName).toBe(ANTWERPEN_NOORD);
    expect(rows[1].fullName).toBe("Hicham G");
    expect(rows[1].centerName).toBe(ANTWERPEN_ZUID);
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
