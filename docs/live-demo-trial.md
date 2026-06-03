# Live Demo Trial Runbook

This runbook prepares a safe client demo while Supabase approval is still pending.

## Demo Scope

The demo uses preview mode and demo data. It is suitable for showing:

- campaign landing page
- free registration flow preview
- dashboard prediction cards
- leaderboards
- admin score-entry UI
- bonus-points UI
- owner dashboard concept
- workflow logic and scoring rules

It is not a production launch and does not store real campaign users while Supabase is unavailable.

## Demo Safety Rules

- Do not run Supabase migrations.
- Do not run the seed script against Supabase.
- Do not deploy.
- Do not expose `.env` values.
- Do not claim live production data is active.
- Do not invent final prize details.

## Client-Facing Message

Use this wording during the demo:

> Participation is free. No payment or registration fee is required. Prize details will be confirmed by GARRINCHA before campaign launch.

## Pre-Demo Checks

Run:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run env:check
```

Expected result before Supabase approval:

- typecheck/lint/tests/build pass
- `env:check` reports Supabase is not ready because real PostgreSQL URLs are not configured

## Start Demo

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

Useful demo routes:

- `/`
- `/register`
- `/dashboard`
- `/leaderboards`
- `/admin`
- `/admin/matches`
- `/admin/bonus`
- `/owner`
- `/terms`
- `/privacy`

## Demo Talking Points

- Football API data and GARRINCHA campaign data are separated.
- Users predict against internal match IDs.
- Predictions lock server-side at kickoff.
- Admin-confirmed final scores recalculate points.
- Bonus points are separate and require a reason.
- Leaderboards combine prediction and bonus points.
- Demo data is clearly marked until Supabase is connected.

## After Client Approval

Once approved, paste real Supabase URLs locally into `.env`, then run:

```powershell
npm run env:check
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Then complete `docs/supabase-live-audit-checklist.md`.
