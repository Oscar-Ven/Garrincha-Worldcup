# Supabase Live Audit Checklist

Run this checklist only after `npm run env:check` reports Supabase-ready URLs. Do not run migrations, seed, or browser live audit while `DATABASE_URL` or `DIRECT_URL` is missing, malformed, or placeholder.

## 1. Environment Gate

- [ ] `.env` exists locally and is not committed.
- [ ] `DATABASE_URL` is the Supabase pooled / transaction pooler URL.
- [ ] `DIRECT_URL` is the Supabase direct database URL.
- [ ] `JWT_SECRET` is non-placeholder and at least 32 characters.
- [ ] `OWNER_PASSWORD` is set and strong.
- [ ] `ADMIN_PASSWORD` is set and strong.
- [ ] `NEXT_PUBLIC_APP_URL` matches the local or target app URL.
- [ ] `npm run env:check` passes without printing secrets.

## 2. Database Setup

- [ ] Run `npm run db:migrate:deploy`.
- [ ] Confirm migration succeeds without reset or destructive commands.
- [ ] Run `npm run db:seed`.
- [ ] Confirm seed creates or updates centers, owner/admin users, teams, and 104 match slots.
- [ ] Confirm TBD teams/venues remain clearly neutral where official data is not final.

## 3. App Startup

- [ ] Run `npm run dev`.
- [ ] Confirm the app starts locally.
- [ ] Confirm real database mode is active.
- [ ] Confirm preview/demo notice is not shown as live campaign data.
- [ ] Confirm broken database reads do not silently fall back to demo data.

## 4. User Flow

- [ ] Register a user with email, password, DOB, phone, nationality, center, and consent.
- [ ] Confirm missing terms/privacy consent is rejected.
- [ ] Confirm under-16 registration is rejected.
- [ ] Log in as the new user.
- [ ] Log out and confirm session clears.
- [ ] Confirm dashboard loads real seeded matches.
- [ ] Create a prediction before kickoff.
- [ ] Edit the same prediction before kickoff.
- [ ] Confirm the same user has only one prediction row per match.
- [ ] Confirm predictions lock at/after kickoff.
- [ ] Confirm users cannot edit another user's prediction.

## 5. Admin Flow

- [ ] Log in as admin with the env-provided admin password.
- [ ] Confirm `/admin/*` is protected from normal users.
- [ ] Confirm admin match page loads real matches.
- [ ] Enter or confirm a final score.
- [ ] Confirm prediction points are recalculated.
- [ ] Edit the final score and confirm points overwrite safely.
- [ ] Award manual bonus points with a reason.
- [ ] Confirm bonus points without a valid reason are rejected.
- [ ] Confirm bonus points are stored separately from prediction points.

## 6. Leaderboards

- [ ] Confirm global leaderboard includes prediction and bonus points.
- [ ] Confirm nationality leaderboard filters correctly.
- [ ] Confirm GARRINCHA Center leaderboard filters correctly.
- [ ] Confirm ranking happens before result limits/caps.
- [ ] Confirm bonus-only users appear correctly.
- [ ] Confirm negative bonus corrections affect totals correctly.
- [ ] Confirm fallback names do not expose email addresses.

## 7. Football Data Workflow Readiness

- [ ] Confirm users predict against internal `Match.id`.
- [ ] Confirm TBD team updates preserve existing `Match.id`.
- [ ] Confirm venue updates preserve predictions.
- [ ] Confirm kickoff changes before lock can be reviewed/applied.
- [ ] Confirm kickoff changes after lock are treated as admin review cases.
- [ ] Confirm provider final scores are treated as draft until admin confirmation.

## 8. Final Verification

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm audit`

## Notes

Do not run `prisma migrate reset`, `prisma db push --force-reset`, destructive SQL, deployment, or production migration during this audit.
