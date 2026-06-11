# Deployment

## Production Architecture

| Service | Role |
|---------|------|
| Vercel | Main Next.js app host |
| Supabase PostgreSQL | Only real database |
| Resend | Transactional access-link email |
| Upstash Redis | Production rate limiting |
| Sentry | Error monitoring and source maps |
| Domain | `https://worldcup-garrincha.com` |

Render is not used for the main app. It is reserved only for a possible future background worker, such as football fixture/result sync. See `docs/render-worker.md`.

## Vercel Project Configuration

Use a standard Vercel Next.js project.

| Setting | Value |
|---------|-------|
| Framework preset | Next.js |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Vercel default |
| Node.js version | 20 |

`npm run build` runs:

```powershell
prisma generate && next build
```

Migrations do not run during Vercel builds.

## Vercel Environment Variables

Set all required variables in Vercel project settings for Production. Also set matching Preview values where needed.

### Required

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase Transaction Pooler URL, port 6543, `pgbouncer=true` |
| `DIRECT_URL` | Supabase direct database URL, port 5432, migrations only |
| `JWT_SECRET` | Strong random secret, minimum 32 characters |
| `OWNER_EMAIL` | `wc.garrincha@gmail.com` |
| `OWNER_PASSWORD` | Owner account password |
| `ADMIN_PASSWORD` | Main admin account password |
| `CENTER_ADMIN_PASSWORD` | Initial shared center admin password |
| `NEXT_PUBLIC_APP_URL` | `https://worldcup-garrincha.com` |
| `APP_PREVIEW_MODE` | `false` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |

### Email

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | `Garrincha World Cup Predictions <noreply@worldcup-garrincha.com>` |

The sender domain must be verified in Resend before production email delivery.

### Rate Limiting

| Variable | Value |
|----------|-------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `REDIS_URL` | Upstash Redis URL, optional/future use |

Without Upstash, rate limiting falls back to in-memory counters and is not production-safe across multiple instances.

### Monitoring

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN |
| `SENTRY_DSN` | Sentry DSN |
| `SENTRY_ORG` | `garrincha-worldcup` |
| `SENTRY_PROJECT` | `garrincha-worldcup` |
| `SENTRY_AUTH_TOKEN` | Required only for source map upload during builds |

### Football Data

Football API sync uses API-Football server-side. Manual admin score entry works without it.

| Variable | Value |
|----------|-------|
| `FOOTBALL_DATA_PROVIDER` | `api-football` |
| `FOOTBALL_DATA_COMPETITION_CODE` | API-Football league id, default `1` |
| `FOOTBALL_DATA_SEASON` | `2026` |
| `FOOTBALL_DATA_API_KEY` | API-Football API key |

## Supabase URLs

For Vercel/serverless runtime:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
```

Use:

- `DATABASE_URL`: Supabase Transaction Pooler for app runtime on Vercel.
- `DIRECT_URL`: Supabase direct URL for Prisma migrations.

## Migration Release Step

Apply committed migrations deliberately before deploying schema-dependent app changes:

```powershell
npm run env:check
npx prisma migrate status
npm run db:migrate:deploy
```

Do not run migrations from Vercel build commands.

Do not run destructive commands such as:

- `prisma migrate reset`
- `prisma db push --force-reset`
- manual SQL deletes/truncates

## Seed

Seed only after migrations succeed, and only for a fresh or intentionally reseeded database:

```powershell
npm run db:seed
```

The seed creates centers, teams, match slots, the owner account, main admin account, and center admin accounts.

## CI/CD Workflows

| Workflow | Trigger | Action |
|----------|---------|--------|
| `ci.yml` | Push/PR to main or develop | Typecheck, lint, tests, high/critical audit |
| `build-check.yml` | Push/PR to main or develop | Production build verification |
| `deploy.yml` | CI success on main | Vercel production deploy |
| `deploy-staging.yml` | CI success on develop | Vercel preview/staging deploy |
| `preview.yml` | Non-draft PR | Vercel PR preview deploy |
| `deploy-render.yml` | Manual only | Disabled; future worker only |

### GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel CLI auth |
| `VERCEL_ORG_ID` | Vercel project/org link |
| `VERCEL_PROJECT_ID` | Vercel project link |
| `SENTRY_AUTH_TOKEN` | Optional source map upload |

## Pre-Deployment Checklist

Run before each production release:

```powershell
npm run env:check
npm run typecheck
npm run lint
npm test
npm audit --audit-level=high
npm run build
```

Then verify:

- Registration with a valid center activation code.
- Access-link email delivery.
- Login/access-link session creation.
- Competition center selection.
- Prediction create/edit/lock behavior.
- Admin score entry and point recalculation.
- Global, national, and center leaderboards.
- Center admin scoped access.
- Owner dashboard prize rankings.

## Domain & DNS Setup

See `docs/domain-dns-setup.md` for the complete step-by-step guide covering:

- GoDaddy records to keep vs. change (A, CNAME, TXT)
- Vercel domain connection
- Resend domain verification (SPF, DKIM, DMARC)
- SPF/DMARC merge caution
- Vercel environment variable checklist (names only)
- Post-connection verification steps

## Resend Domain Setup

1. Add `worldcup-garrincha.com` in Resend Dashboard → Domains.
2. Add the TXT records Resend provides to GoDaddy DNS (DKIM, and SPF/DMARC if required).
3. Wait for Resend to show domain status as **Verified**.
4. Set `EMAIL_FROM="Garrincha World Cup Predictions <noreply@worldcup-garrincha.com>"` in Vercel.

Do not set `EMAIL_FROM` in Vercel before the Resend domain is verified — emails will bounce or be rejected.

See `docs/domain-dns-setup.md` for SPF/DMARC merge rules.
