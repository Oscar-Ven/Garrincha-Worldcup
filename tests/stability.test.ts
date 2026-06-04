import { describe, it, expect, vi, afterEach } from "vitest";

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

import { createLeaderboardRows } from "@/lib/product-logic";

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
