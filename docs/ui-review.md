# UI Review

This review used the app in no-database UI preview mode with demo data. For live review, use Supabase connection strings and set APP_PREVIEW_MODE=false.

## Pages Reviewed

- Landing page
- Register page
- User login page
- Admin login page
- User dashboard
- Leaderboards
- Admin overview
- Admin match score page
- Admin bonus points page

## Issues Found

- Public data pages crashed without `DATABASE_URL`, which blocked browser-style UI review before Supabase setup.
- Demo data was not clearly labeled, making fallback content easy to confuse with real campaign data.
- Protected dashboard and admin pages could not be visually reviewed without a live database/session.
- Placeholder campaign and flag assets needed clearer fallback handling.

## Fixes Made

- Added no-database UI preview data for landing, register centers, dashboard matches, leaderboards, admin overview, admin score entry, and admin bonus pages.
- Added a visible preview-data notice when Supabase is not connected.
- Kept real database behavior unchanged when `DATABASE_URL` is present.
- Confirmed all reviewed routes render successfully without `.env`.
- Kept forms, score inputs, buttons, cards, badges, and admin warning styles consistent with the existing visual system.
- Refined the dashboard match cards toward a simple WK pronostiek-style layout with teams on opposite sides, centered kickoff, and score inputs below.
- Added campaign placeholders for logo, prize information, QR-code entry, banner artwork, and center/company copy.
- Replaced shared placeholder flag rendering with reusable country/nationality flag display and neutral fallback behavior.

## Country Flag Support

- Team flags now resolve from team name or FIFA-style team code.
- Nationality flags now appear where nationality is shown in leaderboards.
- Unknown, TBD, or missing flags use a neutral diamond fallback so the UI does not show a misleading country.
- The flag system is emoji-based for this phase, avoiding copied external flag assets and keeping the project self-contained.
- Seed/demo data now carries country-style flag identifiers where available, without requiring a live database seed in this phase.

## Remaining Visual Risks

- This pass used route rendering and static review, not final browser screenshots with real Supabase content.
- Long real team names, center names, or user display names should still be checked with production data.
- The full 104-match dashboard may need filters or date grouping after real user testing.
- Admin pages in preview mode show demo content without a real session only when no `DATABASE_URL` is configured; live Supabase mode still requires admin authentication.
- Emoji flag rendering can differ slightly by device and operating system.

## Assets Still Needed From GARRINCHA

- Official GARRINCHA campaign logo.
- Final World Cup prediction banner artwork.
- Center-specific banner images.
- Real team flag assets or approved flag provider strategy.
- Sponsor/prize artwork and campaign copy.
- Brand color and typography confirmation.
