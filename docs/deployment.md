# Deployment

## Production Stack

| Service | Role |
|---------|------|
| Vercel | App hosting (automatic builds from main branch) |
| Supabase PostgreSQL | Only real database |
| Resend | Transactional email (permanent access links) |
| Upstash Redis | Rate limiting (multi-instance safe) |
| Domain | `https://[YOUR-APP-DOMAIN]` |

## Vercel Environment Variables

Set all variables in **Vercel → Project → Settings → Environment Variables** for the Production environment.

### Required

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase Transaction Pooler URL (port 6543, `pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct database URL (port 5432) |
| `JWT_SECRET` | Random secret, minimum 32 characters |
| `OWNER_EMAIL` | `wc.garrincha@gmail.com` (Super Admin login) |
| `OWNER_PASSWORD` | Owner account password (seed only) |
| `ADMIN_PASSWORD` | Main admin account password (seed only) |
| `CENTER_ADMIN_PASSWORD` | Shared initial password for 10 center admin accounts (seed only — replace before public launch) |
| `NEXT_PUBLIC_APP_URL` | `https://[YOUR-APP-DOMAIN]` |
| `APP_PREVIEW_MODE` | `false` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |

### Email (Resend)

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | `Garrincha World Cup Predictions <noreply@garrincha.be>` |

**Email is not live until `garrincha.be` is verified in Resend.** See [Resend domain setup](#resend-domain-setup) below.

### Rate Limiting (Upstash Redis)

| Variable | Value |
|----------|-------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `REDIS_URL` | Upstash Redis URL (for future use) |

Without Upstash vars the app falls back to per-process in-memory rate limiting. For multi-instance Vercel deployments, Upstash is required for correct rate-limit enforcement.

### Monitoring (optional — when ready)

| Variable | Value |
|----------|-------|
| `SENTRY_DSN` | Sentry project DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Same DSN (public) |

## DATABASE_URL — Transaction Pooler

For Vercel serverless, use the Supabase Transaction Pooler URL (not the direct connection):

```
postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
```

Get it from: Supabase Dashboard → Project → Connect → Transaction Pooler.

The current `.env` may use the direct connection string for both DATABASE_URL and DIRECT_URL. Update DATABASE_URL to the pooler URL before production launch on Vercel.

## Build

Vercel runs `npm run build` automatically:

```
prisma generate && next build
```

**Migrations do NOT run automatically.** This prevents accidental schema changes from CI/CD builds.

## Pre-Deployment Checklist

Run locally before every production release:

```powershell
npm run env:check
npm run typecheck
npm run lint
npm test
npm audit --audit-level=high
```

## Migration (Deliberate Release Step)

Apply committed migrations manually before deploying a new schema version:

```powershell
npm run db:migrate:deploy
```

This uses `DIRECT_URL` via `prisma.config.ts`. Do not run against production unless that is the intended action.

## Seed (First Setup Only)

Seed only once, after migrations succeed on a fresh database:

```powershell
npm run db:seed
```

Seeding creates:
- Owner/Super Admin: `wc.garrincha@gmail.com` (uses `OWNER_PASSWORD`)
- Main admin: `admin@garrincha.local` (uses `ADMIN_PASSWORD`)
- 10 center admins with `@garrincha.be` emails (uses `CENTER_ADMIN_PASSWORD`)

**⚠️ Migration `20260604000000_center_admin_role` must be applied before seeding center admins.** This migration adds the `CENTER_ADMIN` value to the `Role` enum.

Center admin emails:
- `antwerpen.noord@garrincha.be` → GARRINCHA Antwerpen Noord
- `antwerpen.zuid@garrincha.be` → GARRINCHA Antwerpen Zuid
- `charleroi.dampremy@garrincha.be` → GARRINCHA Charleroi Dampremy
- `charleroi.montignies@garrincha.be` → GARRINCHA Charleroi Montignies
- `diegem@garrincha.be` → GARRINCHA Diegem
- `gent.arsenaal@garrincha.be` → GARRINCHA Gent Arsenaal
- `gent.theloop@garrincha.be` → GARRINCHA Gent The Loop
- `kortrijk@garrincha.be` → GARRINCHA Kortrijk
- `luik@garrincha.be` → GARRINCHA Luik
- `westgate.dilbeek@garrincha.be` → GARRINCHA Westgate Dilbeek

All center admins share `CENTER_ADMIN_PASSWORD` initially. Replace with unique credentials before public launch.

## Admin Hierarchy

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Full platform — all centers, health dashboard, user management |
| `ADMIN` | Full admin access (legacy main admin) |
| `CENTER_ADMIN` | Center-scoped — assigned center's QR codes, players, leaderboard only |
| `USER` | Player — predictions, own profile |

### System Health Dashboard

Route: `/admin/health` — Super Admin only.
Shows status of Supabase, Resend, Upstash Redis, Vercel, Sentry, Football API, and campaign readiness.
Never exposes secrets, passwords, API keys, or connection strings.

Re-seeding is idempotent (upsert) but should not be run routinely in production.

## Resend Domain Setup

Email is not live until the sending domain is verified.

1. Log in to [resend.com](https://resend.com).
2. Go to **Domains** → Add `[your-domain.com]`.
3. Add the DNS records Resend provides:
   - **SPF** — TXT record on `[your-domain.com]`
   - **DKIM** — TXT record on `resend._domainkey.[your-domain.com]`
   - **DMARC** — TXT record on `_dmarc.[your-domain.com]` (recommended)
4. Wait for domain verification (minutes to a few hours).
5. Set in Vercel:
   ```
   EMAIL_FROM="Garrincha World Cup Predictions <noreply@[your-domain.com]>"
   ```

Until verification, players still register and are auto-logged in. They can request a new access link from `/login` once email is live.

**Temporary testing only:** use `EMAIL_FROM="onboarding@resend.dev"` — this is Resend's built-in test sender, no domain verification required. Not for production.

## Upstash Redis — Rate Limiting

The app checks for `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` at runtime. When present, rate limiting uses Upstash fixed-window counters across all Vercel instances. When absent, it falls back to per-process in-memory (development safe, not production-safe for multi-instance).

## Workflow

1. Confirm Vercel env vars are set correctly.
2. Run `npm run db:migrate:deploy` for any schema changes.
3. Deploy to Vercel.
4. Run `npm run db:seed` only if setting up a fresh database.
5. Verify registration, access links, predictions, admin scores, leaderboards.
