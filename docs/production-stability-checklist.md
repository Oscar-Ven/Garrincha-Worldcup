# GARRINCHA World Cup — Production Stability Checklist

## Infrastructure recommendations

| Service | Recommended plan | Reason |
|---|---|---|
| Vercel | Pro | Serverless function timeout 60s (Hobby = 10s); custom domains; no cold-start throttle |
| Supabase | Free tier works for launch | 200 concurrent connections; upgrade to Pro if connection pooler queue builds up |
| Resend | Free (3,000/mo) → Starter ($20/mo) | 3k emails covers ~3k registrations; upgrade before tournament starts |
| Upstash Redis | Free (10k requests/day) → Pay-as-you-go | Rate limiting; upgrade if >10k API calls/day expected |

## Required Vercel environment variables

These must be set in Vercel → Project → Settings → Environment Variables → Production:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase Supavisor Transaction Pooler URL (port 6543, `aws-1-eu-central-1.pooler.supabase.com`) |
| `DIRECT_URL` | Supabase direct connection (port 5432, `db.PROJECT.supabase.co`) — for migrations only |
| `JWT_SECRET` | Random string ≥ 32 chars — never rotate without invalidating all sessions |
| `NEXT_PUBLIC_APP_URL` | `https://worldcup-garrincha.com` |
| `EMAIL_FROM` | `Garrincha World Cup Predictions <noreply@worldcup-garrincha.com>` |
| `RESEND_API_KEY` | `re_...` from Resend dashboard |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `OWNER_PASSWORD` | Admin owner password |
| `ADMIN_PASSWORD` | Center admin password |
| `CENTER_ADMIN_PASSWORD` | Center admin password |

**Never print or log these values.**

## GoDaddy DNS note

GoDaddy is the domain registrar only. The app is hosted on Vercel.

GoDaddy DNS should have:
- `A` record: `@` → Vercel IP (or `CNAME` to `cname.vercel-dns.com`)
- `CNAME` record: `www` → `cname.vercel-dns.com`

Do not change hosting away from Vercel without updating DNS.

## Required Resend setup

1. Add domain `worldcup-garrincha.com` in Resend → Domains
2. Add SPF, DKIM, and DMARC DNS records in GoDaddy
3. Verify domain in Resend
4. Set `EMAIL_FROM` to `Garrincha World Cup Predictions <noreply@worldcup-garrincha.com>`

Until domain is verified, emails will fail. Users can still register and request new links.

## Database indexes

The migration `20260605000000_performance_indexes` adds:

| Index | Table | Column | Reason |
|---|---|---|---|
| `User_accessTokenHash_idx` | User | accessTokenHash | Magic link auth — avoids full table scan |
| `User_centerId_idx` | User | centerId | Activation center lookup |
| `User_competitionCenterId_idx` | User | competitionCenterId | Leaderboard filtering (very hot) |
| `User_nationality_idx` | User | nationality | Nationality leaderboard filter |
| `Prediction_userId_idx` | Prediction | userId | Leaderboard aggregation (very hot) |
| `Match_status_idx` | Match | status | Live/final match filtering |

Apply with: `npx prisma migrate deploy` (requires `DIRECT_URL`).

## Leaderboard performance

The leaderboard uses an aggregated SQL query (one round-trip) instead of loading all predictions into memory:
- Supabase-side `SUM(pointsAwarded)` and `SUM(points)` aggregations
- `JOIN` on competition center — only users with a competition center appear
- Dashboard uses `getUserRankAndPoints(userId)` — a separate focused query that avoids loading the full leaderboard just to show the user their rank
- The `/leaderboards` page uses `revalidate = 60` (cached up to 60 seconds)
- The `/matches` page uses `revalidate = 300` (cached up to 5 minutes)

## Rate limits

| Route | Limit | Window | Per |
|---|---|---|---|
| POST /api/auth/register | 5 | 1 hour | IP |
| POST /api/auth/request-link | 5 | 15 min | IP |
| POST /api/auth/login (admin) | 5 | 15 min | IP |
| POST /api/predictions | 60 | 1 min | IP |
| PUT /api/user/center | 5 | 1 hour | User ID |
| PUT /api/admin/users/:id/center | 30 | 1 min | IP |
| POST /api/checkin | 5 | 1 min | IP |
| POST /api/admin/matches/*/score | 120 | 1 min | IP |
| POST /api/admin/bonus | 120 | 1 min | IP |

Rate limiting uses Upstash Redis in production, falls back to in-memory in dev.

## Safe deploy checklist

Before every production deployment:

- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — 0 errors
- [ ] `npm test` — all tests pass
- [ ] `npm run build` — builds cleanly
- [ ] `npx prisma validate` — schema valid
- [ ] If schema changed: `npx prisma migrate deploy` (run manually with `DIRECT_URL`)
- [ ] After deploy: check `/api/health` returns `{ "status": "ok" }`
- [ ] After deploy: check `/register` shows real GARRINCHA centers (not `demo-*`)

## What NOT to do

- **Never run `prisma migrate reset`** — destroys all data
- **Never run `prisma db push --force-reset`** — destroys all data
- **Never delete rows from User, Prediction, Match, GarrinchaCenter** in production without a backup
- **Never print DATABASE_URL, JWT_SECRET, RESEND_API_KEY** in logs or code
- **Never deploy to `zita-software`** Vercel project — app must be under `worldcup-garrincha`
- **Never connect the live football API** until explicitly approved
- **Never change GoDaddy DNS** without verifying the new records first

## How to verify production after deploy

```bash
# Health check
curl https://worldcup-garrincha.com/api/health

# Register page shows real centers (not demo-*)
curl -s https://worldcup-garrincha.com/register | grep 'value="[^"]*"' | head -5

# Leaderboard loads
curl -I https://worldcup-garrincha.com/leaderboards

# Matches page loads
curl -I https://worldcup-garrincha.com/matches
```

Expected: health returns `"status":"ok"`, register shows real DB IDs (not `demo-*`).
