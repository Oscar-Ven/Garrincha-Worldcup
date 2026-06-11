import { describe, expect, it } from "vitest";
import { generateSessionCode, sessionExpiresAt } from "@/lib/checkin";

// ── 1. Code generation ───────────────────────────────────────────────────────

describe("1. Admin can generate a session code", () => {
  const SAFE_CHARS = new Set("ABCDEFGHJKMNPQRTUVWXYZ23456789");

  it("generateSessionCode returns exactly 6 characters", () => {
    expect(generateSessionCode()).toHaveLength(6);
  });

  it("all characters belong to the safe alphabet (no ambiguous 0/O/I/L)", () => {
    for (let i = 0; i < 100; i++) {
      for (const ch of generateSessionCode()) {
        expect(SAFE_CHARS.has(ch), `Unexpected char '${ch}'`).toBe(true);
      }
    }
  });
});

// ── 2. Session expiry (24 hours for center QR sessions) ─────────────────────

describe("2. Session code expires in 24 hours", () => {
  it("sessionExpiresAt returns a date ~24 hours in the future", () => {
    const before = Date.now();
    const exp = sessionExpiresAt().getTime();
    const after = Date.now();
    const expected = 24 * 60 * 60 * 1000;
    expect(exp).toBeGreaterThanOrEqual(before + expected - 500);
    expect(exp).toBeLessThanOrEqual(after + expected + 500);
  });
});

// ── 3. Prediction scoring unaffected ────────────────────────────────────────

describe("3. Prediction scoring is unaffected by code system changes", () => {
  it("calculatePredictionPoints still returns correct values", async () => {
    const { calculatePredictionPoints } = await import("@/lib/scoring");
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(5);
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 0, awayScore: 3 })).toBe(0);
  });
});
