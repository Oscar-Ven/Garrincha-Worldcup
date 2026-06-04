# Deployment

## Production Stack

| Service | Role |
|---------|------|
| **Render** | App hosting — Web Service (Node.js, persistent process) |
| Supabase PostgreSQL | Only real database |
| Resend | Transactional email (permanent access links) |
| Upstash Redis | Rate limiting (multi-instance safe) |
| Sentry | Error monitoring |
| Domain | TBD — update `NEXT_PUBLIC_APP_URL` once decided |

## Why Render (not Vercel)

Render runs a persistent Node.js process, not serverless functions. This means:
- The Supabase **direct connection** (port 5432) works without a Transaction Pooler.
- No cold-start connection exhaustion under load.
- `DATABASE_URL` and `DIRECT_URL` can both point to the same Supabase direct URL.

## Render Service Configuration

| Setting | Value |
|---------|-------|
| Service type | **Web Service** (not Static Site) |
| Runtime | Node 20 |
| Region | Frankfurt (eu-central-1 — same region as Supabase project) |
| Branch | `main` |
| Build command | See below |
| Start command | `node .next/standalone/server.js` |
| Health check path | `/` |

### Build command

```
npm ci && npm run db:generate && npm run build && cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static
```

The `cp` steps are required because Next.js standalone output does not copy static assets automatically.

### npm scripts

```powershell
npm run start:render   # runs: node .next/standalone/server.js
```

## Render Environment Variables

Set ALL of the following in **Render dashboard → Service → Environment**. Do not put secrets in `render.yaml`.

### Required

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render default — injected automatically) |
| `HOSTNAME` | `0.0.0.0` |
| `DATABASE_URL` | Supabase direct connection `postgresql://postgres:PASS@db.ref.supabase.co:5432/postgres` |
| `DIRECT_URL` | Same as `DATABASE_URL` for Render (persistent process — no pooler needed) |
| `JWT_SECRET` | Random secret, minimum 32 characters |
| `OWNER_EMAIL` | `wc.garrincha@gmail.com` |
| `OWNER_PASSWORD` | Owner account password |
| `ADMIN_PASSWORD` | Main admin password |
| `CENTER_ADMIN_PASSWORD` | Shared center admin password |
| `NEXT_PUBLIC_APP_URL` | `https://[your-render-url].onrender.com` (update when custom domain is set) |
| `APP_PREVIEW_MODE` | `false` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |

### Email (Resend)

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | `Garrincha World Cup Predictions <noreply@[your-domain.com]>` |

Email is not live until the sending domain is verified in Resend. See [Resend domain setup](#resend-domain-setup) below.

### Rate Limiting (Upstash Redis)

| Variable | Value |
|----------|-------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `REDIS_URL` | Upstash Redis URL |

### Monitoring (Sentry)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN |
| `SENTRY_DSN` | Sentry DSN (server-side) |
| `SENTRY_ORG` | `garrincha-worldcup` |
| `SENTRY_PROJECT` | `garrincha-worldcup` |
| `SENTRY_AUTH_TOKEN` | For source map upload during builds |

## Supabase Notes

On Render, use the **direct connection** for both `DATABASE_URL` and `DIRECT_URL`:

```
postgresql://postgres:PASS@db.cvpfkopixypggzpqjloo.supabase.co:5432/postgres
```

No Transaction Pooler needed — Render's persistent process manages connections directly.

## Pre-Deployment Checklist

Run locally before each release:

```powershell
npm run env:check
npm run typecheck
npm run lint
npm test
npm audit --audit-level=high
```

Build and verify standalone output:

```powershell
npm run build
# Verify .next/standalone/server.js exists
ls .next/standalone/server.js
```

## Migration (Deliberate Release Step)

Apply committed migrations manually before deploying a schema change:

```powershell
npm run db:migrate:deploy
```

All 5 migrations are currently applied to the live Supabase database.

## Seed (First Setup Only)

Already seeded. Re-seed only on a fresh database:

```powershell
npm run db:seed
```

## Admin Accounts

| Role | Email | Password source |
|------|-------|----------------|
| SUPER_ADMIN | `wc.garrincha@gmail.com` | `OWNER_PASSWORD` env var |
| ADMIN | `admin@garrincha.local` | `ADMIN_PASSWORD` env var |
| CENTER_ADMIN (×10) | `*.@garrincha.be` | `CENTER_ADMIN_PASSWORD` env var |

All center admin emails: antwerpen.noord, antwerpen.zuid, charleroi.dampremy, charleroi.montignies, diegem, gent.arsenaal, gent.theloop, kortrijk, luik, westgate.dilbeek — all `@garrincha.be`.

**Replace shared `CENTER_ADMIN_PASSWORD` with individual credentials before public launch.**

## Admin Hierarchy

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Full platform — all centers, health dashboard, user management |
| `ADMIN` | Full admin access (legacy main admin) |
| `CENTER_ADMIN` | Center-scoped — assigned center QR codes, players, leaderboard |
| `USER` | Player — predictions, own profile |

## Resend Domain Setup

Email is not live until the sending domain is verified.

1. Log in to [resend.com](https://resend.com).
2. Go to **Domains** → Add your domain.
3. Add the DNS records Resend provides:
   - **SPF** — TXT record on your domain
   - **DKIM** — TXT record on `resend._domainkey.yourdomain`
   - **DMARC** — TXT record on `_dmarc.yourdomain` (recommended)
4. Wait for domain verification (minutes to a few hours).
5. Set in Render env vars:
   ```
   EMAIL_FROM="Garrincha World Cup Predictions <noreply@yourdomain>"
   ```

Until verification: use `EMAIL_FROM="onboarding@resend.dev"` for test emails only.

## System Health Dashboard

Route: `/admin/health` — Super Admin only.

Shows: Supabase connection status, campaign data counts, Resend/Redis/Vercel/Sentry/Football API config status.

Never exposes secrets, passwords, API keys, or connection strings.

## CI/CD Workflow

| Workflow | Trigger | Action |
|----------|---------|--------|
| `ci.yml` | Every push/PR | Typecheck, lint, test, security audit |
| `build-check.yml` | Push/PR to main or develop | Production build verification |
| `deploy-render.yml` | CI success on main | Triggers Render deploy hook |
| `deploy.yml` | — | **Disabled** (Vercel — replaced by Render) |
| `deploy-staging.yml` | — | **Disabled** (Vercel — replaced by Render) |
| `preview.yml` | — | **Disabled** (Vercel — replaced by Render) |

### GitHub Secrets required for Render deploy

| Secret | Where to get it |
|--------|----------------|
| `RENDER_DEPLOY_HOOK` | Render dashboard → Service → Settings → Deploy Hook |
| `SENTRY_AUTH_TOKEN` | Sentry dashboard — for source maps in build |

## Upstash Redis — Rate Limiting

The app checks `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` at runtime.  
When present → Redis-backed rate limiting across all instances.  
When absent → per-process in-memory fallback (development only).
