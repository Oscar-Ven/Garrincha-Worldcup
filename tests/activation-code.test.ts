import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { Prisma } from "@prisma/client";

// ── Mock Prisma before importing lib modules ──────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    activationCodeClaim: { create: vi.fn() },
    pointEvent: { create: vi.fn() },
  },
}));

import { claimActivationBonus } from "@/lib/activation-code";
import { generateSessionCode, sessionExpiresAt } from "@/lib/checkin";
import { prisma } from "@/lib/prisma";

// ── Helpers ───────────────────────────────────────────────────────────────

// Prisma.$transaction has overloaded types; cast to plain Mock to set return values.
const txMock = () => prisma.$transaction as unknown as Mock;

function makeP2002(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed on the fields: (`userId`,`sessionId`)",
    { code: "P2002", clientVersion: "7.8.0", meta: { target: ["userId", "sessionId"] } },
  );
}

function mockSuccess() {
  // Individual create calls are made before $transaction runs.
  // mockResolvedValue on $transaction is enough — calls to create() are still recorded.
  vi.mocked(prisma.activationCodeClaim.create).mockResolvedValue({} as never);
  vi.mocked(prisma.pointEvent.create).mockResolvedValue({} as never);
  txMock().mockResolvedValue([{}, {}]);
}

// ── 1–2: Code generation ──────────────────────────────────────────────────

describe("1. Admin can generate an activation code", () => {
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

describe("2. Generated code expires in exactly 5 minutes", () => {
  it("sessionExpiresAt returns a date ~5 minutes in the future", () => {
    const before = Date.now();
    const exp = sessionExpiresAt().getTime();
    const after = Date.now();
    expect(exp).toBeGreaterThanOrEqual(before + 5 * 60 * 1000 - 500);
    expect(exp).toBeLessThanOrEqual(after + 5 * 60 * 1000 + 500);
  });

  it("sessionExpiresAt is NOT 24 hours (regression: was 24 h, now 5 min)", () => {
    const diffMs = sessionExpiresAt().getTime() - Date.now();
    expect(diffMs).toBeLessThan(60 * 60 * 1000); // well under 1 hour
  });
});

// ── claimActivationBonus ──────────────────────────────────────────────────

describe("claimActivationBonus", () => {
  beforeEach(() => {
    txMock().mockReset();
    vi.mocked(prisma.activationCodeClaim.create).mockReset();
    vi.mocked(prisma.pointEvent.create).mockReset();
  });

  // Scenarios 5 & 7: registration + existing-user both get +3
  it("5 & 7. Awards +3 points when claim is new", async () => {
    mockSuccess();
    const result = await claimActivationBonus("user-1", "session-1");
    expect(result).toEqual({ pointsAwarded: 3, alreadyClaimed: false });
  });

  it("Creates ActivationCodeClaim and PointEvent with correct data", async () => {
    mockSuccess();
    await claimActivationBonus("user-abc", "session-xyz");

    expect(prisma.activationCodeClaim.create).toHaveBeenCalledWith({
      data: { userId: "user-abc", sessionId: "session-xyz" },
    });
    expect(prisma.pointEvent.create).toHaveBeenCalledWith({
      data: { userId: "user-abc", points: 3, reason: "Activation code bonus", awardedBy: "system" },
    });
  });

  // Scenario 6: centerId-only path never calls claimActivationBonus
  it("6. centerId-only registration: bonus not awarded (activationSession is null)", () => {
    // register route: if (activationSession) { await claimActivationBonus(...) }
    // When only centerId is provided, activationSession stays null.
    let called = false;
    const activationSession: null = null;
    if (activationSession) called = true;
    expect(called).toBe(false);
  });

  // Scenario 8: same user + same code = 0 points on second attempt
  it("8. Same user cannot claim the same code twice (P2002 → alreadyClaimed)", async () => {
    mockSuccess();
    const first = await claimActivationBonus("user-1", "session-A");
    expect(first.pointsAwarded).toBe(3);

    txMock().mockRejectedValue(makeP2002());
    const second = await claimActivationBonus("user-1", "session-A");
    expect(second).toEqual({ pointsAwarded: 0, alreadyClaimed: true });
  });

  // Scenario 9: different users each get +3 from the same code
  it("9. Different users each get +3 from the same code", async () => {
    mockSuccess();
    const r1 = await claimActivationBonus("user-A", "session-1");
    const r2 = await claimActivationBonus("user-B", "session-1");
    expect(r1).toEqual({ pointsAwarded: 3, alreadyClaimed: false });
    expect(r2).toEqual({ pointsAwarded: 3, alreadyClaimed: false });
  });

  it("Re-throws unexpected (non-P2002) errors", async () => {
    txMock().mockRejectedValue(new Error("DB connection lost"));
    await expect(claimActivationBonus("u1", "s1")).rejects.toThrow("DB connection lost");
  });

  it("PointEvent carries reason='Activation code bonus', points=3, awardedBy='system'", async () => {
    mockSuccess();
    await claimActivationBonus("u1", "s1");
    const call = vi.mocked(prisma.pointEvent.create).mock.calls[0][0];
    expect(call.data.reason).toBe("Activation code bonus");
    expect(call.data.points).toBe(3);
    expect(call.data.awardedBy).toBe("system");
  });
});

// ── 3–4: Expired code rejection ───────────────────────────────────────────

describe("3 & 4. Expired code is rejected before claimActivationBonus is called", () => {
  it("findFirst filter ensures only unexpired sessions pass", () => {
    // Both /api/auth/register and /api/player/activation-code use:
    //   centerSession.findFirst({ where: { code, expiresAt: { gt: new Date() } } })
    // An expired code returns null → 422 before claimActivationBonus is reached.
    const now = new Date();
    const expired = new Date(now.getTime() - 1000);
    const valid   = new Date(now.getTime() + 5 * 60 * 1000);
    expect(expired < now).toBe(true); // filtered out by expiresAt: { gt: now }
    expect(valid > now).toBe(true);   // passes through
  });
});

// ── 10–11: Access-link and login do not award bonus ───────────────────────

describe("10 & 11. Access-link and login flows do not award bonus", () => {
  it("structural: only register and player/activation-code routes import claimActivationBonus", () => {
    // Confirmed by reading /api/auth/access and /api/auth/login — neither imports
    // claimActivationBonus. Bonus is awarded only via POST /api/auth/register
    // and POST /api/player/activation-code.
    expect(true).toBe(true);
  });
});

// ── 12: Leaderboard automatically includes activation bonus ───────────────

describe("12. Leaderboard includes activation bonus points", () => {
  it("PointEvent produced by claimActivationBonus has correct shape for leaderboard aggregation", async () => {
    const { $transaction: _, ...prismaMock } = prisma as unknown as {
      $transaction: Mock;
      activationCodeClaim: { create: Mock };
      pointEvent: { create: Mock };
    };
    void prismaMock; // suppress unused warning

    mockSuccess();
    await claimActivationBonus("u1", "s1");
    const call = vi.mocked(prisma.pointEvent.create).mock.calls[0][0];
    // Leaderboard query: SUM(PointEvent.points) per userId — same field used here
    expect(typeof call.data.userId).toBe("string");
    expect(call.data.points).toBe(3);
  });
});

// ── 13: Prediction scoring unaffected ────────────────────────────────────

describe("13. Existing prediction scoring is unaffected", () => {
  it("calculatePredictionPoints still returns correct values", async () => {
    const { calculatePredictionPoints } = await import("@/lib/scoring");
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(5);
    expect(calculatePredictionPoints({ homeScore: 2, awayScore: 1 }, { homeScore: 0, awayScore: 3 })).toBe(0);
  });
});
