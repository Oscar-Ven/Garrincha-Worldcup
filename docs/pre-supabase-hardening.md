# Pre-Supabase Hardening

## Fixed Before Live Audit

- Added an initial committed Prisma migration under `prisma/migrations`.
- Removed automatic `prisma migrate deploy` from `npm run build`.
- Added explicit manual migration scripts.
- Updated env documentation for pooled runtime URL, direct migration URL, JWT secret, owner password, admin password, app URL, and preview mode.
- Removed default-password guidance from `README.md`.
- Fixed leaderboard ranking so rows are sorted before limit is applied.
- Prevented leaderboard email fallback leakage by using anonymized player labels.
- Added registration consent and 16+ validation.
- Added same-origin checks for state-changing route handlers.
- Hardened JWT secret validation against placeholder values.
- Made preview mode local/demo-focused and prevented silent production fallback when a real database URL exists.

## Remaining Risks Before Public Launch

- Official FIFA match-by-match schedule, venues, and kickoff times must still be confirmed and loaded.
- In-memory rate limiting is not enough for multi-instance production.
- `npm audit` currently reports moderate dependency advisories.
- Live Supabase flows still need end-to-end testing after migration and seed.
- Prize rules and final campaign/legal copy need client approval.

## Live Audit Order

1. Confirm `.env` values locally without printing secrets.
2. Run `npm run db:migrate:deploy` against the intended Supabase database.
3. Run `npm run db:seed` manually only after migration success.
4. Start the app and verify registration, login, prediction save, admin score entry, bonus points, and leaderboards.
5. Record any live-data bugs before deployment preparation.
