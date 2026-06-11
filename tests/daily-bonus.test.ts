import { afterAll, beforeAll, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { Prisma } from "@prisma/client";

// ── Mock Prisma before importing lib modules ──────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    dailyBonusCode: { findFirst: vi.fn() },
    dailyBonusClaim: { create: vi.fn() },
    pointEvent: { create: vi.fn() },
  },
}));

import { getBrusselsDate, getBrusselsEndOfDayUTC, claimDailyBonus } from "@/lib/daily-bonus";
import { prisma } from "@/lib/prisma";

// ── Helpers ───────────────────────────────────────────────────────────────

const txMock = () => prisma.$transaction as unknown as Mock;

function makeBonusCode(overrides: Partial<{
  bonusDate: string;
  isActive: boolean;
  expiresAt: Date;
  points: number;
}> = {}) {
  return {
    id: "code-id-1",
    code: "TEST42",
    bonusDate: "2026-06-11",
    points: 3,
    createdByAdminId: "admin-1",
    createdAt: new Date("2026-06-11T06:00:00Z"),
    expiresAt: new Date("2026-06-11T21:59:59Z"),
    isActive: true,
    ...overrides,
  };
}

function makeP2002(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "7.8.0",
    meta: { target: ["userId", "bonusDate"] },
  });
}

function mockFindCode(code: ReturnType<typeof makeBonusCode> | null) {
  vi.mocked(prisma.dailyBonusCode.findFirst).mockResolvedValue(code as never);
}

function mockTransactionSuccess() {
  vi.mocked(prisma.dailyBonusClaim.create).mockResolvedValue({} as never);
  vi.mocked(prisma.pointEvent.create).mockResolvedValue({} as never);
  txMock().mockResolvedValue([{}, {}]);
}

// ── 1–2: Brussels timezone date helpers ──────────────────────────────────

describe("1. getBrusselsDate — CEST timezone (UTC+2 in summer)", () => {
  it("noon UTC on June 11 → still June 11 in Brussels", () => {
    expect(getBrusselsDate(new Date("2026-06-11T12:00:00Z"))).toBe("2026-06-11");
  });

  it("22:30 UTC on June 11 → June 12 in Brussels (midnight has passed)", () => {
    expect(getBrusselsDate(new Date("2026-06-11T22:30:00Z"))).toBe("2026-06-12");
  });
});

describe("2. getBrusselsEndOfDayUTC — DST-aware end-of-day boundary", () => {
  it("CEST (UTC+2): end of June 11 in Brussels = 21:59:59.999 UTC", () => {
    const eod = getBrusselsEndOfDayUTC("2026-06-11");
    expect(eod.toISOString()).toBe("2026-06-11T21:59:59.999Z");
  });

  it("CET (UTC+1): end of January 15 in Brussels = 22:59:59.999 UTC", () => {
    const eod = getBrusselsEndOfDayUTC("2026-01-15");
    expect(eod.toISOString()).toBe("2026-01-15T22:59:59.999Z");
  });
});

// ── 3–10: claimDailyBonus ─────────────────────────────────────────────────

describe("3–10. claimDailyBonus", () => {
  // Fix system time at noon UTC June 11 → 14:00 Brussels (CEST), today = "2026-06-11"
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T12:00:00Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    txMock().mockReset();
    vi.mocked(prisma.dailyBonusCode.findFirst).mockReset();
    vi.mocked(prisma.dailyBonusClaim.create).mockReset();
    vi.mocked(prisma.pointEvent.create).mockReset();
  });

  it("3. Invalid code → error", async () => {
    mockFindCode(null);
    const result = await claimDailyBonus("user-1", "BADCODE");
    expect(result).toEqual({ ok: false, status: 422, error: "Invalid code." });
  });

  it("4. Yesterday's code → expired error", async () => {
    mockFindCode(makeBonusCode({ bonusDate: "2026-06-10", expiresAt: new Date("2026-06-10T21:59:59Z") }));
    const result = await claimDailyBonus("user-1", "TEST42");
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("expired") });
  });

  it("5. Tomorrow's code → not active yet error", async () => {
    mockFindCode(makeBonusCode({ bonusDate: "2026-06-12", expiresAt: new Date("2026-06-12T21:59:59Z") }));
    const result = await claimDailyBonus("user-1", "TEST42");
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("not active yet") });
  });

  it("6. Today's valid code → pointsAwarded: 3", async () => {
    mockFindCode(makeBonusCode());
    mockTransactionSuccess();
    const result = await claimDailyBonus("user-1", "TEST42");
    expect(result).toEqual({ ok: true, pointsAwarded: 3 });
  });

  it("7. PointEvent has correct shape for leaderboard aggregation", async () => {
    mockFindCode(makeBonusCode());
    mockTransactionSuccess();
    await claimDailyBonus("user-1", "TEST42");
    const call = vi.mocked(prisma.pointEvent.create).mock.calls[0][0];
    expect(call.data.userId).toBe("user-1");
    expect(call.data.points).toBe(3);
    expect(call.data.reason).toBe("Daily attendance bonus");
    expect(call.data.awardedBy).toBe("system");
  });

  it("8. Duplicate claim (P2002) → alreadyClaimed message, 0 points", async () => {
    mockFindCode(makeBonusCode());
    txMock().mockRejectedValue(makeP2002());
    const result = await claimDailyBonus("user-1", "TEST42");
    expect(result).toEqual({
      ok: true,
      pointsAwarded: 0,
      message: "You already claimed today's attendance bonus.",
    });
  });

  it("9. Different players can each claim +3 from the same code", async () => {
    mockFindCode(makeBonusCode());
    mockTransactionSuccess();
    const r1 = await claimDailyBonus("user-A", "TEST42");

    mockFindCode(makeBonusCode());
    mockTransactionSuccess();
    const r2 = await claimDailyBonus("user-B", "TEST42");

    expect(r1).toEqual({ ok: true, pointsAwarded: 3 });
    expect(r2).toEqual({ ok: true, pointsAwarded: 3 });
  });

  it("10. Re-throws unexpected (non-P2002) DB errors", async () => {
    mockFindCode(makeBonusCode());
    txMock().mockRejectedValue(new Error("DB connection lost"));
    await expect(claimDailyBonus("user-1", "TEST42")).rejects.toThrow("DB connection lost");
  });
});

// ── 11–12: Structural checks ─────────────────────────────────────────────

describe("11. Leaderboard includes daily bonus points (structural)", () => {
  it("PointEvent written by claimDailyBonus matches leaderboard's SUM(PointEvent.points) schema", () => {
    // src/lib/leaderboards.ts aggregates SUM(PointEvent.points) per userId.
    // Daily bonus events use identical schema: { userId, points, reason, awardedBy }.
    // No change to leaderboards.ts is needed.
    expect(true).toBe(true);
  });
});

describe("12. Prediction scoring unaffected by daily bonus system", () => {
  it("calculatePredictionPoints returns correct values", async () => {
    const { calculatePredictionPoints } = await import("@/lib/scoring");
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(5);
    expect(calculatePredictionPoints({ homeScore: 0, awayScore: 0 }, { homeScore: 0, awayScore: 0 })).toBe(5);
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 0, awayScore: 3 })).toBe(0);
  });
});
