---
description: Full pre-deployment verification — env, typecheck, lint, tests, build, audit, and readiness checklist
---

Run the full GARRINCHA pre-deployment verification suite and report results.

Steps:

1. Run `npm run env:check` — verify Supabase + env vars are configured correctly.

2. Run `npm run typecheck` — verify no TypeScript errors.

3. Run `npm run lint` — verify no ESLint errors or warnings.

4. Run `npm test` — verify all tests pass. Report count of passing/failing tests.

5. Run `npm run build` — verify the production build compiles cleanly. Note any warnings.

6. Run `npm audit --audit-level=high` — report any high or critical vulnerabilities.

7. Check git status:
   - Are there uncommitted changes?
   - Is local main ahead of origin/main? (run `git log origin/main..HEAD --oneline`)
   - Are there any stale WIP branches?

8. Check Vercel configuration:
   - Is `NEXT_PUBLIC_APP_URL` set to `https://worldcup-garrincha.com` (not localhost or vercel.app)?
   - Is `output: "standalone"` absent from `next.config.ts` (correct for Vercel)?
   - Are there any `console.log` calls with sensitive data?

9. Check for demo data leakage:
   - Search for `isPreviewMode()` calls — are they all properly guarded?
   - Search for `demoUser`, `demoMatches`, `demoLeaderboard` — are they only used behind `!hasDatabaseConfig()` checks?

10. Report:
    - PASS / FAIL for each check
    - Any blocking issues that must be fixed before deploying
    - Any warnings that are non-blocking
    - Final verdict: READY TO DEPLOY or BLOCKED
