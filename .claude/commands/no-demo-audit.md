---
description: Audit the codebase for demo/preview data that must not appear in production, and for stale Render/local DB references
---

Audit the GARRINCHA app for production-readiness: demo data leakage, stale references, and unsafe fallbacks.

Steps:

1. Check demo data guards in every page and component:
   - Search for `demoUser`, `demoMatches`, `demoLeaderboard`, `demoCenters` usage.
   - For each usage: is it guarded by `!hasDatabaseConfig()` or `isPreviewMode()`?
   - Report any place where demo data could appear in a live Supabase-connected environment.

2. Check stale host/infrastructure references:
   - Search for "Render" as main app host (not as "future worker") in source files.
   - Search for "Docker", "localhost:5432", "localhost:3000" in any non-test source.
   - Search for old domain names: "garrincha.be", "pronostiek.garrincha.be", "wk.garrincha.be".
   - Search for "Home Player", "Play from home" — these should not exist.
   - Search for "single-use link", "expires shortly", "temporary link" in email templates.

3. Check prediction lock timing:
   - Verify `isPredictionLocked()` in `src/lib/scoring.ts` locks at kickoffAt + 5 minutes (not AT kickoff).
   - Verify UI copy says "5 minutes after kickoff" (not "at kickoff").

4. Check leaderboard display name safety:
   - Verify `leaderboardDisplayName()` never falls back to the user's email address.
   - The fallback chain must be: nickname → fullName → displayName → `Player XXXXXX`.

5. Check for hardcoded credentials/secrets:
   - Search for any hardcoded passwords, API keys, connection strings in source files (not .env).
   - Check for `console.log` calls that might print sensitive data.

6. Check preview/demo mode configuration:
   - Verify `APP_PREVIEW_MODE` and `NEXT_PUBLIC_DEMO_MODE` are both `"false"` in `.env.example`.
   - Verify health check at `/admin/health` requires SUPER_ADMIN only.

7. Check CENTER_ADMIN scoping:
   - Verify `canManageCenter()` limits CENTER_ADMIN to their own centerId.
   - Verify `/api/admin/checkin-code` checks center ownership.
   - Verify CENTER_ADMIN cannot access `/admin/health` or `/admin/users`.

8. Report:
   - Any demo data that could leak into production
   - Any stale references found
   - Any security concerns
   - Overall production-readiness verdict
