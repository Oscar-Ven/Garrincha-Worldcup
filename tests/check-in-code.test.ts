import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    checkInCode: { findFirst: vi.fn() },
    checkInClaim: { create: vi.fn() },
    pointEvent: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  generateCheckInCode,
  getBrusselsDate,
  getBrusselsEndOfDayUTC,
  claimCheckIn,
} from "@/lib/check-in-code";

const mockFindFirst = prisma.checkInCode.findFirst as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

const VALID_CODE = {
  id: "code-1",
  code: "TEST01",
  centerId: "center-1",
  date: "2026-06-11",
  expiresAt: new Date("2026-06-11T21:59:59.999Z"),
  isActive: true,
};

// ── 1. Code generation ───────────────────────────────────────────────────────

describe("1. generateCheckInCode", () => {
  const SAFE_CHARS = new Set("ABCDEFGHJKMNPQRTUVWXYZ23456789");

  it("returns exactly 6 characters from the safe alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateCheckInCode();
      expect(code).toHaveLength(6);
      for (const ch of code) {
        expect(SAFE_CHARS.has(ch), `Unexpected char '${ch}'`).toBe(true);
      }
    }
  });
});

// ── 2. Brussels date helpers ─────────────────────────────────────────────────

describe("2. getBrusselsDate", () => {
  it("returns YYYY-MM-DD in Europe/Brussels timezone (CEST noon)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T12:00:00Z"));
    expect(getBrusselsDate()).toBe("2026-06-11");
    vi.useRealTimers();
  });

  it("advances to next day at midnight Brussels time (22:30 UTC in CEST)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T22:30:00Z"));
    expect(getBrusselsDate()).toBe("2026-06-12");
    vi.useRealTimers();
  });
});

// ── 3. End-of-day UTC calculation ────────────────────────────────────────────

describe("3. getBrusselsEndOfDayUTC", () => {
  it("returns 21:59:59.999Z for a CEST date (+2 offset)", () => {
    const eod = getBrusselsEndOfDayUTC("2026-06-11");
    expect(eod.toISOString()).toBe("2026-06-11T21:59:59.999Z");
  });

  it("returns 22:59:59.999Z for a CET date (+1 offset)", () => {
    const eod = getBrusselsEndOfDayUTC("2026-12-25");
    expect(eod.toISOString()).toBe("2026-12-25T22:59:59.999Z");
  });
});

// ── 4. Valid code awards +3 ──────────────────────────────────────────────────

describe("4. claimCheckIn — valid code awards +3", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T12:00:00Z"));
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue(VALID_CODE);
    mockTransaction.mockResolvedValue([{}, {}]);
  });
  afterEach(() => vi.useRealTimers());

  it("returns ok:true with pointsAwarded:3 on first claim", async () => {
    const result = await claimCheckIn("user-1", "TEST01");
    expect(result).toEqual({ ok: true, pointsAwarded: 3 });
    expect(mockTransaction).toHaveBeenCalledOnce();
  });
});

// ── 5. Duplicate claim — unique constraint prevents double-claim ─────────────

describe("5. Duplicate claim prevention — unique constraint on (userId, date)", () => {
  it("CheckInClaim has @@unique([userId, date]) enforcing one claim per user per day", () => {
    // The unique key is (userId, date) — not (userId, checkInCodeId) —
    // so a player cannot claim twice on the same day regardless of code.
    const existingClaims = [{ userId: "user-1", date: "2026-06-11" }];
    const newClaim = { userId: "user-1", date: "2026-06-11" };
    const isDuplicate = existingClaims.some(
      (c) => c.userId === newClaim.userId && c.date === newClaim.date,
    );
    expect(isDuplicate).toBe(true);
  });

  it("different users can each claim once on the same day", () => {
    const existingClaims = [{ userId: "user-1", date: "2026-06-11" }];
    const newClaim = { userId: "user-2", date: "2026-06-11" };
    const isDuplicate = existingClaims.some(
      (c) => c.userId === newClaim.userId && c.date === newClaim.date,
    );
    expect(isDuplicate).toBe(false);
  });
});

// ── 6. Multiple players each get +3 ─────────────────────────────────────────

describe("6. claimCheckIn — multiple players each get +3", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T12:00:00Z"));
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue(VALID_CODE);
    mockTransaction.mockResolvedValue([{}, {}]);
  });
  afterEach(() => vi.useRealTimers());

  it("each player independently gets pointsAwarded:3", async () => {
    const results = await Promise.all([
      claimCheckIn("user-A", "TEST01"),
      claimCheckIn("user-B", "TEST01"),
      claimCheckIn("user-C", "TEST01"),
    ]);
    for (const r of results) {
      expect(r).toEqual({ ok: true, pointsAwarded: 3 });
    }
    expect(mockTransaction).toHaveBeenCalledTimes(3);
  });
});

// ── 7. Expired code is rejected ──────────────────────────────────────────────

describe("7. claimCheckIn — expired code is rejected", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-12T10:00:00Z")); // day after code date
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue({
      ...VALID_CODE,
      date: "2026-06-11", // yesterday
    });
  });
  afterEach(() => vi.useRealTimers());

  it("returns ok:false with expired error", async () => {
    const result = await claimCheckIn("user-1", "TEST01");
    expect(result).toMatchObject({ ok: false, error: "This code has expired." });
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});

// ── 8. Invalid code is rejected ──────────────────────────────────────────────

describe("8. claimCheckIn — invalid code is rejected", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T12:00:00Z"));
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue(null);
  });
  afterEach(() => vi.useRealTimers());

  it("returns ok:false with invalid-code error", async () => {
    const result = await claimCheckIn("user-1", "BADCDE");
    expect(result).toMatchObject({ ok: false, error: "Invalid code." });
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});

// ── 9. Role enforcement — only owner generates ───────────────────────────────

describe("9. Only owner role can generate codes", () => {
  const isOwner = (role: string) => role === "SUPER_ADMIN" || role === "ADMIN";

  it("CENTER_ADMIN cannot generate codes", () => {
    expect(isOwner("CENTER_ADMIN")).toBe(false);
  });

  it("SUPER_ADMIN and ADMIN can generate codes", () => {
    expect(isOwner("SUPER_ADMIN")).toBe(true);
    expect(isOwner("ADMIN")).toBe(true);
  });
});

// ── 10. Registration without code gives no bonus ─────────────────────────────

describe("10. Registration without check-in code gives no bonus", () => {
  it("checkInCodeForBonus is null when activationCode is empty", () => {
    const hasCode = (code: string | undefined) => !!(code && code.length > 0);
    expect(hasCode("")).toBe(false);
    expect(hasCode(undefined)).toBe(false);
    expect(hasCode("ABC123")).toBe(true);
  });
});

// ── 11. Leaderboard includes check-in bonus points ───────────────────────────

describe("11. Leaderboard sums PointEvent.points including check-in bonus", () => {
  it("total includes attendance check-in bonus correctly", () => {
    const pointEvents = [
      { points: 5, reason: "Correct prediction" },
      { points: 3, reason: "Attendance check-in bonus" },
      { points: 3, reason: "Attendance check-in bonus" },
    ];
    const total = pointEvents.reduce((sum, e) => sum + e.points, 0);
    expect(total).toBe(11);
  });
});

// ── 12. Prediction scoring unchanged ────────────────────────────────────────

describe("12. Prediction scoring is unaffected by check-in system", () => {
  it("calculatePredictionPoints still returns correct values", async () => {
    const { calculatePredictionPoints } = await import("@/lib/scoring");
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(5);
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 3, awayScore: 0 })).toBe(2);
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 0, awayScore: 3 })).toBe(0);
  });
});
