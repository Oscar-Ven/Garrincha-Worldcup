# Supabase Setup

Supabase PostgreSQL is the only real database for this app. No Docker, no local PostgreSQL, no SQLite.

## Connection Strings

Two Supabase connection strings are required:

- `DATABASE_URL`: Transaction Pooler URL for Vercel/serverless app runtime.
  - Port 6543.
  - Requires `pgbouncer=true`.
  - Get from: Supabase Dashboard -> Project -> Connect -> Transaction Pooler.
- `DIRECT_URL`: Direct database URL for Prisma migrations only.
  - Port 5432.
  - Get from: Supabase Dashboard -> Project -> Connect -> Direct connection.

Do not use localhost URLs. Do not use Docker URLs.

## Safe Readiness Check

```powershell
npm run env:check
```

Checks variable names, URL format, and DNS without printing secrets or touching the database.

## Apply Migrations

Run only when deliberately releasing a schema change:

```powershell
npm run db:migrate:deploy
```

Uses `DIRECT_URL` via `prisma.config.ts`. Do not run this from Vercel builds.

## Seed

Run only after migrations succeed on a fresh database:

```powershell
npm run db:seed
```

Requires `OWNER_PASSWORD`, `ADMIN_PASSWORD`, and `CENTER_ADMIN_PASSWORD`.

Seeds: 10 GARRINCHA Centers, teams, 104 match slots, owner account, main admin account, and center admin accounts.

## Schedule Note

Match slots are seeded with UTC placeholder kickoff times and placeholder venue names. Replace with verified official FIFA schedule data before public launch.
