# Supabase Handoff

## Status: LIVE

Supabase is connected and all migrations and seed have been applied.

- Project ref: `cvpfkopixypggzpqjloo`
- All 4 migrations applied.
- Seed complete: 10 centers, 48 teams + 64 TBD slots, 104 match slots, owner + admin accounts.

## Connection String Format

```env
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres"
```

**Status: Done.** `DATABASE_URL` has been updated to the Transaction Pooler URL (port 6543, `pgbouncer=true`). `DIRECT_URL` remains the direct connection (port 5432) for migrations. `npm run env:check` reports `SUPABASE_READY=yes`.

If the pooler URL ever needs to be regenerated, get it from: Supabase Dashboard → Project → Connect → Transaction Pooler.

## Safety Rules

- Do NOT run `prisma migrate reset`.
- Do NOT run `prisma db push --force-reset`.
- Do NOT run destructive Supabase commands.
- Do NOT commit real secrets.
- Do NOT paste connection strings into chat, email, or public channels.

## Safe Readiness Check

```powershell
npm run env:check
```

This prints status only — no secret values shown.

## Migration Command

Only run when releasing a new schema version:

```powershell
npm run db:migrate:deploy
```

## Seed Command

Only run on a fresh database setup:

```powershell
npm run db:seed
```
