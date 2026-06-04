import { describe, it, expect, vi, afterEach } from "vitest";
import { createLeaderboardRows, recalculatePredictionPoints } from "@/lib/product-logic";
import { finalScoreSchema } from "@/lib/validators";

// Mock must be top-level so Vitest hoists it correctly
vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]) },
}));

// ─── Email failure resilience ─────────────────────────────────────────────────

describe("email resilience", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sendEmail does not throw when RESEND_API_KEY is not configured", async () => {
    const orig = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    const { sendEmail, buildAccessLinkEmail } = await import("@/lib/email");
    await expect(
      sendEmail(buildAccessLinkEmail({ email: "test@example.com", accessUrl: "https://example.com/auth/access?token=abc" }))
    ).resolves.toBeUndefined();
    process.env.RESEND_API_KEY = orig;
  });

  it("sendEmail throws when Resend returns non-200 and API key is set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "test@example.com";

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      text: async () => "Sender domain not verified",
    }));

    const { sendEmail, buildAccessLinkEmail } = await import("@/lib/email");
    await expect(
      sendEmail(buildAccessLinkEmail({ email: "user@example.com", accessUrl: "https://example.com/auth/access?token=abc" }))
    ).rejects.toThrow("Resend API error 422");

    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });
});

// ─── Rate limit logic ─────────────────────────────────────────────────────────

describe("rate limiter", () => {
  afterEach(() => vi.restoreAllMocks());

  it("allows up to the limit and blocks on the next request", async () => {
    // Force in-memory path by ensuring no Upstash vars
    const savedUrl = process.env.UPSTASH_REDIS_REST_URL;
    const savedToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { checkRateLimit } = await import("@/lib/rate-limit");
    const key = `test:${Date.now()}:${Math.random()}`;

    // First 3 requests should be allowed
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    // 4th request should be blocked
    expect(await checkRateLimit(key, 3, 60_000)).toBe(false);

    process.env.UPSTASH_REDIS_REST_URL = savedUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = savedToken;
  });

  it("different keys are tracked independently", async () => {
    const savedUrl = process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;

    const { checkRateLimit } = await import("@/lib/rate-limit");
    const ts = Date.now();
    const keyA = `test-a:${ts}`;
    const keyB = `test-b:${ts}`;

    await checkRateLimit(keyA, 1, 60_000); // uses up keyA's limit
    expect(await checkRateLimit(keyA, 1, 60_000)).toBe(false);
    expect(await checkRateLimit(keyB, 1, 60_000)).toBe(true); // keyB is unaffected

    process.env.UPSTASH_REDIS_REST_URL = savedUrl;
  });
});

// ─── Leaderboard row creation ─────────────────────────────────────────────────

describe("createLeaderboardRows", () => {
  it("sorts by points descending then name ascending", () => {
    const users = [
      { id: "1", nickname: "Bob", fullName: "Bob B", displayName: null, email: "b@x.com", nationality: "BE",
        competitionCenter: { name: "Center A" }, predictions: [{ pointsAwarded: 10 }], pointEvents: [] },
      { id: "2", nickname: "Ana", fullName: "Ana A", displayName: null, email: "a@x.com", nationality: "BE",
        competitionCenter: { name: "Center A" }, predictions: [{ pointsAwarded: 15 }], pointEvents: [] },
      { id: "3", nickname: "Cara", fullName: "Cara C", displayName: null, email: "c@x.com", nationality: "BE",
        competitionCenter: { name: "Center A" }, predictions: [{ pointsAwarded: 10 }], pointEvents: [] },
    ];
    const rows = createLeaderboardRows(users);
    expect(rows[0].name).toBe("Ana");    // highest points
    expect(rows[1].name).toBe("Bob");    // same points as Cara, alphabetically first
    expect(rows[2].name).toBe("Cara");
  });

  it("respects the limit parameter", () => {
    const users = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      nickname: `User${i}`,
      fullName: `User ${i}`,
      displayName: null,
      email: `u${i}@x.com`,
      nationality: "BE",
      competitionCenter: { name: "Center A" },
      predictions: [{ pointsAwarded: i }],
      pointEvents: [],
    }));
    const rows = createLeaderboardRows(users, 3);
    expect(rows).toHaveLength(3);
  });
});

// ─── Health check endpoint ────────────────────────────────────────────────────

describe("health endpoint response shape", () => {
  it("returns expected fields", async () => {
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    const body = await res.json();

    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("services");
    expect(body.services).toHaveProperty("db");
    expect(body.services).toHaveProperty("cache");
    // Never expose secrets
    expect(JSON.stringify(body)).not.toMatch(/UPSTASH_REDIS_REST_TOKEN/);
    expect(JSON.stringify(body)).not.toMatch(/DATABASE_URL/);
    expect(JSON.stringify(body)).not.toMatch(/JWT_SECRET/);
  });
});

// ─── Leaderboard tie-break determinism ───────────────────────────────────────

describe("leaderboard tie-break determinism", () => {
  it("ORM path sorts equal-points users by name ascending", () => {
    const users = [
      { id: "c", nickname: "Charlie", fullName: "C", displayName: null, email: "c@x.com",
        nationality: null, competitionCenter: { name: "X" },
        predictions: [{ pointsAwarded: 10 }], pointEvents: [] },
      { id: "a", nickname: "Alice", fullName: "A", displayName: null, email: "a@x.com",
        nationality: null, competitionCenter: { name: "X" },
        predictions: [{ pointsAwarded: 10 }], pointEvents: [] },
      { id: "b", nickname: "Bob", fullName: "B", displayName: null, email: "b@x.com",
        nationality: null, competitionCenter: { name: "X" },
        predictions: [{ pointsAwarded: 10 }], pointEvents: [] },
    ];
    const rows = createLeaderboardRows(users);
    expect(rows.map((r) => (r as { name: string }).name)).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("user with zero predictions has 0 points", () => {
    const users = [
      { id: "1", nickname: "Ana", fullName: "A", displayName: null, email: "a@x.com",
        nationality: null, competitionCenter: { name: "X" },
        predictions: [{ pointsAwarded: 5 }], pointEvents: [] },
      { id: "2", nickname: "Zero", fullName: "Z", displayName: null, email: "z@x.com",
        nationality: null, competitionCenter: { name: "X" },
        predictions: [], pointEvents: [] },
    ];
    const rows = createLeaderboardRows(users);
    expect(rows[0].name).toBe("Ana");
    expect(rows[1].points).toBe(0);
  });

  it("bonus points are included in total", () => {
    const users = [
      { id: "1", nickname: "BonusPlayer", fullName: "B", displayName: null, email: "b@x.com",
        nationality: null, competitionCenter: { name: "X" },
        predictions: [{ pointsAwarded: 5 }], pointEvents: [{ points: 3 }] },
    ];
    const rows = createLeaderboardRows(users);
    expect(rows[0].points).toBe(8);
  });
});

// ─── Admin score update idempotency ──────────────────────────────────────────

describe("score recalculation idempotency", () => {
  it("recalculating the same score twice produces identical results", () => {
    const predictions = [
      { id: "p1", userId: "u1", homeScore: 2, awayScore: 1 },
      { id: "p2", userId: "u2", homeScore: 1, awayScore: 0 },
    ];
    const finalScore = { homeScore: 1, awayScore: 0 };
    const run1 = recalculatePredictionPoints({ predictions, finalScore });
    const run2 = recalculatePredictionPoints({ predictions, finalScore });
    expect(run1.map((u) => u.pointsAwarded)).toEqual(run2.map((u) => u.pointsAwarded));
  });

  it("correcting a score updates all predictions correctly", () => {
    const predictions = [
      { id: "p1", userId: "u1", homeScore: 2, awayScore: 1 },
      { id: "p2", userId: "u2", homeScore: 0, awayScore: 0 },
    ];
    const run1 = recalculatePredictionPoints({ predictions, finalScore: { homeScore: 2, awayScore: 1 } });
    expect(run1.find((u) => u.id === "p1")!.pointsAwarded).toBe(5);
    expect(run1.find((u) => u.id === "p2")!.pointsAwarded).toBe(0);

    const run2 = recalculatePredictionPoints({ predictions, finalScore: { homeScore: 0, awayScore: 0 } });
    expect(run2.find((u) => u.id === "p1")!.pointsAwarded).toBe(0);
    expect(run2.find((u) => u.id === "p2")!.pointsAwarded).toBe(5);
  });

  it("wrong prediction always awards 0 points", () => {
    const predictions = [{ id: "p1", userId: "u1", homeScore: 1, awayScore: 1 }];
    const result = recalculatePredictionPoints({ predictions, finalScore: { homeScore: 2, awayScore: 0 } });
    expect(result[0].pointsAwarded).toBe(0);
  });
});

// ─── Admin validator correctness ─────────────────────────────────────────────

describe("finalScoreSchema validation", () => {
  it("rejects negative scores", () => {
    expect(finalScoreSchema.safeParse({ homeScore: -1, awayScore: 0 }).success).toBe(false);
  });
  it("rejects non-integer scores", () => {
    expect(finalScoreSchema.safeParse({ homeScore: 1.5, awayScore: 0 }).success).toBe(false);
  });
  it("rejects scores over 30", () => {
    expect(finalScoreSchema.safeParse({ homeScore: 31, awayScore: 0 }).success).toBe(false);
  });
  it("accepts valid scores 0-30", () => {
    expect(finalScoreSchema.safeParse({ homeScore: 3, awayScore: 1 }).success).toBe(true);
    expect(finalScoreSchema.safeParse({ homeScore: 0, awayScore: 0 }).success).toBe(true);
  });
});
