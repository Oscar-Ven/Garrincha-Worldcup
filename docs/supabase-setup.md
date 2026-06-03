# Supabase Setup

Supabase PostgreSQL is the only real database for this app. No Docker, no local PostgreSQL, no SQLite.

## Connection Strings

Two Supabase connection strings are required:

- `DATABASE_URL`: Transaction Pooler URL for app runtime (Vercel/serverless).
  - Port 6543, `pgbouncer=true`.
  - Get from: Supabase Dashboard → Project → Connect → Transaction Pooler.
- `DIRECT_URL`: Direct database URL for Prisma migrations only.
  - Port 5432.
  - Get from: Supabase Dashboard → Project → Connect → Direct connection.

Do not use localhost URLs. Do not use Docker URLs.

## Safe Readiness Check

```powershell
npm run env:check
```

Checks variable names, URL format, and DNS without printing secrets or touching the database.

## Apply Migrations

Run only when releasing a schema change:

```powershell
npm run db:migrate:deploy
```

Uses `DIRECT_URL` via `prisma.config.ts`. Do not run from Vercel builds automatically.

## Seed

Run only after migrations succeed on a fresh database:

```powershell
npm run db:seed
```

Requires `OWNER_PASSWORD` and `ADMIN_PASSWORD` (minimum 8 characters each).

Seeds: 10 GARRINCHA Centers, 48 teams + 64 TBD knockout slots, 104 match slots, owner account, admin account.

## Schedule Note

Match slots are seeded with UTC placeholder kickoff times and `TBD official venue #...` venue names. Replace with verified official FIFA schedule data before public launch.
