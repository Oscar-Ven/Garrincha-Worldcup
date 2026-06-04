---
description: Audit the GARRINCHA app UI for visual consistency, mobile-first compliance, accessibility, and missing CSS
---

Perform a design system and UI consistency audit for the GARRINCHA World Cup Prediction App.

The app uses: Next.js 16 App Router, Tailwind CSS v4, DaisyUI v5, custom CSS in `globals.css` and `mobile.css`.
Target: mobile-first, sports campaign aesthetic, GARRINCHA brand (green #08eb9a, black #252320).

Steps:

1. Read `src/app/globals.css` and `src/app/mobile.css` fully.
   - List all defined custom CSS classes.
   - Note the design tokens (colors, spacing, typography, radius, shadow).

2. Grep all `.tsx` files in `src/` for `className=` attributes.
   - Extract every custom class name used.
   - Cross-check: are any custom classes used in JSX but NOT defined in globals.css or mobile.css?
   - Report missing class definitions.

3. Check for design inconsistencies:
   - Mixed button styles (inconsistent primary/dark/outline usage)
   - Inconsistent spacing (mixed padding values not using design tokens)
   - Hardcoded color values in JSX `style=` attributes that should use CSS variables
   - Cards with inconsistent padding or border-radius

4. Mobile-first audit:
   - Are all interactive elements at least 44px tall (touch target)?
   - Is `font-size: 16px` set on form inputs to prevent iOS zoom?
   - Does the bottom nav show only on mobile (≤720px)?
   - Are leaderboard table columns appropriately hidden on small screens?

5. Accessibility quick-check:
   - Are all `<img>` tags or emoji icons using `aria-hidden` or `alt`?
   - Do all icon-only buttons have `aria-label`?
   - Are form fields using `<label>` elements?
   - Is there visible focus styling (`:focus-visible`)?

6. GARRINCHA brand consistency:
   - Is `var(--green)` (#08eb9a) used consistently for CTAs and highlights?
   - Is `var(--black)` (#252320) used for dark backgrounds?
   - Are headings using the Barlow Condensed font via `var(--font-heading)`?

7. Report:
   - Missing CSS class definitions (blocking — will break layout)
   - Design inconsistencies found (non-blocking)
   - Accessibility issues found (priority based on severity)
   - Mobile issues found
   - Recommendations for improvement
