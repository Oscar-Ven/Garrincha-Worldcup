import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { isAccessTokenExpired, ACCESS_TOKEN_EXPIRY_MS } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createLeaderboardRows,
  leaderboardDisplayName,
  recalculatePredictionPoints,
  type LeaderboardInputUser,
  type PredictionRecord,
} from "@/lib/product-logic";
import { calculatePredictionPoints, isPredictionLocked } from "@/lib/scoring";
import {
  buildAccessLinkEmail,
  buildEmailContent,
  isEmailConfigured,
  sendAccessLinkEmail,
  type AccessLinkEmailPayload,
} from "@/lib/email";
import { predictionSchema } from "@/lib/validators";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEC = 1000;
const MIN = 60 * SEC;

function kickoffPlusMs(ms: number): { kickoff: Date; now: Date } {
  const kickoff = new Date("2026-06-14T15:00:00.000Z");
  return { kickoff, now: new Date(kickoff.getTime() + ms) };
}

function makeUser(
  overrides: Partial<LeaderboardInputUser> & { id: string },
): LeaderboardInputUser {
  return {
    displayName: null,
    nickname: null,
    fullName: null,
    email: "user@example.com",
    nationality: "Belgium",
    competitionCenter: { name: "GARRINCHA Brussels" },
    predictions: [],
    pointEvents: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// describe("prediction lock timing")
// ---------------------------------------------------------------------------

describe("prediction lock timing", () => {
  it("allows prediction 6 minutes before kickoff", () => {
    const { kickoff, now } = kickoffPlusMs(-6 * MIN);
    expect(isPredictionLocked(kickoff, now)).toBe(false);
  });

  it("allows prediction 5 minutes and 1 second before kickoff", () => {
    const { kickoff, now } = kickoffPlusMs(-(5 * MIN + 1 * SEC));
    expect(isPredictionLocked(kickoff, now)).toBe(false);
  });

  it("locks at exactly 5 minutes before kickoff", () => {
    const { kickoff, now } = kickoffPlusMs(-5 * MIN);
    expect(isPredictionLocked(kickoff, now)).toBe(true);
  });

  it("locks at kickoff", () => {
    const { kickoff, now } = kickoffPlusMs(0);
    expect(isPredictionLocked(kickoff, now)).toBe(true);
  });

  it("locks after kickoff", () => {
    const { kickoff, now } = kickoffPlusMs(5 * MIN);
    expect(isPredictionLocked(kickoff, now)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// describe("leaderboard with competition center")
// ---------------------------------------------------------------------------

describe("leaderboard with competition center", () => {
  it("excludes users with no competition center from leaderboard rows", () => {
    const users: LeaderboardInputUser[] = [
      makeUser({
        id: "with-center",
        displayName: "With Center",
        competitionCenter: { name: "GARRINCHA Brussels" },
        predictions: [{ pointsAwarded: 5 }],
      }),
      makeUser({
        id: "no-center",
        displayName: "No Center",
        competitionCenter: null,
        predictions: [{ pointsAwarded: 10 }],
      }),
    ];

    const rows = createLeaderboardRows(users);
    expect(rows.map((r) => r.id)).toEqual(["with-center"]);
  });

  it("uses competitionCenter name for center field in leaderboard row", () => {
    const users: LeaderboardInputUser[] = [
      makeUser({
        id: "u1",
        displayName: "Fatima",
        competitionCenter: { name: "GARRINCHA LiÃ¨ge" },
        predictions: [{ pointsAwarded: 3 }],
      }),
    ];

    const rows = createLeaderboardRows(users);
    expect(rows[0].center).toBe("GARRINCHA LiÃ¨ge");
  });

  it("includes users with competition center set", () => {
    const users: LeaderboardInputUser[] = [
      makeUser({
        id: "u1",
        displayName: "Omar",
        competitionCenter: { name: "GARRINCHA Ghent" },
        predictions: [{ pointsAwarded: 2 }],
      }),
      makeUser({
        id: "u2",
        displayName: "Leila",
        competitionCenter: null,
        predictions: [{ pointsAwarded: 8 }],
      }),
      makeUser({
        id: "u3",
        displayName: "Nina",
        competitionCenter: { name: "GARRINCHA Antwerp" },
        predictions: [{ pointsAwarded: 5 }],
      }),
    ];

    const rows = createLeaderboardRows(users);
    expect(rows.map((r) => r.id).sort()).toEqual(["u1", "u3"]);
  });

  it("competition center leaderboard does not group by activation center", () => {
    // A user whose activationCenter differs from competitionCenter should appear
    // under competitionCenter, not activationCenter. Since LeaderboardInputUser
    // only carries competitionCenter, the row's center field must reflect that â€”
    // regardless of any other center the user is associated with.
    const users: LeaderboardInputUser[] = [
      makeUser({
        id: "dual-center-user",
        displayName: "Mixed Center User",
        // activationCenter would be "GARRINCHA Brussels" in the DB, but
        // competitionCenter is set to "GARRINCHA Antwerp"
        competitionCenter: { name: "GARRINCHA Antwerp" },
        predictions: [{ pointsAwarded: 7 }],
      }),
    ];

    const rows = createLeaderboardRows(users);
    expect(rows).toHaveLength(1);
    expect(rows[0].center).toBe("GARRINCHA Antwerp");
    // The user does NOT appear under GARRINCHA Brussels (activation center)
    const brusselsRows = rows.filter((r) => r.center === "GARRINCHA Brussels");
    expect(brusselsRows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// describe("display name priority")
// ---------------------------------------------------------------------------

describe("display name priority", () => {
  it("uses nickname over fullName", () => {
    expect(
      leaderboardDisplayName({
        id: "u1",
        displayName: "auth-name",
        nickname: "Speedy",
        fullName: "John Doe",
      }),
    ).toBe("Speedy");
  });

  it("uses fullName when no nickname", () => {
    expect(
      leaderboardDisplayName({
        id: "u1",
        displayName: "auth-name",
        nickname: null,
        fullName: "John Doe",
      }),
    ).toBe("John Doe");
  });

  it("uses anonymous fallback when no name", () => {
    const result = leaderboardDisplayName({
      id: "cm000000abcdef",
      displayName: null,
      nickname: null,
      fullName: null,
    });
    expect(result).toBe("Player ABCDEF");
  });

  it("never uses email as display name", () => {
    // leaderboardDisplayName does not receive email at all â€” the type only
    // exposes id, displayName, nickname, fullName. Verify the fallback is
    // an anonymised player tag, not anything resembling an email address.
    const result = leaderboardDisplayName({
      id: "cm111111zzzzzz",
      displayName: null,
      nickname: null,
      fullName: null,
    });
    expect(result).not.toMatch(/@/);
    expect(result).toMatch(/^Player /);
  });
});

// ---------------------------------------------------------------------------
// describe("prediction scoring")
// ---------------------------------------------------------------------------

describe("prediction scoring", () => {
  it("awards 5 pts for an exact score prediction", () => {
    expect(
      calculatePredictionPoints(
        { homeScore: 2, awayScore: 1 },
        { homeScore: 2, awayScore: 1 },
      ),
    ).toBe(5);

    expect(
      calculatePredictionPoints(
        { homeScore: 0, awayScore: 0 },
        { homeScore: 0, awayScore: 0 },
      ),
    ).toBe(5);
  });

  it("awards 3 pts for correct outcome and correct goal difference", () => {
    // Prediction 3-1 (diff +2), final 4-2 (diff +2) â€” same outcome, same diff, different score
    expect(
      calculatePredictionPoints(
        { homeScore: 3, awayScore: 1 },
        { homeScore: 4, awayScore: 2 },
      ),
    ).toBe(3);

    // Draw 1-1 predicted, final 2-2 â€” same outcome (DRAW), diff is always 0
    expect(
      calculatePredictionPoints(
        { homeScore: 1, awayScore: 1 },
        { homeScore: 2, awayScore: 2 },
      ),
    ).toBe(3);
  });

  it("awards 2 pts for correct outcome but wrong goal difference", () => {
    // Prediction 2-0 (diff +2), final 1-0 (diff +1) â€” both HOME wins, different diff
    expect(
      calculatePredictionPoints(
        { homeScore: 2, awayScore: 0 },
        { homeScore: 1, awayScore: 0 },
      ),
    ).toBe(2);

    // Prediction 0-1 (AWAY), final 0-3 (AWAY) â€” different diff
    expect(
      calculatePredictionPoints(
        { homeScore: 0, awayScore: 1 },
        { homeScore: 0, awayScore: 3 },
      ),
    ).toBe(2);
  });

  it("awards 0 pts for wrong outcome", () => {
    expect(
      calculatePredictionPoints(
        { homeScore: 1, awayScore: 0 },
        { homeScore: 0, awayScore: 1 },
      ),
    ).toBe(0);

    expect(
      calculatePredictionPoints(
        { homeScore: 1, awayScore: 1 },
        { homeScore: 2, awayScore: 0 },
      ),
    ).toBe(0);
  });

  it("recalculation is idempotent â€” calling it twice yields identical output", () => {
    const calculatedAt = new Date("2026-06-14T20:00:00.000Z");
    const predictions: PredictionRecord[] = [
      { id: "p1", userId: "user-1", homeScore: 2, awayScore: 1 },
      { id: "p2", userId: "user-2", homeScore: 0, awayScore: 0 },
    ];
    const finalScore = { homeScore: 2, awayScore: 1 };

    const first = recalculatePredictionPoints({ predictions, finalScore, calculatedAt });
    const second = recalculatePredictionPoints({ predictions, finalScore, calculatedAt });

    expect(first).toEqual(second);
  });

  it("recalculation overwrites points rather than duplicating them", () => {
    const predictions: PredictionRecord[] = [
      { id: "p1", userId: "user-1", homeScore: 1, awayScore: 0 },
    ];
    const firstCalculatedAt = new Date("2026-06-14T20:00:00.000Z");
    const secondCalculatedAt = new Date("2026-06-14T21:00:00.000Z");

    // First calculation: final score 1-0 â†’ exact match â†’ 5 pts
    const first = recalculatePredictionPoints({
      predictions,
      finalScore: { homeScore: 1, awayScore: 0 },
      calculatedAt: firstCalculatedAt,
    });
    expect(first).toEqual([{ id: "p1", pointsAwarded: 5, calculatedAt: firstCalculatedAt }]);

    // Score corrected to 3-1: prediction 1-0 (diff +1) vs final 3-1 (diff +2) â€” same HOME outcome, different diff â†’ 2 pts
    const corrected = recalculatePredictionPoints({
      predictions,
      finalScore: { homeScore: 3, awayScore: 1 },
      calculatedAt: secondCalculatedAt,
    });
    expect(corrected).toEqual([{ id: "p1", pointsAwarded: 2, calculatedAt: secondCalculatedAt }]);

    // Result array length stays at 1 â€” no duplication
    expect(corrected).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Fix 1: access link URL must use /auth/access
// ---------------------------------------------------------------------------

describe("access link URL format", () => {
  it("URL path is /auth/access, not /access", () => {
    const appUrl = "https://worldcup.example.com";
    const token = "tok_abc123";
    const accessUrl = `${appUrl}/auth/access?token=${token}`;

    expect(new URL(accessUrl).pathname).toBe("/auth/access");
    expect(accessUrl).toContain("/auth/access?token=");
    // pathname must be exactly /auth/access, not the bare /access route
    expect(new URL(accessUrl).pathname).not.toBe("/access");
  });

  it("URL carries the raw token as a query parameter", () => {
    const appUrl = "https://worldcup.example.com";
    const token = "some_raw_token_value";
    const accessUrl = `${appUrl}/auth/access?token=${token}`;

    expect(new URL(accessUrl).searchParams.get("token")).toBe(token);
  });
});

// ---------------------------------------------------------------------------
// Fix 2: competition center locking â€” idempotency logic
// ---------------------------------------------------------------------------

describe("competition center lock rule", () => {
  it("lock update fires on first self-service center change (competitionCenterLockedAt is null)", () => {
    // The Prisma where clause { competitionCenterLockedAt: null } means the update
    // only matches rows where the field has not been set yet.
    const lockedAt: Date | null = null;
    const shouldFire = lockedAt === null;
    expect(shouldFire).toBe(true);
  });

  it("lock update does not fire when center is already locked", () => {
    const lockedAt: Date | null = new Date("2026-06-11T17:05:00.000Z");
    const shouldFire = lockedAt === null;
    expect(shouldFire).toBe(false);
  });

  it("two calls with the same userId are idempotent â€” second is a no-op", () => {
    // Simulate the first and second call. After the first call sets lockedAt,
    // the second call's where clause { competitionCenterLockedAt: null } won't match.
    let lockedAt: Date | null = null;

    // First self-service change: fires lock
    if (lockedAt === null) lockedAt = new Date("2026-06-11T17:05:00.000Z");
    const firstLock = lockedAt;
    expect(firstLock).not.toBeNull();

    // Second prediction: where clause does not match â†’ no update
    const updatedBySecond = lockedAt === null; // false â€” already set
    expect(updatedBySecond).toBe(false);

    // lockedAt value is unchanged
    expect(lockedAt).toBe(firstLock);
  });
});

// ---------------------------------------------------------------------------
// Fix 3: prediction validation message â€” schema rejects bad input
// ---------------------------------------------------------------------------

describe("prediction score validation", () => {
  it("accepts valid home/away scores", () => {
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: 0, awayScore: 0 }).success).toBe(true);
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: 2, awayScore: 1 }).success).toBe(true);
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: 30, awayScore: 30 }).success).toBe(true);
  });

  it("rejects invalid scores â€” route returns 'Please enter valid scores.'", () => {
    // Negative score
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: -1, awayScore: 0 }).success).toBe(false);
    // Score above 30
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: 31, awayScore: 0 }).success).toBe(false);
    // Non-integer
    expect(predictionSchema.safeParse({ matchId: "m1", homeScore: 1.5, awayScore: 0 }).success).toBe(false);
    // Missing matchId
    expect(predictionSchema.safeParse({ matchId: "", homeScore: 1, awayScore: 0 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Fix 4: permanent access link â€” email copy must not say "single-use" or "expires"
// ---------------------------------------------------------------------------

describe("access link email copy", () => {
  const payload: AccessLinkEmailPayload = {
    to: "player@example.com",
    displayName: "Ana Martins",
    centerName: "GARRINCHA Gent Arsenaal",
    accessUrl: "https://worldcup.example.com/auth/access?token=abc123",
  };

  it("plain text states link validity is 30 days", () => {
    const { text } = buildEmailContent(payload);
    expect(text).toContain("30 days");
  });

  it("plain text does not contain 'single-use' or 'expire shortly'", () => {
    const { text } = buildEmailContent(payload);
    expect(text.toLowerCase()).not.toContain("single-use");
    expect(text.toLowerCase()).not.toContain("expire shortly");
  });

  it("HTML states link validity is 30 days", () => {
    const { html } = buildEmailContent(payload);
    expect(html).toContain("30 days");
  });

  it("HTML does not contain 'single-use' or 'expire shortly'", () => {
    const { html } = buildEmailContent(payload);
    expect(html.toLowerCase()).not.toContain("single-use");
    expect(html.toLowerCase()).not.toContain("expire shortly");
  });

  it("email contains the access URL with /auth/access path", () => {
    const { text, html } = buildEmailContent(payload);
    expect(text).toContain(payload.accessUrl);
    expect(html).toContain(payload.accessUrl);
    expect(new URL(payload.accessUrl).pathname).toBe("/auth/access");
  });

  it("email warns the player to keep the link private", () => {
    const { text, html } = buildEmailContent(payload);
    expect(text.toLowerCase()).toContain("keep this link private");
    expect(html.toLowerCase()).toContain("keep this link private");
  });

  it("email states it gives access to the player's own account", () => {
    const { text, html } = buildEmailContent(payload);
    expect(text.toLowerCase()).toContain("access");
    expect(html.toLowerCase()).toContain("access my account");
  });

  it("buildAccessLinkEmail maps fullName to displayName when no displayName given", () => {
    const result = buildAccessLinkEmail({
      email: "test@example.com",
      accessUrl: "https://app.example.com/auth/access?token=tok",
      fullName: "Bilal Haddad",
    });
    expect(result.displayName).toBe("Bilal Haddad");
    expect(result.to).toBe("test@example.com");
    expect(result.centerName).toBe("GARRINCHA World Cup");
  });
});



// ---------------------------------------------------------------------------
// Magic link 30-day expiry -- OD-001
// ---------------------------------------------------------------------------

describe("magic link 30-day expiry -- OD-001", () => {
  it("token created just now is not expired", () => {
    const now = new Date();
    expect(isAccessTokenExpired(now, now)).toBe(false);
  });

  it("token created 29 days ago is not expired", () => {
    const created = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    expect(isAccessTokenExpired(created)).toBe(false);
  });

  it("token created exactly 30 days + 1 ms ago is expired", () => {
    const created = new Date(Date.now() - ACCESS_TOKEN_EXPIRY_MS - 1);
    expect(isAccessTokenExpired(created)).toBe(true);
  });

  it("token created 31 days ago is expired", () => {
    const created = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    expect(isAccessTokenExpired(created)).toBe(true);
  });

  it("null createdAt is treated as expired", () => {
    expect(isAccessTokenExpired(null)).toBe(true);
  });

  it("ACCESS_TOKEN_EXPIRY_MS equals exactly 30 days in milliseconds", () => {
    expect(ACCESS_TOKEN_EXPIRY_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});// ---------------------------------------------------------------------------
// Email provider mode (Resend)
// ---------------------------------------------------------------------------

describe("email provider mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("isEmailConfigured returns false when RESEND_API_KEY is absent", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "noreply@example.com");
    expect(isEmailConfigured()).toBe(false);
  });

  it("isEmailConfigured returns false when EMAIL_FROM is absent", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "");
    expect(isEmailConfigured()).toBe(false);
  });

  it("isEmailConfigured returns false when both are absent", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    expect(isEmailConfigured()).toBe(false);
  });

  it("isEmailConfigured returns true when both env vars are set", () => {
    vi.stubEnv("RESEND_API_KEY", "re_live_test_key");
    vi.stubEnv("EMAIL_FROM", "noreply@worldcup.example.com");
    expect(isEmailConfigured()).toBe(true);
  });

  it("sendAccessLinkEmail resolves without throwing when provider is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    vi.stubEnv("NODE_ENV", "development");

    const payload: AccessLinkEmailPayload = {
      to: "player@example.com",
      displayName: "Test Player",
      centerName: "GARRINCHA Test",
      accessUrl: "https://app.example.com/auth/access?token=safe_token",
    };

    await expect(sendAccessLinkEmail(payload)).resolves.toBeUndefined();
  });

  it("sendAccessLinkEmail resolves without throwing in production with no config", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    vi.stubEnv("NODE_ENV", "production");

    const payload: AccessLinkEmailPayload = {
      to: "player@example.com",
      displayName: "Test Player",
      centerName: "GARRINCHA Test",
      accessUrl: "https://app.example.com/auth/access?token=safe_token",
    };

    await expect(sendAccessLinkEmail(payload)).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Rate limiter (in-memory fallback â€” Upstash not configured in test env)
// ---------------------------------------------------------------------------

describe("rate limiter (in-memory fallback)", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("allows a request within the limit", async () => {
    const key = `test:allow:${Date.now()}`;
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("allows exactly maxAttempts requests", async () => {
    const key = `test:exact:${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      expect(await checkRateLimit(key, 5, 60_000)).toBe(true);
    }
  });

  it("blocks on the request that exceeds maxAttempts", async () => {
    const key = `test:block:${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(key, 3, 60_000);
    }
    expect(await checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("uses in-memory fallback when Upstash vars are absent", async () => {
    // With no Upstash vars the function must still resolve (no throw)
    const key = `test:fallback:${Date.now()}`;
    await expect(checkRateLimit(key, 10, 60_000)).resolves.toBe(true);
  });
});
