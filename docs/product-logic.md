# Product Logic

This document describes the current GARRINCHA World Cup prediction rules. Supabase live testing is intentionally postponed until a later phase.

## User Registration

Users register with email, password, date of birth, phone number, optional display name, optional nationality, and one selected GARRINCHA Center. Registration creates a normal `USER` account and starts a secure HTTP-only session.

## Login And Logout

Normal users log in through the user login flow. Admins and super admins log in through the admin login flow. Both use the same secure session cookie, but admin routes require either the `ADMIN` or `SUPER_ADMIN` role. Logout clears the session cookie.

## Predictions

Logged-in users can create one prediction per match. The prediction stores the user's expected home and away score. Users can edit their own predictions unlimited times before the official kickoff time.

Users cannot edit another user's prediction. Admins cannot submit normal user predictions through the prediction endpoint.

## Prediction Locking

Predictions lock at the exact kickoff time. A prediction is editable only when the current time is earlier than `kickoffAt`. At `kickoffAt` and after, the server rejects changes even if the UI is bypassed.

## Scoring

Prediction points are calculated after an admin enters the final match score:

- Exact score: 5 points
- Correct outcome and goal difference: 3 points
- Correct outcome only: 2 points
- Wrong outcome: 0 points

Draws use the same rule. For example, predicting `2-2` for a `1-1` final score earns 3 points because the outcome and goal difference are correct.

When a final score is changed, prediction points are recalculated and overwritten. This avoids duplicate points.

## Match Data Sync

Football API data is treated as match metadata, not as user prediction data. Provider sync can update fixtures, UTC kickoff times, venues, TBD teams, and draft result information, but it must preserve existing `Match.id` values and all `Prediction` rows.

Final scores from a provider should require admin confirmation before the app recalculates prediction points. This prevents API mistakes from automatically changing campaign leaderboards.

## Bonus Points

Admins and super admins can manually award positive or negative bonus points to a user. A bonus requires an admin-level session and a clear reason. Bonus points are stored as separate point events and are included in leaderboard totals.

## Leaderboards

Leaderboard totals combine prediction points and manual bonus point events.

- Global leaderboard: all users sorted by total points descending
- National leaderboard: users filtered by nationality
- GARRINCHA Center leaderboard: users filtered by selected center

Ties are sorted by player name.

## Admin Capabilities

Admins can:

- Log in through the admin login flow
- View admin dashboard metrics
- Enter or update final match scores
- Trigger automatic point recalculation by saving final scores
- Award manual bonus points with a reason

Super admins can do everything admins can do. Super admins also have owner-only access to user role management, where they can promote trusted operators to admin, demote admins back to players, or assign another super admin if the owner explicitly chooses to. The current owner account cannot demote itself.

Normal users cannot access admin actions.

## Still Needs Supabase Live Testing

The following must be confirmed later with real Supabase credentials and a running database:

- Registration writes users to Supabase
- Login sessions work across browser reloads
- Seeded matches, teams, flags, and centers render from Supabase
- Prediction create/edit/lock flows work end to end
- Admin score entry recalculates persisted prediction rows
- Bonus point records persist and appear in leaderboards
- Deployment migration command works against Supabase direct connection
