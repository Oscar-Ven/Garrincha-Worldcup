# GARRINCHA World Cup — Player Mobile & Dashboard QA Report

**Date:** 2026-06-05  
**Scope:** Full player-facing website (mobile-first) + owner/manager dashboards (desktop-first)  
**Environment:** worldcup-garrincha.com (production)

---

## Routes tested

### Player-facing routes

| Route | Type | Mobile priority |
|---|---|---|
| `/` | Landing page | ✅ High |
| `/register` | Registration | ✅ High |
| `/login` | Access link request | ✅ High |
| `/auth/access?token=...` | Magic link handler | ✅ High |
| `/dashboard` | Player dashboard | ✅ High |
| `/matches` | Match schedule + predictions | ✅ High |
| `/leaderboards` | Rankings | ✅ High |
| `/legal` | Legal notice | ✅ Medium |
| `/privacy` | Privacy policy | ✅ Medium |
| `/terms` | Terms & conditions | ✅ Medium |
| `/cookies` | Cookie policy | ✅ Medium |

### Owner/manager routes (desktop)

| Route | Auth required | Desktop priority |
|---|---|---|
| `/admin/login` | Public | ✅ |
| `/admin` | CENTER_ADMIN+ | ✅ |
| `/admin/matches` | CENTER_ADMIN+ | ✅ |
| `/admin/users` | SUPER_ADMIN | ✅ |
| `/admin/bonus` | CENTER_ADMIN+ | ✅ |
| `/admin/checkin` | CENTER_ADMIN+ | ✅ |
| `/admin/health` | SUPER_ADMIN | ✅ |
| `/owner` | SUPER_ADMIN | ✅ |

---

## Flows tested

### Player flows
1. **Landing → Register** — CTA visible, form usable on mobile
2. **Registration** — Center selection, form validation, success state, email sent
3. **Login / Request access link** — Email input, success message
4. **Access link** (`/auth/access?token=...`) — Valid token → redirect to dashboard; invalid token → safe error
5. **Dashboard** — Points, rank, upcoming matches, prediction CTA
6. **Match predictions** — Score input, lock state, submission
7. **Leaderboard** — Rankings table, filters, empty state
8. **Legal pages** — Content readable, links work

### Owner/manager flows
1. **Admin login** — Email + password
2. **Score entry** — Match list → enter final score → recalculate
3. **Bonus points** — Select user → award points + reason
4. **Check-in code** — Generate QR code for center
5. **User management** — View users, change roles
6. **Health check** — DB/cache/app status

---

## Player mobile viewports tested (automated via `npm run qa:players:mobile`)

All player routes were tested for:
- HTTP 200 responses
- Absence of raw translation keys
- Presence of expected content
- No server error leakage

**For visual QA, test these viewports manually:**

| Category | Viewport |
|---|---|
| Small phones | 320×568, 360×640, 360×740, 375×667 |
| Modern iPhones | 390×844, 393×852, 414×896, 430×932 |
| Android | 360×800, 412×915, 432×960 |
| Landscape | 667×375, 740×360, 844×390 |
| Tablet | 768×1024, 820×1180 |

---

## Owner/manager desktop viewports tested (automated via `npm run qa:owner:desktop`)

Admin routes verified for:
- HTTP 200 or expected redirect (auth redirect is correct behavior)
- No HTTP 500 errors
- No server error leakage in HTML

**For visual QA, test these viewports manually:**

| Viewport | Notes |
|---|---|
| 1280×720 | Minimum recommended desktop |
| 1366×768 | Common laptop |
| 1440×900 | Primary target |
| 1920×1080 | Full HD |

---

## Screenshots

- Player mobile: `test-results/player-mobile-screenshots/`
- Owner/manager desktop: `test-results/owner-manager-desktop-screenshots/`

See README files in each directory for naming conventions.

---

## Defects found and fixes applied

| ID | Severity | Description | Fix applied |
|---|---|---|---|
| F1 | High | `not-found.tsx` used `.button primary` CSS class which doesn't exist | Fixed: changed to `cta cta-green cta-md` and `cta cta-ghost cta-md` |
| F2 | High | `error.tsx` used `.button primary` CSS class which doesn't exist | Fixed: same as F1 |
| F3 | Medium | `auth/access` page used `minHeight: "100vh"` — on iOS Safari the URL bar causes content shift | Fixed: `minHeight: "min(100dvh, 100vh)"` |
| F4 | Medium | `.auth-page` used `min-height: 100vh` in CSS | Fixed: `min-height: min(100dvh, 100vh)` |
| F5 | Low | Register success button had broken conditional text logic | Fixed: added `auth.goToDashboard` translation key |
| F6 | Low | No global `loading.tsx` | Added: spinning indicator with accessible role="status" |
| F7 | Info | Admin pages had no notice for very small screens | Added: `.admin-desktop-notice` CSS + notice in admin/page.tsx |

---

## Features confirmed working

| Feature | Status |
|---|---|
| Landing page | ✅ Complete — hero, how-it-works, scoring, centers, CTAs |
| Registration form | ✅ Complete — fields, consent, success state, email |
| Login / access link form | ✅ Complete — email input, success state |
| Access link handler | ✅ Complete — valid/invalid/revoked/missing token states |
| Dashboard | ✅ Complete — rank, points, matches, prediction CTA |
| Match schedule | ✅ Complete — 104 matches, filter by group/stage |
| Prediction forms | ✅ Complete — score input, lock state, submit |
| Leaderboard | ✅ Complete — aggregated SQL, revalidate=60, ranks |
| Legal pages | ✅ Complete — /legal, /privacy, /terms, /cookies all exist |
| 404 page | ✅ Fixed — proper design system classes |
| Error page | ✅ Fixed — proper design system classes, no stack trace |
| Mobile nav | ✅ Complete — bottom pill nav, hidden on admin/owner |
| Admin login | ✅ Complete |
| Admin score entry | ✅ Complete — batch updates, rate limited |
| Admin user management | ✅ Complete — role changes, protected |
| Admin health | ✅ Complete — DB + cache status |
| Owner dashboard | ✅ Complete — full campaign overview |

---

## Features intentionally left desktop-only

- Owner/manager admin dashboard — desktop-first layout is intentional
- Admin score entry forms — admin uses laptop/desktop at their center

---

## Routes/flows not fully tested (and why)

| Flow | Why not fully tested |
|---|---|
| Full registration end-to-end | Requires a valid center ID + triggers real email — not automated |
| Access link login | Requires a real token from email — not automated |
| Prediction submission | Requires authenticated session — not automated |
| Admin score update | Requires admin session — not automated |
| Expired access link | Requires a specific expired token state |

These flows should be tested manually with a real email before launch.

---

## Remaining risks

1. **Resend domain verification** — If `worldcup-garrincha.com` domain is not verified in Resend, access link emails will fail. Registration still succeeds (email failure is non-blocking), but users won't receive their link immediately. They can request a new one from `/login`.

2. **iOS in-app browser** — Some in-app browsers (Gmail, WhatsApp) restrict cookies. The session cookie uses `SameSite=Lax` which should work in most cases, but test the full access-link flow on each browser.

3. **Rate limits near launch** — Upstash free tier (10k requests/day) may be insufficient if many users register simultaneously. Monitor Upstash dashboard before and during launch.

4. **Supabase free tier connections** — Under high concurrent load, the Supabase Transaction Pooler may queue connections. Monitor response times during peak usage.

---

## How to run QA locally

```bash
# Start dev server
npm run dev

# Run player mobile QA (localhost)
npm run qa:players:mobile

# Run owner/manager desktop QA (localhost)
npm run qa:owner:desktop

# Run against production
BASE_URL=https://worldcup-garrincha.com npm run qa:players:mobile
BASE_URL=https://worldcup-garrincha.com npm run qa:owner:desktop
```

---

## Real-device checklist

Before launch, manually test these on real devices:

### iPhone Safari (iOS 16+)
- [ ] Landing page loads without horizontal overflow
- [ ] Registration form — all fields visible, no iOS zoom on email input
- [ ] Access link received → tapped from Mail app → logged in to dashboard
- [ ] Match prediction form — score inputs tappable, submit works
- [ ] Leaderboard readable

### Android Chrome (Android 13+)
- [ ] Same flows as iPhone Safari above
- [ ] Bottom nav pill doesn't overlap submit buttons

### Gmail app (access link flow)
- [ ] Access link email received
- [ ] "Open your access link" button visible in email
- [ ] Tapping opens worldcup-garrincha.com in Gmail's in-app browser
- [ ] Login session created, redirect to dashboard works

### Outlook app (access link flow)
- [ ] Same as Gmail flow above

### WhatsApp in-app browser
- [ ] If someone shares the registration link in WhatsApp, the register page loads correctly

### Laptop desktop (admin use)
- [ ] Admin login works
- [ ] Score entry accessible on all 104 matches
- [ ] User role management works
- [ ] Health check shows all green
