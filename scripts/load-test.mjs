#!/usr/bin/env node
/**
 * Lightweight non-destructive load test for GARRINCHA World Cup.
 *
 * USAGE
 *   npm run load:local                     # hits http://localhost:3000
 *   BASE_URL=https://worldcup-garrincha.com npm run load:local   # hits production
 *
 * SAFETY
 *   - Only GET requests. No mutations. No auth. No DB writes.
 *   - Default: 3 concurrent workers, 10 total requests per endpoint.
 *   - Does not require any external dependencies.
 *
 * DO NOT run high-concurrency tests against production without
 * explicit authorization and an Upstash Redis rate limit confirmed.
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 3);
const REQUESTS_PER_ENDPOINT = Number(process.env.REQUESTS ?? 10);

const ENDPOINTS = [
  { path: "/", label: "landing" },
  { path: "/register", label: "register" },
  { path: "/leaderboards", label: "leaderboards" },
  { path: "/matches", label: "matches" },
  { path: "/api/health", label: "health" },
];

async function fetchOnce(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "garrincha-load-test/1.0" },
    });
    return { ok: res.ok, status: res.status, ms: Date.now() - start };
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - start, error: e.message };
  }
}

async function runEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  const results = [];
  let pending = [...Array(REQUESTS_PER_ENDPOINT)].map((_, i) => i);

  while (pending.length > 0) {
    const batch = pending.splice(0, CONCURRENCY);
    const batchResults = await Promise.all(batch.map(() => fetchOnce(url)));
    results.push(...batchResults);
  }

  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);
  const maxMs = Math.max(...results.map((r) => r.ms));
  const errors = results.filter((r) => !r.ok).map((r) => `${r.status}${r.error ? ` ${r.error}` : ""}`);

  return { label: endpoint.label, path: endpoint.path, ok, fail, avgMs, maxMs, errors };
}

async function main() {
  console.log(`\n=== GARRINCHA Load Test ===`);
  console.log(`Base URL:    ${BASE_URL}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Requests:    ${REQUESTS_PER_ENDPOINT} per endpoint\n`);

  const allResults = [];
  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`  Testing ${endpoint.label}... `);
    const result = await runEndpoint(endpoint);
    allResults.push(result);
    const statusIcon = result.fail === 0 ? "✓" : "✗";
    console.log(`${statusIcon} ${result.ok}/${result.ok + result.fail} ok | avg ${result.avgMs}ms | max ${result.maxMs}ms${result.fail > 0 ? ` | ERRORS: ${result.errors.join(", ")}` : ""}`);
  }

  const totalFail = allResults.reduce((s, r) => s + r.fail, 0);
  const totalRequests = allResults.reduce((s, r) => s + r.ok + r.fail, 0);
  console.log(`\nTotal: ${totalRequests - totalFail}/${totalRequests} succeeded`);

  if (totalFail > 0) {
    console.log(`\n⚠  ${totalFail} request(s) failed. Check rate limits or server health.`);
    process.exit(1);
  } else {
    console.log("\n✓ All requests succeeded.\n");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
