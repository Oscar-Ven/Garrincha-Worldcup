# Match Data, Predictions, and Score Workflow

This app separates football match data from user prediction data.

## Sources Of Truth

- Football data provider: teams, fixtures, kickoff times, venues, match status, and final scores.
- Supabase/PostgreSQL: users, predictions, bonus points, leaderboard history, admin actions, and seeded match slots.
- Admin: final campaign authority before points are recalculated.

The browser must not call the football data API directly. API keys stay server-side only.

## Provider Setup

External provider: `api-football`.

Expected env names:

- `FOOTBALL_DATA_PROVIDER`
- `FOOTBALL_DATA_COMPETITION_CODE`
- `FOOTBALL_DATA_SEASON`
- `FOOTBALL_DATA_API_KEY`

The app imports API-Football data into its own `Team` and `Match` tables instead of depending on provider responses at page render time.

## Import Workflow

1. Admin or scheduled job requests API-Football fixtures.
2. API-Football response is normalized into internal match data.
3. Existing `Match` rows are matched by `fifaMatchNo` or stable match slot.
4. The app updates fixture fields only:
   - `kickoffAt`
   - `venue`
   - home/away teams when TBD slots become known
   - match live/final status draft
5. Existing `Match.id` values are preserved.
6. Existing `Prediction` rows are never deleted or recreated.

## Prediction Safety Rules

- Users predict against the app's stored match slot, not against a temporary provider object.
- If a TBD team becomes an official team, keep the same `Match.id`.
- If kickoff changes before lock time, update `kickoffAt`.
- If kickoff changes after predictions locked, require admin review.
- If a match is postponed or cancelled, keep predictions and apply campaign rules manually.
- Do not overwrite finalized scores from an API without admin confirmation.

## Final Score Workflow

1. API-Football may fetch a final score.
2. The app may store or show it as a draft/review item.
3. Admin confirms the final score.
4. Only after admin confirmation does the existing score endpoint update the match and recalculate points.

This protects the campaign from API mistakes and keeps prize/leaderboard decisions auditable.

## Old Prediction Data

Old predictions remain in Supabase:

- `Prediction.homeScore`
- `Prediction.awayScore`
- `Prediction.pointsAwarded`
- `Prediction.calculatedAt`
- related `PointEvent` bonus records

API-Football sync must never delete old predictions. Score edits overwrite `pointsAwarded` on the existing prediction rows rather than creating duplicate scoring rows.

## Current Implementation Status

The repo includes workflow logic in `src/lib/match-data-workflow.ts`, an API-Football client in `src/lib/api-football-client.ts`, and the admin sync endpoint at `src/app/api/admin/sync-matches/route.ts`.

The sync is server-side only and requires `FOOTBALL_DATA_PROVIDER=api-football`, `FOOTBALL_DATA_COMPETITION_CODE=1`, `FOOTBALL_DATA_SEASON=2026`, and `FOOTBALL_DATA_API_KEY`.
