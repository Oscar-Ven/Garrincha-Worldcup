# Render Worker (Future Optional)

The main Next.js app is deployed on Vercel.

Render is reserved only for a future background worker, such as scheduled football fixture/result sync, if that work becomes necessary outside the Vercel app runtime.

Current status:

- No Render main-app Web Service is configured in this repo.
- No Render deploy workflow is active.
- Do not deploy the Next.js app to Render.
- Keep Supabase as the only real database.
- Keep migrations as a deliberate manual release step, not a build step.

Potential future worker responsibilities:

- Fetch football provider fixture updates server-side.
- Stage fixture/result changes for admin review.
- Preserve internal `Match.id` values and all `Prediction` rows.
- Never recalculate points without admin confirmation.
