# Supabase Live Audit

## Environment Completion

- Working directory confirmed as `D:\WorldCup`.
- `.env` exists.
- Required variable names are present: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `OWNER_PASSWORD`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_APP_URL`.
- `ADMIN_PASSWORD` was missing and was generated/saved without printing the value.
- `NEXT_PUBLIC_APP_URL` was missing and was added as the local development URL.
- Existing `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and `OWNER_PASSWORD` were left unchanged.
- Follow-up safe inspection found `DATABASE_URL` and `DIRECT_URL` still contain placeholder/malformed URL content. Values were not printed.

## Direct URL Correction

`DIRECT_URL` was not changed during the follow-up attempt because `DATABASE_URL` could not be parsed as a usable Supabase pooler URL, so the project reference and password could not be inferred safely.

Manual correction is still needed. From PowerShell:

```powershell
cd D:\WorldCup
notepad .env
```

Replace only these two lines:

```env
DATABASE_URL="Supabase pooled / transaction pooler connection string"
DIRECT_URL="Supabase direct database connection string"
```

Copy them from:

Supabase Dashboard -> Project -> Connect -> Connection string

Use:

- `DATABASE_URL` = pooled / transaction pooler connection URI.
- `DIRECT_URL` = direct database connection URI.

Expected safe pattern without real values:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"
```

Do not invent the project ref or password.

Previous manual correction note:

1. Open Supabase Dashboard.
2. Go to Project -> Connect.
3. Copy the Direct connection / URI value.
4. Paste it into `DIRECT_URL` in `.env`.
5. Confirm `DATABASE_URL` is the Supabase pooled/Transaction Pooler runtime URL.

## Migration Result

`npm run db:migrate:deploy` failed before a successful migration.

Follow-up redacted connectivity check against `DIRECT_URL` failed with DNS resolution error `ENOTFOUND` for the configured host. This points to a Supabase direct URL hostname/network/configuration issue. No destructive reset command was run.

Follow-up safe URL inspection also found the database URL variables are not ready for migration. Migration was not retried after this result.

## Seed Result

Seed was not run because migration/connectivity did not pass.

## Dev Server Result

Dev server was not started for live Supabase audit because migration/connectivity did not pass.

## User Flow Audit

Not run. Live Supabase database setup is blocked by the direct database URL connectivity failure.

## Admin Flow Audit

Not run. Live Supabase database setup is blocked by the direct database URL connectivity failure.

## Leaderboard Audit

Not run. Live Supabase database setup is blocked by the direct database URL connectivity failure.

## Preview Mode Audit

Not run against live Supabase data. Previous code hardening keeps preview/demo mode from silently replacing real database data when a usable `DATABASE_URL` exists.

## Security and Live Behavior Audit

Not run in browser against live Supabase data because migration/connectivity did not pass.

## Bugs Found

- Supabase direct database connectivity is not currently working from this environment. The direct migration URL should be checked in `.env` without sharing secrets.

## Fixes Made

- Generated and saved missing `ADMIN_PASSWORD`.
- Added missing `NEXT_PUBLIC_APP_URL` for local audit.

## Email Provider Status

Email delivery (permanent access links) requires `RESEND_API_KEY` and `EMAIL_FROM` to be configured.

- Without these vars the app skips email delivery and logs an error-level warning. It does not throw — registration still succeeds and the player is auto-logged in.
- Players can request a new access link from `/login` once email is configured.
- See `docs/deployment.md` for Resend domain verification, SPF/DKIM/DMARC setup, and required Vercel variables.

## Remaining Risks

- Confirm the Supabase `DIRECT_URL` host, project reference, region, password, and network reachability.
- Replace placeholder/malformed `DATABASE_URL` and `DIRECT_URL` entries with real Supabase connection strings.
- Re-run `npm run db:migrate:deploy` after fixing the direct connection string.
- Run seed and functional live audit only after migration succeeds.
- Do not use destructive Prisma reset commands.

## Deployment Preparation Status

Not ready for deployment preparation. Supabase migration must pass first, then seed and live functional audit must complete.
