# GARRINCHA World Cup — Production Monitoring

## Current monitoring stack

| Tool | Status | Purpose |
|---|---|---|
| Sentry | Configured (`@sentry/nextjs`) | Server and client error capture |
| Upstash Redis | Active | Rate limiting |
| `/api/health` | Live | DB + cache liveness check |

## Sentry setup

Sentry is configured in `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `instrumentation.ts`.

**Required env vars:**
```
NEXT_PUBLIC_SENTRY_DSN=https://....ingest.sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...      # for source map uploads during build
```

**Current config:**
- `tracesSampleRate: 0.1` — 10% performance sampling
- `sendDefaultPii: false` — no user emails/IPs in error reports
- Enabled only in `NODE_ENV=production`

**Recommended alert rules in Sentry dashboard:**
- Alert: Error rate > 5% in any 5-minute window
- Alert: New error types (set up issue alerts)
- Alert: `/api/auth/register` errors > 3/hour
- Alert: `/api/auth/request-link` errors > 10/hour

## Vercel Analytics (recommended — free)

Install:
```bash
npm install @vercel/analytics @vercel/speed-insights
```

Wire in `src/app/layout.tsx`:
```tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Inside <body>:
<Analytics />
<SpeedInsights />
```

Metrics to watch in Vercel dashboard:
- Page views (landing, register, leaderboards)
- Core Web Vitals per route (LCP, CLS, FID)
- Time to First Byte per route

## Alert thresholds

| Metric | Warning | Critical |
|---|---|---|
| 5xx error rate | >1% in 5min | >5% in 5min |
| `/api/auth/register` p95 latency | >3s | >8s |
| `/api/predictions` p95 latency | >2s | >5s |
| `/leaderboards` p95 latency | >2s | >5s |
| DB latency (Supabase) | >200ms avg | >500ms avg |
| Rate-limit 429 responses | >20/min | >100/min |
| Sentry new errors | Any new error type | — |

## Health check integration

The public endpoint `/api/health` returns:
```json
{ "status": "ok", "services": { "db": "ok", "cache": "ok" }, "env": "production" }
```

Add an uptime monitor (e.g. UptimeRobot free tier) pointing to:
```
https://worldcup-garrincha.com/api/health
Check interval: 5 minutes
Alert on: status != "ok" OR HTTP status != 200
```

## Rate limit monitoring

Rate limit events are logged to `console.warn` in `src/lib/rate-limit.ts`. If Upstash has issues, the app falls back to in-memory rate limiting silently.

To detect rate-limit spikes, monitor:
1. HTTP 429 response count per hour in Vercel function logs
2. Sentry breadcrumbs for 429 responses from `/api/predictions`

## Structured logging

All API routes log using `console.error("[route/name]", err)` format. In Vercel, these appear in the function logs with route context.

Filter by prefix in Vercel logs:
- `[auth/register]` — registration failures
- `[auth/request-link]` — magic link failures
- `[admin/matches/score]` — scoring failures
- `[prisma]` — database connection diagnostics (added in prisma.ts)

## Pre-tournament checklist

Before June 11, 2026:

- [ ] Verify `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel production
- [ ] Open Sentry dashboard and confirm errors are flowing
- [ ] Set up UptimeRobot or similar on `/api/health`
- [ ] Set Sentry alerts for 5xx spike
- [ ] Install `@vercel/analytics` and `@vercel/speed-insights`
- [ ] Run `npm run load:local` against staging to check baseline latencies
- [ ] Verify Upstash free tier is not near quota (10k requests/day)
- [ ] Check Supabase connection pooler metrics

## Load testing

Run locally before major deploys:
```bash
npm run load:local
# Or against a preview deployment:
BASE_URL=https://preview-url.vercel.app npm run load:local
```

Never run high-concurrency load tests against production without explicit authorization.
