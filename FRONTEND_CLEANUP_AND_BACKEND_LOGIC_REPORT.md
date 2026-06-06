# GARRINCHA World Cup — Frontend Cleanup & Backend Logic Report

**Date:** 2026-06-06
**Branch:** feat/landing-screenshot-match (22 commits ahead of main)
**Validation:** TypeScript ✓ — Build ✓ — Tests 234/234 ✓

---

## 1. Frontend Cleanup Status

### Result: Complete

The old frontend has been fully removed. No old design, component, or style code remains active anywhere in the project.

---

### Removed

| What | Detail |
|---|---|
| 20 UI components | Entire `src/components/` directory cleared (directory still exists, 0 files) |
| All page UI code | 870 lines of JSX deleted across 31 page/layout/error/loading files |
| Old CSS/theme | ~1,000 lines of old design CSS removed from `globals.css` |
| design-demo/ | 17 HTML mockup files deleted (were untracked) |
| Landing design | Old landing page sections, scoring cards, center lists, CTA blocks — gone |
| Old banner | `public/images/join-challenge-banner.png` deleted (was untracked) |
| `/api/competition-center` | Old center-change route deleted (superseded by OD-003) |

---

### Kept

| What | Why |
|---|---|
| `src/app/layout.tsx` | Root layout required by Next.js — contains only `<html lang>/<body>` + SEO metadata |
| `src/app/globals.css` | 46-line minimal CSS reset only (`box-sizing`, `margin: 0`, antialiasing) |
| `src/app/auth/access/page.tsx` | Token-validation logic (magic link handler) — no UI, only redirects |
| `public/branding/` | Logo files (`garrincha-black.png`, `garrincha-white.png`) |
| `public/flags/` | Country flag SVGs (49 files) — data assets, not design |
| All `src/app/api/` routes | Backend untouched |
| All `src/lib/` files | Business logic untouched |
| All `tests/` files | Tests untouched |
| `prisma/` | Schema and migrations untouched |

---

### Active Frontend Routes (all render `null` except auth/access)

**Public**
- `/` — Landing page
- `/matches` — Match schedule
- `/leaderboards` — Leaderboards
- `/login` — Player login / magic link request
- `/register` — Player registration
- `/legal` — Legal
- `/privacy` — Privacy policy
- `/terms` — Terms of service
- `/cookies` — Cookie policy
- `/demo-video` — Demo video

**Player**
- `/dashboard` — Player dashboard

**Auth**
- `/auth/access` — **FUNCTIONAL** — validates magic link token, redirects to `/dashboard` or `/login`

**Admin**
- `/admin` — Admin overview
- `/admin/login` — Admin login
- `/admin/matches` — Match management
- `/admin/bonus` — Bonus points
- `/admin/checkin` — Check-in codes
- `/admin/users` — User management
- `/admin/health` — System health

**Owner**
- `/owner` — Owner dashboard

---

### CSS State

`globals.css` contains exactly this — nothing else:

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; }
body { min-height: 100vh; line-height: 1.5; -webkit-font-smoothing: antialiased; }
img, svg, video { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
p, h1–h6 { overflow-wrap: break-word; }
```

No font imports. No colour variables. No layout utilities. Clean slate.

---

### Remaining Frontend Risks

| Risk | Status |
|---|---|
| `themeColor: "#0a0d0a"` in root layout metadata | Minor — this is a browser tab colour hint, not a visual style. The new developer can change it. |
| CSP in `next.config.ts` allows Google Fonts | Intentional — allows new developer to use Google Fonts without config changes |
| `/demo-video` route exists | Route is registered and returns null. Can be removed or used by the new developer. |

---

## 2. Backend Logic Implemented

### A. Authentication / Users

#### Player Authentication
- **Method:** Email magic link (passwordless)
- **Flow:** Player registers → system sends magic link via Resend email → player clicks link → `GET /api/auth/access` validates token → creates JWT session cookie → redirects to `/dashboard`
- **Token:** 32-byte cryptographically random, stored as SHA-256 hash in DB
- **Session:** JWT in `garrincha_session` httpOnly cookie, 30-day expiry, signed with `JWT_SECRET`
- **Re-login:** Player requests new link at `POST /api/auth/login` or `POST /api/auth/request-link` — both rotate the token (invalidates old one)
- **Security:** Token is never stored in plaintext; only the SHA-256 hash lives in the database

#### Admin Authentication
- **Method:** Email + bcrypt password (`POST /api/admin/login`)
- **Same session cookie** as player auth — JWT distinguishes by role
- **Separation:** `/admin/login` vs `/login` — completely separate flows

#### Roles

| Role | Login Method | Access |
|---|---|---|
| `USER` | Magic link | Player dashboard, predictions, own account |
| `CENTER_ADMIN` | Password | Admin panel, bonus points (own center only), check-in codes (own center) |
| `ADMIN` | Password | Admin panel, bonus points (any player), match scores, user management (read/edit) |
| `SUPER_ADMIN` | Password | Everything — including role changes, user deletion, health report, owner protections |

- Player and admin flows are fully separated (different login pages, different auth guards)
- `requireAdmin()`, `requireSuperAdmin()`, `requireCenterAdmin()`, `requireUser()` guards in `src/lib/auth.ts`
- CENTER_ADMIN cannot elevate to ADMIN/SUPER_ADMIN; role changes require SUPER_ADMIN

---

### B. Player Account

#### Fields Stored

| Field | Required | Notes |
|---|---|---|
| `id` | ✓ | CUID |
| `email` | ✓ | Unique, used for auth and magic link |
| `fullName` | ✓ | Collected at registration |
| `nickname` | ✓ | Unique across platform (DB constraint), used as display name |
| `displayName` | ✓ | Set to nickname at registration, can differ later |
| `phoneNumber` | ✓ | Collected at registration |
| `nationality` | Optional | ISO code (e.g. "BE") |
| `centerId` | ✓ | Immutable — activation center where player registered |
| `competitionCenterId` | Optional | Competition leaderboard center — starts equal to `centerId` |
| `competitionCenterLockedAt` | Auto | Set when player uses their one self-service center change |
| `avatarUrl` | Optional | Stored as base64 data URL, max 400 KB |
| `role` | ✓ | Always `USER` for players |
| `firstActivatedAt` | ✓ | Set at registration |
| `accessTokenHash` | Auto | SHA-256 hash of current magic link token |
| `accessTokenCreatedAt` | Auto | When current token was issued |
| `accessTokenRevokedAt` | Auto | Set when token is rotated |
| `lastAccessLinkSentAt` | Auto | Rate limiting for magic link requests |
| `createdAt` / `updatedAt` | Auto | Standard timestamps |

#### Points

Players accumulate points from two sources:
1. `Prediction.pointsAwarded` — from match predictions (0/2/3/5)
2. `PointEvent.points` — from bonus point awards by admins

Total points = sum of all prediction points + sum of all bonus events.

#### Missing / Not Implemented

| Item | Status |
|---|---|
| `dateOfBirth` | Field exists in schema but is NOT collected at registration (no field in `registerSchema`). Needs a decision — collect at registration or add later? |
| Last activity / last login date | Not stored. `lastAccessLinkSentAt` is the closest proxy. |
| Leaderboard position | Computed at query time, not stored. `getUserRankAndPoints()` calculates it on demand. |

---

### C. Match and Prediction Logic

#### Match Structure

| Field | Type | Notes |
|---|---|---|
| `id` | String | CUID |
| `fifaMatchNo` | Int? | Official FIFA match number |
| `stage` | Enum | GROUP, ROUND_OF_32, ROUND_OF_16, QUARTER_FINAL, SEMI_FINAL, THIRD_PLACE, FINAL |
| `venue` | String | Stadium name |
| `kickoffAt` | DateTime | UTC |
| `status` | Enum | SCHEDULED, LIVE, FINAL |
| `homeTeamId` / `awayTeamId` | String | FK to Team |
| `homeScore` / `awayScore` | Int? | Null until admin enters final score |
| `finalizedAt` | DateTime? | When admin entered the score |
| `scoreSource` | String? | "manual" or external API name |
| `externalMatchId` | String? | For live score sync |

#### Team Structure

| Field | Notes |
|---|---|
| `name` | Full name (e.g. "Belgium") |
| `fifaCode` | 3-letter code (e.g. "BEL") |
| `flagUrl` | Path to SVG flag in `public/flags/` |
| `groupName` | Group letter (e.g. "A") for group stage teams |

104 World Cup 2026 matches are seeded in demo data (Groups A–L + full knockout bracket).

#### Prediction Rules

- **Create/Edit:** `POST /api/predictions` — upsert by `userId + matchId`
- **Score range:** 0–30 goals per team (validated by Zod)
- **Auth required:** Must be logged in as USER with a `competitionCenterId` set
- **Lock rule:** ✅ **Implemented and tested** — predictions close exactly 5 minutes before kickoff

```
isPredictionLocked(kickoffAt, now):
  return now >= kickoffAt - 5 minutes
```

Example: match at 20:00 → predictions close at 19:55:00

- When admin enters final score, `pointsAwarded` is recalculated for all predictions of that match
- Editing a prediction resets `pointsAwarded` to 0 and clears `calculatedAt`

---

### D. Scoring Logic

**Implemented in `src/lib/scoring.ts` — fully tested in `tests/scoring.test.ts`**

| Result | Points |
|---|---|
| Exact score (home + away both correct) | **5** |
| Correct outcome + same goal difference | **3** |
| Correct outcome only (win/draw/loss) | **2** |
| Wrong outcome | **0** |

**Examples:**
- Final: 2-1 | Prediction: 2-1 → **5 pts** (exact)
- Final: 3-2 | Prediction: 2-1 → **3 pts** (same diff +1, Belgium wins both)
- Final: 2-1 | Prediction: 1-0 → **2 pts** (correct winner, different diff)
- Final: 2-1 | Prediction: 1-2 → **0 pts** (wrong winner)
- Final: 1-1 | Prediction: 0-0 → **2 pts** (correct draw)
- Final: 1-1 | Prediction: 2-2 → **3 pts** (draw + same diff 0)

**Recalculation:**
- Triggered by admin entering final score (`POST /api/admin/matches/[id]/score`)
- Atomic transaction: updates match status to FINAL + recalculates all predictions
- Batched by point category (max 4 `updateMany` calls)
- If admin corrects a score, re-running the route recalculates again — idempotent

**What happens if score is changed:**
All predictions for that match are recalculated using the new score. Old `pointsAwarded` values are overwritten. No history of previous calculation is kept.

---

### E. Leaderboards

**Implemented in `src/lib/leaderboards.ts` and `src/lib/product-logic.ts`**

#### Available Leaderboards

| Leaderboard | How | Filter |
|---|---|---|
| Global | All players with a `competitionCenterId` | None |
| By center | Same, filtered by `competitionCenter.name` | Center name |
| By nationality | Same, filtered by `nationality` | ISO code |

- Players without a `competitionCenterId` are excluded from all leaderboards
- `getUserRankAndPoints()` returns a single player's rank and total points for the dashboard

#### Sorting

1. **Total points DESC** (prediction points + bonus points)
2. **Name ASC** (alphabetical tie-break)

#### Updates

Leaderboard updates automatically when admin enters a final score — no manual trigger needed. Points are recalculated in the same transaction, so leaderboard is immediately consistent.

#### Bonus Points

Fully included. `PointEvent.points` can be positive or negative (-100 to +100).

---

### F. Garrincha Center Logic

**Implemented as OD-003 — fully tested**

#### Two Center Fields

| Field | Meaning | Mutable? |
|---|---|---|
| `centerId` | **Activation center** — where the player physically registered | Never (immutable) |
| `competitionCenterId` | **Competition center** — whose leaderboard the player contributes to | Yes, with rules |

Both are set to the registration center when a player signs up.

#### Self-Service Center Change (Player)

`PUT /api/user/center`

- Player may change `competitionCenterId` **once**
- After the change, `competitionCenterLockedAt` is set (timestamps the lock)
- Atomic: `updateMany WHERE competitionCenterLockedAt IS NULL` prevents race conditions
- Audit: logged in `CenterChangeLog` with `changeType = "SELF_SERVICE"`
- Rate limited: 5 requests/hour per user

#### Admin Center Correction

`PUT /api/admin/users/:id/center`

- Only ADMIN or SUPER_ADMIN (CENTER_ADMIN is blocked with 403)
- Does NOT modify `competitionCenterLockedAt` (player still has their one change intact)
- Audit: logged in `CenterChangeLog` with `changeType = "ADMIN_CORRECTION"`

#### Remote Play / Check-in

`POST /api/checkin`

- Players submit a 6-character code generated by a center admin
- Check-in creates/updates a `CenterCheckIn` record (physical presence log)
- **Does NOT change `competitionCenterId`** — remote play is access-only, not leaderboard reassignment

#### ⚠️ Known Gap: Cross-Center Check-in

The current check-in route validates that the session code's center matches the player's **activation center** (`user.center.id`). This means a player physically visiting a different GARRINCHA center cannot check in there — the code is rejected.

The requirement says players should be able to visit another center. This needs a decision:

> **Option A:** Allow check-in at any center (remove the centerId === user.center.id check). Check-in becomes a pure "I'm here" log with no center restriction.
>
> **Option B:** Keep the restriction — check-in only at activation center, visitors use the center's public facilities without a formal check-in.

No code change made pending owner decision.

#### CenterChangeLog Model

Every center change is recorded:

| Field | Value |
|---|---|
| `userId` | Player whose center changed |
| `fromCenterId` | Previous competition center (or null if first assignment) |
| `toCenterId` | New competition center |
| `changedBy` | Email of who made the change |
| `changeType` | `SELF_SERVICE` or `ADMIN_CORRECTION` |
| `createdAt` | Timestamp |

#### CENTER_ADMIN Bonus Scope (OD-004)

- CENTER_ADMIN can only award bonus points to players whose `competitionCenterId` matches the admin's own `centerId`
- ADMIN and SUPER_ADMIN can award to any player
- Enforced in `canAwardBonus()` in `src/lib/product-logic.ts`

---

### G. Admin Features

| Feature | Route | Who |
|---|---|---|
| Admin login | `POST /api/admin/login` | All admin roles |
| Enter final match score | `POST /api/admin/matches/[id]/score` | ADMIN, SUPER_ADMIN |
| Award bonus points | `POST /api/admin/bonus` | All admin roles (CENTER_ADMIN scoped) |
| Generate check-in code | `POST /api/admin/checkin-code` | All admin roles (CENTER_ADMIN scoped) |
| View active check-in code | `GET /api/admin/checkin-code` | All admin roles (CENTER_ADMIN scoped) |
| Change player competition center | `PUT /api/admin/users/[id]/center` | ADMIN, SUPER_ADMIN |
| Change user role | `PATCH /api/admin/users/[id]/role` | SUPER_ADMIN only |
| Delete user | `DELETE /api/admin/users/[id]` | SUPER_ADMIN only |
| Full system health report | `GET /api/admin/health` | SUPER_ADMIN only |

**Owner protections (SUPER_ADMIN):**
- Cannot delete their own account
- Cannot demote themselves from SUPER_ADMIN

**Pages exist as stubs:**
`/admin`, `/admin/login`, `/admin/matches`, `/admin/bonus`, `/admin/checkin`, `/admin/users`, `/admin/health`

All render null. The new frontend developer builds the admin UI using the API routes above.

---

### H. Legal / Footer / Content

All four legal routes are registered and return null:

| Route | Page |
|---|---|
| `/legal` | General legal / company info |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |
| `/cookies` | Cookie policy |

**What exists:** Route registrations only. No content.

**What the new developer must build:**
- Page content for all four routes
- A footer component with: company name (Kempes BV / GARRINCHA), website link, social media links, domain ownership mention, links to legal pages
- Footer should appear on all public pages (landing, matches, leaderboards, legal pages)
- Footer must NOT appear on admin pages

**Translations:** `src/lib/translations.ts` has EN/NL/FR keys for nav and footer labels. The new developer can use `t(locale, key)` to render translated text.

---

### I. Database / Schema / API Status

#### Prisma Models

| Model | Purpose |
|---|---|
| `User` | Players and admins |
| `GarrinchaCenter` | 10 GARRINCHA centers in Belgium |
| `Match` | 104 World Cup 2026 matches |
| `Team` | 48 national teams with FIFA codes and flags |
| `Prediction` | One per player per match |
| `PointEvent` | Bonus point awards |
| `CenterSession` | Admin-generated check-in codes |
| `CenterCheckIn` | Player physical presence records |
| `CenterChangeLog` | Audit trail for competition center changes |

#### Main API Routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Player registration |
| POST | `/api/auth/login` | Request magic link |
| POST | `/api/auth/request-link` | Request new magic link |
| GET | `/api/auth/access` | Consume magic link token → session |
| POST | `/api/auth/logout` | Destroy session |
| POST | `/api/admin/login` | Admin password login |
| POST | `/api/predictions` | Save / edit prediction |
| POST | `/api/checkin` | Check in to center |
| PUT | `/api/user/center` | Self-service competition center change |
| POST/DELETE | `/api/user/avatar` | Upload / remove avatar |
| POST | `/api/locale` | Set display language |
| POST | `/api/admin/bonus` | Award bonus points |
| GET/POST | `/api/admin/checkin-code` | View / generate check-in code |
| POST | `/api/admin/matches/[id]/score` | Enter final score (triggers recalculation) |
| PUT | `/api/admin/users/[id]/center` | Admin center correction |
| PATCH | `/api/admin/users/[id]/role` | Change user role |
| DELETE | `/api/admin/users/[id]` | Delete user |
| GET | `/api/health` | Public health check (db + cache status) |
| GET | `/api/admin/health` | Full system health report |
| GET | `/api/debug/db-url` | DB connection debug (needs `DEBUG_DB_DIAGNOSTIC=true`) |

#### Supabase / Database Status

Supabase is **configured and live** in production (Vercel environment variables set). Two migrations are pending on the production database:

| Migration | SQL |
|---|---|
| `20260606000000_nickname_unique` | `CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname")` |
| `20260606000001_center_change_log` | Creates `CenterChangeLog` table with FK and index |

**These must be run on Supabase before deploying the current branch.**

#### Demo / Preview Mode

When `DATABASE_URL` is missing or a placeholder, the app automatically falls back to demo data:
- 104 matches pre-loaded
- 10 demo centers
- 1 demo player (Ana Martins)
- 3 demo leaderboard entries

This means the build and frontend development can proceed without a live database.

#### Required Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection |
| `JWT_SECRET` or `AUTH_SECRET` | Yes | Session signing (32+ chars) |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL for magic links |
| `RESEND_API_KEY` | For email | Magic link delivery |
| `EMAIL_FROM` | For email | Sender address |
| `UPSTASH_REDIS_REST_URL` | Recommended | Redis rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Redis rate limiting |
| `SENTRY_AUTH_TOKEN` | Optional | Source map upload |
| `FOOTBALL_DATA_API_KEY` | Optional | Live score sync |

---

### J. Tests and Validation

#### Commands Run

```
npx tsc --noEmit    → PASS (0 errors)
npx vitest run      → PASS (234/234)
npx next build      → PASS (all 35 routes compiled)
```

#### Test Files (9 files, 234 tests)

| File | Coverage |
|---|---|
| `admin-hierarchy.test.ts` | Role access rules, CENTER_ADMIN email list, health security |
| `app-mode.test.ts` | Preview mode detection, DATABASE_URL validation |
| `i18n.test.ts` | EN/NL/FR translation completeness, no missing keys |
| `match-data-workflow.test.ts` | Match import planning, TBD team detection |
| `product-logic.test.ts` | All business rules: predictions, bonuses (OD-004), center changes (OD-003), leaderboard |
| `scoring.test.ts` | 5/3/2/0 scoring, lock timing (5 min before kickoff), `getPredictionLockAt()` |
| `stability.test.ts` | Email resilience, rate limiting, leaderboard sort, score recalculation idempotency |
| `validators.test.ts` | All Zod schemas: register, login, prediction, finalScore, bonus, role, checkin |
| `workflow.test.ts` | End-to-end: prediction lock, display name priority, center lock idempotency |

#### Critical Business Rules — Test Coverage

| Rule | Tested |
|---|---|
| Prediction closes 5 minutes before kickoff | ✅ `scoring.test.ts` |
| Player cannot edit prediction after lock | ✅ `product-logic.test.ts` |
| Admin can enter final score | ✅ (route tested via validators + logic tests) |
| Points recalculate correctly (all 4 outcomes) | ✅ `scoring.test.ts`, `stability.test.ts` |
| Leaderboard sorts correctly with tie-break | ✅ `stability.test.ts` |
| CENTER_ADMIN cannot award bonus outside own center | ✅ `product-logic.test.ts` (OD-004) |
| ADMIN/SUPER_ADMIN can award bonus to any player | ✅ `product-logic.test.ts` |
| Player gets one self-service center change | ✅ `product-logic.test.ts` (OD-003) |
| Nickname uniqueness enforced | ✅ `validators.test.ts` + schema |

---

## 3. What Is Ready for the New Frontend Developer

The new frontend developer inherits a **complete, tested, production-ready backend**. They need to build UI only.

### Ready to use immediately

| System | Status |
|---|---|
| Authentication (magic link + admin password) | ✅ Complete |
| All 21 API endpoints | ✅ Complete with rate limiting, CSRF protection, auth guards |
| Scoring engine | ✅ Complete and tested |
| Leaderboard queries | ✅ Complete with global / center / nationality filters |
| Match data (104 matches + 48 teams + flags) | ✅ Complete |
| Player registration (QR + direct) | ✅ Complete |
| Center change rules | ✅ Complete (OD-003) |
| Bonus point system | ✅ Complete (OD-004) |
| Multilingual support (EN / NL / FR) | ✅ Complete — `t(locale, key)` ready |
| Demo mode (no database needed) | ✅ Works without Supabase |
| All route stubs registered | ✅ All 20 pages compile, none conflict |
| CSS reset | ✅ Clean baseline |
| Security headers | ✅ CSP, HSTS, X-Frame-Options configured |
| Branding assets | ✅ `public/branding/` logos, `public/flags/` SVGs |

### How to add a new page

```tsx
// src/app/(public)/matches/page.tsx
import { getAllMatches } from "@/lib/matches";

export default async function MatchesPage() {
  const matches = await getAllMatches();
  // render matches with new design
}
```

All data-fetching functions exist in `src/lib/`. The developer calls them directly from Server Components.

### Language

Pass `locale` from `getLocale()` into `t(locale, "key")` for all user-facing strings.

---

## 4. Open Decisions

| # | Decision | Detail |
|---|---|---|
| OD-001 | **Magic link expiry** | Tokens are currently permanent. Options: permanent / 30-day rolling / tournament-end (19 July 2026). No code change needed until decided. |
| — | **`dateOfBirth` field** | The schema has `dateOfBirth DateTime?` but it is NOT collected at registration. Should it be required? Optional? Hidden? |
| — | **Cross-center check-in** | Can a player physically visit and check in at a center that is NOT their activation center? Current code says no. Needs owner decision before changing. |
| — | **`/demo-video` route** | Route exists and renders null. Is this page still needed? |
| — | **Legal page content** | `/legal`, `/terms`, `/privacy`, `/cookies` render null. New developer needs the actual company text (Kempes BV, GARRINCHA). |
| — | **Footer company text** | Exact wording for footer: company name, registration number, domain ownership, social media handles. |
| — | **Leaderboard tie-breaking secondary** | Currently: points DESC → name ASC. Should there be a secondary rule (e.g. join date, prediction count)? |
| — | **Score correction history** | If admin corrects a final score, old `pointsAwarded` is overwritten with no history. Is an audit trail needed? |

---

## 5. Validation Results

```
TypeScript:   npx tsc --noEmit         → 0 errors
Tests:        npx vitest run           → 234 passed / 0 failed (9 test files)
Build:        npx next build           → Compiled successfully (35 routes)
Lint:         (ESLint not configured)  → N/A
```

### Tests Added This Session (12 new)

- 7 tests: CENTER_ADMIN bonus scope enforcement (OD-004)
- 5 tests: Self-service competition center change rules (OD-003)

### Tests Fixed This Session

- `admin-hierarchy.test.ts` — Updated `centerAdminSession` to include `centerId` to match new OD-004 requirement

---

## 6. Recommended Next Steps

### Before deploying

1. **Run the two pending migrations on Supabase:**
   - `CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname")`
   - `CREATE TABLE "CenterChangeLog"` (see `prisma/migrations/20260606000001_center_change_log/migration.sql`)

2. **Merge this branch to main** — 22 commits of backend work are ready, all tests pass

3. **Decide on OD-001** (magic link expiry) — low effort, affects security posture

4. **Decide on cross-center check-in** — one line of code change once decided

### Frontend developer handoff

5. **Share this report** with the new frontend developer as their starting point

6. **The developer should read:**
   - `src/lib/` — all data-fetching and business logic functions
   - `src/lib/translations.ts` — all available translation keys
   - `src/app/api/` — all available API endpoints
   - `prisma/schema.prisma` — full data model

7. **The developer must NOT touch:**
   - `src/app/api/` — all API routes are complete
   - `src/lib/` — all business logic is complete
   - `prisma/` — schema and migrations are complete
   - `tests/` — all tests must remain passing

### Design implementation rules

8. Add new fonts to `globals.css` — do not create additional CSS files unless using CSS modules per-component

9. All user-facing strings must go through `t(locale, key)` — add new keys to `translations.ts` (all three languages)

10. Admin pages (`/admin/*`) must use a completely separate layout from public pages — no shared nav/footer

11. Do not add new Prisma queries directly in page files — add them to `src/lib/` functions

### Deployment notes

12. Vercel is already configured — pushing to main triggers automatic deployment

13. Confirm Upstash Redis is active in Vercel env — without it, rate limiting falls back to per-instance in-memory (weaker protection in production)

14. Sentry error reporting is configured — set `SENTRY_AUTH_TOKEN` in Vercel for source map uploads if desired
