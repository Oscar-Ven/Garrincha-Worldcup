---
description: Identify untested code paths and generate Vitest unit tests for the GARRINCHA app
---

Analyze the GARRINCHA World Cup Prediction App codebase and generate missing unit tests.

The test framework is Vitest. Tests live in `tests/` as `.test.ts` files.
Do NOT write tests for React components (no jsdom setup) — focus on pure TypeScript logic.

Steps:

1. List all existing test files in `tests/` and what they cover.

2. List all files in `src/lib/` and check which ones are tested and which are not.
   Priority functions to test:
   - `src/lib/scoring.ts` — `calculatePredictionPoints`, `isPredictionLocked`, `getPredictionLockAt`
   - `src/lib/product-logic.ts` — `canAccessAdmin`, `canSavePrediction`, `leaderboardDisplayName`, `createLeaderboardRows`
   - `src/lib/validators.ts` — all schemas
   - `src/lib/app-mode.ts` — `isPreviewMode`, `hasDatabaseConfig`, `isPlaceholderValue`
   - `src/lib/translations.ts` — `t()`, `isLocale()`, completeness
   - `src/lib/email.ts` — `buildEmailContent()`, `buildAccessLinkEmail()`

3. For each untested function, write Vitest tests that cover:
   - Happy path (valid inputs, expected output)
   - Edge cases (boundary values, null/undefined, empty strings)
   - Error cases (invalid inputs, expected throws)

4. For the email template (`buildEmailContent`), test that:
   - The HTML output contains the access URL
   - The HTML does not contain unescaped special chars in user-supplied fields
   - The subject line contains the center name
   - The no-expiry language is present in all three locales
   - The plain-text version contains the access URL

5. For `calculatePredictionPoints`, verify the 5/3/2/0 scoring matrix is complete:
   - Exact score → 5
   - Same outcome + same goal difference → 3
   - Same outcome only → 2
   - Wrong outcome → 0
   - Draw predicted correctly (e.g. 1-1 vs 2-2) → 3 (same goal diff = 0)

6. Write the tests. Keep each test file focused on one module.
   Use `describe`/`it`/`expect` from Vitest.
   Do not mock anything unless absolutely necessary — test real logic.

7. After writing tests, run `npm test` to verify they all pass.

8. Report:
   - Files that now have improved coverage
   - Tests written
   - Tests that passed / failed
   - Remaining gaps
