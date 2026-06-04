# GARRINCHA World Cup Prediction App

World Cup 2026 prediction game for GARRINCHA Centers. Players scan a QR code at a center, register for free, and receive a permanent personal access link by email.

## Production Stack

| Service | Role |
|---------|------|
| **Vercel** | App hosting |
| **Supabase PostgreSQL** | Only real database |
| **Resend** | Transactional email (permanent access links) |
| **Upstash Redis** | Production rate limiting |
| **Sentry** | Error monitoring |
| **Render** | Optional future worker only |
| **Domain** | `https://worldcup-garrincha.com` |

## Framework Stack

- Next.js 16 App Router (TypeScript, strict)
- Prisma 7 with `@prisma/adapter-pg`
- Tailwind CSS 4
- Zod validation
- Vitest unit tests

## Database Rule

**Supabase PostgreSQL is the only real database.**

- No Docker. No local PostgreSQL. No SQLite. No localhost database URLs.
- Local development must either connect to Supabase or use preview/demo mode.
- Preview/demo mode is for UI design review only — no real database writes.

## Features

- QR-code activation at a GARRINCHA Center (required to register)
- Free registration: full name, email, contact number, nickname, consent
- Permanent personal access link delivered by email — no expiration
- Remote access anytime with internet connection
- Competition center selection before first prediction (any center, locks after first prediction)
- Score predictions editable until 5 minutes after kickoff
- Scoring: 5 pts exact score / 3 pts correct outcome + goal difference / 2 pts correct outcome / 0 pts wrong
- Global, national, and GARRINCHA Center leaderboards
- Prize rankings: top 10 per competition center (owner dashboard)
- Admin emergency score correction and bonus points
- No-database preview/demo mode for UI review
- Full trilingual support: English / Nederlands / Français (language switcher in top nav)

## Setup

### Prerequisites

- Supabase project (database credentials from the Supabase dashboard)
- Resend account (for access-link emails)
- Upstash Redis (for production rate limiting)

### 1. Create `.env`

```powershell
Copy-Item .env.example .env
```

Fill in `.env` with real values. **Do not commit real secrets.**

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase Transaction Pooler URL (runtime) |
| `DIRECT_URL` | Supabase direct URL (migrations only) |
| `JWT_SECRET` | Random secret, min 32 chars |
| `OWNER_PASSWORD` | Seed owner account password |
| `ADMIN_PASSWORD` | Seed admin account password |
| `CENTER_ADMIN_PASSWORD` | Seed center admin password |
| `NEXT_PUBLIC_APP_URL` | `https://worldcup-garrincha.com` (production) |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | `Garrincha World Cup Predictions <noreply@worldcup-garrincha.com>` |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |

Generate a JWT secret:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Check environment readiness

```powershell
npm run env:check
```

This prints status only — no secret values printed.

### 4. Apply migrations

```powershell
npm run db:migrate:deploy
```

Uses `DIRECT_URL` via `prisma.config.ts`. Do not run this unless you intend to update the database.

### 5. Seed

```powershell
npm run db:seed
```

Seeds 10 GARRINCHA Centers, 48 teams, 104 match slots, owner account, admin account. Requires `OWNER_PASSWORD` and `ADMIN_PASSWORD` (min 8 chars).

### 6. Start development server

```powershell
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Generate Prisma client and build Next.js |
| `npm run env:check` | Check Supabase env readiness without printing secrets |
| `npm run db:generate` | Regenerate Prisma client from schema |
| `npm run db:migrate:deploy` | Apply committed migrations to Supabase |
| `npm run db:seed` | Seed Supabase (run after migrate) |
| `npm run typecheck` | TypeScript verification |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm audit` | Dependency security audit |

## Email Provider (Resend)

Access-link emails are sent via [Resend](https://resend.com).

1. Create a Resend account and add domain `worldcup-garrincha.com`.
2. Add SPF, DKIM, and DMARC DNS records as instructed by Resend.
3. Wait for domain verification.
4. Set `RESEND_API_KEY` and `EMAIL_FROM="Garrincha World Cup Predictions <noreply@worldcup-garrincha.com>"`.

Without these vars, emails are skipped with a warning log. Registration still succeeds (player is auto-logged in). They can request a new access link from `/login`.

## Preview / Demo Mode

For UI design review without a database:

```env
APP_PREVIEW_MODE="true"
NEXT_PUBLIC_DEMO_MODE="true"
```

Preview mode must be disabled for Supabase testing and production.

## Scoring

| Result | Points |
|--------|--------|
| Exact score | 5 |
| Correct outcome + correct goal difference | 3 |
| Correct outcome only | 2 |
| Wrong outcome | 0 |

Bonus points are stored separately (admin-awarded, require a reason).

## Match Data

The seed creates 104 match slots with UTC placeholder kickoff times and `TBD` venue names. Before public launch, replace with verified official FIFA schedule data (dates, times, venues, group pairings, knockout labels).

Football API sync runs server-side only. It preserves all existing `Match.id` and `Prediction` rows and requires admin confirmation before score recalculation. See `docs/match-data-workflow.md`.

## Deployment

See `docs/deployment.md` for the full Vercel production checklist.

```powershell
npm run env:check
npm run typecheck
npm run lint
npm test
npm audit
```
