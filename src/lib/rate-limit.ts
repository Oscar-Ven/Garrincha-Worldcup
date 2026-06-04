/**
 * Rate limiter with two backends:
 *
 *  1. Upstash Redis (production) — used when UPSTASH_REDIS_REST_URL and
 *     UPSTASH_REDIS_REST_TOKEN are both set.  Uses a fixed-window counter via
 *     the Upstash REST API (no extra npm dependency).
 *
 *  2. In-memory sliding window (fallback / development) — used when Redis is
 *     not configured.  Per-process only; does not coordinate across multiple
 *     Next.js instances.  Adequate for a single-server or local dev setup.
 *
 * checkRateLimit is async to support the Redis path.  All call sites must await it.
 */

import { isPlaceholderValue } from "@/lib/app-mode";

// ─── In-memory fallback ───────────────────────────────────────────────────────

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 10 * 60 * 1000);

function checkRateLimitMemory(
  key: string,
  maxAttempts: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) return false;
  entry.count += 1;
  return true;
}

// ─── Upstash Redis (production) ───────────────────────────────────────────────

async function checkRateLimitRedis(
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<boolean> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  // Fixed-window key: one bucket per window interval
  const windowKey = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
  const windowSec = Math.ceil(windowMs / 1000);

  try {
    const res = await fetch(`${upstashUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", windowKey],
        ["EXPIRE", windowKey, windowSec],
      ]),
    });

    if (!res.ok) {
      console.warn(`[rate-limit] Upstash HTTP ${res.status} — falling back to in-memory`);
      return checkRateLimitMemory(key, maxAttempts, windowMs);
    }

    const results = (await res.json()) as Array<{ result: unknown }>;
    const count = results[0]?.result;
    return typeof count === "number" ? count <= maxAttempts : true;
  } catch (err) {
    console.warn(
      "[rate-limit] Upstash error — falling back to in-memory:",
      (err as Error).message,
    );
    return checkRateLimitMemory(key, maxAttempts, windowMs);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns true when the request is within the allowed rate.
 * Returns false (rate-limited) when maxAttempts has been exceeded within windowMs.
 *
 * @param key          Unique identifier, e.g. `login:${ip}` or `register:${email}`
 * @param maxAttempts  Maximum allowed attempts in the window (default: 10)
 * @param windowMs     Window duration in milliseconds (default: 15 minutes)
 */
export async function checkRateLimit(
  key: string,
  maxAttempts = 10,
  windowMs = 15 * 60 * 1000,
): Promise<boolean> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (
    upstashUrl &&
    upstashToken &&
    !isPlaceholderValue(upstashUrl) &&
    !isPlaceholderValue(upstashToken)
  ) {
    return checkRateLimitRedis(key, maxAttempts, windowMs);
  }
  return checkRateLimitMemory(key, maxAttempts, windowMs);
}
