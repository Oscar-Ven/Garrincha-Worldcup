# Frontend Designer Handoff — GARRINCHA World Cup 2026

**Date:** June 2026  
**Branch:** `main`  
**Build status:** ✅ typecheck clean · ✅ lint 0 errors · ✅ production build passes

---

## A. Project Overview

GARRINCHA World Cup 2026 is a score-prediction campaign app for players across 10 GARRINCHA fitness centers in Belgium. Players register, predict match scores for the 2026 FIFA World Cup, earn points (5 pts exact, 3 pts result, 2 pts goal diff), and compete on center and global leaderboards.

**Scale:** ~17 registered players currently; expected low hundreds at peak.  
**Deployment:** Vercel (production at worldcup-garrincha.com) + Supabase PostgreSQL.  
**Stack:** Next.js 16.2.6 (App Router, Turbopack), React 19, Tailwind CSS 4, Prisma 7 (PostgreSQL via Supabase), `jose` for JWT, Zod for validation.

---

## B. Tech Stack Details

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router) |
| Styling | Tailwind CSS 4 — utility-first, no component library |
| Icons | lucide-react |
| Font | Inter (Google Fonts via `next/font`) |
| ORM | Prisma 7 + pg adapter (Supabase PostgreSQL) |
| Auth | Custom JWT (`jose`) + httpOnly cookie |
| Middleware | `src/proxy.ts` — admin guard, session refresh, locale cookie |
| Validation | Zod 4 |
| Hosting | Vercel (auto-deploy from main branch) |
| Error tracking | Sentry |

---

## C. Route Architecture

```
/                           → redirects to /en
/[locale]/                  → landing page (en | fr | nl)
/[locale]/register          → player registration form
/[locale]/matches           → public match schedule
/[locale]/leaderboards      → public leaderboard
/[locale]/privacy           → privacy policy
/[locale]/terms             → terms
/[locale]/cookies           → cookie policy

/login                      → player magic-link login (30-day session)
/register                   → redirects to /en/register

/dashboard                  → player home (requires auth)
/predictions                → score prediction interface
/matches                    → player match list
/leaderboards               → player leaderboard with center grouping
/my-points                  → points history
/center                     → center assignment
/profile                    → player profile editor
/auth/access                → magic-link landing handler

/admin                      → admin overview dashboard
/admin/login                → admin credential login
/admin/users                → user management (search, role, center)
/admin/matches              → match score entry
/admin/checkin              → daily check-in management
/admin/bonus                → manual bonus points
/admin/leaderboards         → admin leaderboard view
/admin/centers              → center management
/admin/audit                → audit log
/admin/health               → system health check
```

**Route groups:**
- `(player)` — authenticated player routes; layout wraps with `PlayerShell` sidebar + mobile nav
- `(auth)` — login/register wrappers
- `(public)` — redirects (legacy paths)
- `[locale]` — public-facing pages with i18n
- `admin` — admin portal; protected by `src/proxy.ts` JWT guard

---

## D. Page Inventory — Current State

### Public / [locale] pages
| Page | File | State |
|------|------|-------|
| Landing | `src/app/[locale]/page.tsx` | ✅ Functional with real DB data (top players, countdown, flags) |
| Register | `src/app/[locale]/register/RegisterForm.tsx` | ✅ Functional — full registration form |
| Matches | `src/app/[locale]/matches/page.tsx` | ✅ Functional — public match schedule |
| Leaderboards | `src/app/[locale]/leaderboards/page.tsx` | ✅ Functional |
| Privacy/Terms/Cookies | various | ✅ Static text pages |

### Player app (authenticated)
| Page | File | State |
|------|------|-------|
| Dashboard | `src/app/(player)/dashboard/page.tsx` | ✅ Functional — stats, predictions, match cards |
| Predictions | `src/app/(player)/predictions/page.tsx` | ✅ Functional — score inputs with lock state |
| Matches | `src/app/(player)/matches/page.tsx` | ✅ Functional |
| Leaderboards | `src/app/(player)/leaderboards/page.tsx` | ✅ Functional |
| My Points | `src/app/(player)/my-points/page.tsx` | ✅ Functional |
| Center | `src/app/(player)/center/page.tsx` | ✅ Functional |
| Profile | `src/app/(player)/profile/page.tsx` | ✅ Functional |
| Login | `src/app/(auth)/login/page.tsx` | ✅ Functional — magic-link email form |
| Register | `src/app/(auth)/register/page.tsx` | ✅ Functional — redirect to /[locale]/register |

### Admin
| Page | File | State |
|------|------|-------|
| Overview | `src/app/admin/page.tsx` | ✅ Functional — center metrics, links |
| Users | `src/app/admin/users/UsersClient.tsx` | ✅ Functional — search, role/center edit, delete |
| Matches | `src/app/admin/matches/MatchesClient.tsx` | ✅ Functional — score entry, recalculation |
| Checkin | `src/app/admin/checkin/CheckinClient.tsx` | ✅ Functional |
| Bonus | `src/app/admin/bonus/BonusFormClient.tsx` | ✅ Functional |
| Login | `src/app/admin/login/page.tsx` | ✅ Functional |
| Health | `src/app/admin/health/page.tsx` | ✅ Functional — live DB check |

### Error / system
| File | State |
|------|-------|
| `src/app/error.tsx` | ✅ Real error page (try again + go home) |
| `src/app/not-found.tsx` | ✅ Real 404 page |
| `src/app/admin/error.tsx` | ✅ Real admin error page |
| `src/app/(player)/dashboard/error.tsx` | Functional |

---

## E. Component Inventory

```
src/components/
├── admin/
│   └── AdminLayoutClientShell.tsx   — sidebar nav + mobile drawer for admin portal
├── player/
│   ├── PlayerShell.tsx              — sidebar + bottom nav for player app
│   ├── PredictionBoard.tsx          — score input cards with lock state
│   ├── CenterClient.tsx             — center assignment UI
│   └── ProfileClient.tsx            — profile edit form
└── public/
    ├── Navbar.tsx                   — public navbar with mobile hamburger
    ├── Footer.tsx                   — public footer
    ├── CountdownTimer.tsx           — live countdown to June 11 kickoff
    ├── FAQAccordion.tsx             — accordion FAQ component
    └── LanguageSwitcher.tsx         — EN/FR/NL switcher
```

---

## F. Design System — Current State

### Colors (Tailwind classes in use)
- **Background:** `bg-zinc-950` (near-black `#09090b`)
- **Surface:** `bg-zinc-900`, `bg-zinc-800`, `bg-white/5`, `bg-black/20`
- **Accent / primary:** `lime-400` (`#a3e635`) — CTAs, active states, highlights
- **Text primary:** `text-white`
- **Text secondary:** `text-zinc-400`, `text-zinc-300`
- **Text muted:** `text-zinc-500`, `text-zinc-600`
- **Borders:** `border-zinc-800`, `border-white/10`, `border-white/6`
- **Error:** `text-red-400`, `bg-red-900/10`, `border-red-900/50`
- **Success/points:** `text-lime-400`, `bg-lime-400/15`

### Typography
- **Font:** Inter (loaded via `next/font/google`, variable `--font-inter`)
- **Headings:** `font-black uppercase tracking-tight` (or `tracking-tighter`)
- **Labels:** `font-bold uppercase tracking-[0.2em]` — small caps style
- **Body:** `font-medium` or `font-semibold`, `text-zinc-300`

### globals.css
```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-inter, ui-sans-serif, system-ui, sans-serif);
  --font-display: var(--font-inter, ui-sans-serif, system-ui, sans-serif);
}
```
Minimal by design — all styling is via Tailwind utility classes. The designer can add CSS custom properties here for design tokens.

### Flags
- Team flags served from `flagcdn.com` (e.g., `https://flagcdn.com/w40/be.png`)
- ISO 3166-1 alpha-2 codes stored in the `Team.fifaCode` DB column
- Whitelisted in `next.config.ts` remotePatterns and CSP headers

---

## G. What You CAN Safely Edit (Designer Scope)

All page files, component files, and globals.css additions are fair game. The key constraint is: **do not change logic, do not change API calls, do not touch schema or auth**.

**Safe to redesign:**
- All files under `src/app/` that are page UI (`.tsx` page files, layout files)
- All files under `src/components/`
- `src/app/globals.css` — add tokens, custom utilities
- Static assets under `public/`
- `src/app/[locale]/register/RegisterForm.tsx` — form layout only (not the fetch/submit logic)

**Safe to modify UI on:**
- Landing page hero, sections, cards
- Player dashboard layout and card styles
- Admin portal visual hierarchy
- Navigation bars (mobile and desktop)
- Error pages
- All typography, spacing, color, border radius choices

---

## H. Protected Files — Do NOT Touch

```
prisma/                          — schema and migrations
src/lib/                         — all backend logic and utilities
src/app/api/                     — all API route handlers
next.config.ts                   — image domains, CSP headers wired here
vercel.json                      — cron jobs and deployment config
.env                             — secrets (never commit)
instrumentation.ts               — Sentry init
sentry.*.config.ts               — Sentry config
```

**Specific lib files that are business-critical:**
- `src/lib/auth.ts` — session management
- `src/lib/scoring.ts` — points calculation
- `src/lib/prisma.ts` — DB client
- `src/lib/player-app.ts` — player session context
- `src/lib/access-link.ts` — magic link logic
- `src/lib/rate-limit.ts` — rate limiting
- `src/lib/request-security.ts` — request validation
- `src/lib/validators.ts` — Zod schemas
- `src/lib/translations.ts` — i18n strings (safe to add keys, don't rename/remove)

---

## I. Changes Made in This Handoff Session

| Task | What changed |
|------|-------------|
| Proxy wired | `src/proxy.ts` export renamed to `proxy` (Next.js 16 convention); all admin guard, session refresh, locale cookie logic now active |
| Error pages | `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/admin/error.tsx` replaced from `return null` stubs to real content |
| Cleanup | Deleted screenshot files, tmp folders, empty `src/types/` dir, `.next-*.log` files, `coverage/` and `test-results/` |
| Dependency | Removed unused `clsx` from `package.json`; `package-lock.json` updated |
| Hamburger tap targets | `src/components/public/Navbar.tsx`: `p-1` → `p-3`; `src/components/player/PlayerShell.tsx`: `p-2` → `p-3` (44×44px minimum) |
| Countdown mobile | `src/app/[locale]/page.tsx`: added `lg:hidden` CountdownTimer between CTAs and stats bar; desktop version unchanged |
| Accessibility | Added `role="alert"` to error message containers in: `RegisterForm.tsx`, `admin/login/page.tsx`, `MatchesClient.tsx`, `BonusFormClient.tsx`, `CheckinClient.tsx`, `UsersClient.tsx` (×2) |

---

## J. Validation Status

```
npm run typecheck   → ✅ 0 errors, 0 warnings
npm run lint        → ✅ 0 errors, 5 warnings (all in protected lib/ and api/ files)
npm run build       → ✅ Clean build, 57 routes, no warnings
```

The 5 lint warnings are unused variables in protected files (`src/lib/leaderboards.ts`, `src/app/api/user/center/route.ts`, `src/app/admin/health/page.tsx`). Do not touch these files.

---

## K. Local Dev Setup

```bash
npm install
npm run dev          # starts on http://localhost:3000
```

Requires `.env` with valid Supabase connection string, JWT_SECRET, and RESEND_API_KEY. Copy from a team member or the Vercel environment panel.

The app connects to the **production** Supabase database by default (even locally). Use a separate dev database if you need to test destructive operations.

---

## L. i18n (Translations)

All user-facing strings are in `src/lib/translations.ts`. The supported locales are `en`, `fr`, `nl`. Every public page receives `locale` as a route param.

To add a new string:
1. Add it to the `translations` object in `src/lib/translations.ts` for all 3 locales
2. Use `t(locale, "your_key")` in the page component

---

## M. QR Code Policy

The app has **no QR code features**. The QR code is a static external asset pointing to `/en/register`. Do not build: QR generators, QR check-in pages, QR poster download, or `/checkin?code=` flows. The registration page handles everything after a player scans the QR code.

---

## N. Priority Areas for the Designer

The backend is production-ready. The visual layer is functional but unstyled beyond a raw dark Tailwind scaffold. The highest-impact areas to work on:

1. **Player dashboard** — the primary player experience; currently dense with data but no visual hierarchy
2. **Landing page** — public-facing; has structure (hero, how-it-works, scoring, FAQ) but needs campaign polish
3. **Prediction cards** (`PredictionBoard.tsx`) — the core interaction; score inputs need a clear match-card design
4. **Mobile nav** — `PlayerShell.tsx` bottom nav bar (4 items) and hamburger drawer
5. **Registration form** — first impression for new players via QR code entry

Admin portal is lower priority — it's staff-only and functional.

---

## O. Key Design Constraints

- **No full-page rebuilds** — the data-fetching and business logic in each page must stay intact; only the JSX layout and className attributes change
- **Tailwind 4 only** — no CSS-in-JS, no styled-components; add tokens to `globals.css @theme {}` block if needed
- **Dark theme** — the base is `bg-zinc-950 text-white`; do not switch to a light theme globally
- **Touch targets** — minimum 44×44px for all interactive elements (already fixed for hamburgers)
- **Accessible errors** — keep `role="alert"` on error message containers (already added)
- **Flag images** — keep using flagcdn.com; adding other image domains requires updating `next.config.ts` remotePatterns AND the CSP `img-src` directive

---

*Generated during the pre-handoff hardening session on this branch. For backend questions, see `docs/product-logic.md` and `docs/workflow-logic.md`.*
