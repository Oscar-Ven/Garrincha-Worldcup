---
description: Audit EN/NL/FR translation completeness and flag any missing, untranslated, or inconsistent keys
---

Audit the GARRINCHA World Cup Prediction App translation system for completeness and consistency.

The translation system lives in `src/lib/translations.ts`.
The three supported locales are: `en` (English), `nl` (Nederlands), `fr` (Français).

Steps:

1. Read `src/lib/translations.ts` in full.

2. Extract the key list from the `en` (English) locale — this is the authoritative key set.

3. For each locale (`nl`, `fr`), check:
   - Every English key exists in the locale.
   - No extra keys exist in the locale that are NOT in English.
   - No value is identical to its key (e.g. `"nav.login": "nav.login"` means it's untranslated).
   - No value is an empty string.

4. Search all `.tsx` files in `src/` for any hardcoded English strings that should use `t(locale, "...")` instead.
   Focus on: page headings, button labels, form labels, error messages, notice banners.
   Ignore: proper nouns, brand names (GARRINCHA, World Cup), and strings that are the same in all languages.

5. Verify that the `isLocale()` function correctly validates all three locales.

6. Verify that the `LanguageSwitcher` component includes buttons for all three locales.

7. Report:
   - Missing keys per locale (if any)
   - Extra keys per locale (if any)
   - Likely-untranslated hardcoded strings found in .tsx files
   - Overall completeness score (keys present / total English keys × 100)
   - Any recommendations
