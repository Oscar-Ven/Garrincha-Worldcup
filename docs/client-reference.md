# Client Reference Notes

Supabase live testing remains postponed. This phase uses the provided WK pronostiek-style reference as structural and campaign inspiration only. No copyrighted client assets were copied into the project.

## What The Reference Shows

- A simple prediction interface with match rows.
- Team flags and team names on opposite sides.
- Match date and kickoff time centered between the teams.
- Score prediction inputs directly connected to the match.
- Campaign branding through logo, colors, background, banners, and promotional text.
- QR-code-driven registration for quick mobile entry.
- Prize information and company/team-building context.
- A friendly game that non-football experts can understand quickly.

## Prediction UI Implications

The app now presents prediction cards closer to a pronostiek sheet:

- Home team on the left.
- Away team on the right.
- Stage and kickoff centered.
- Score boxes below the matchup.
- One clear submit/update button.
- Status badges for upcoming, locked, and completed matches.
- Final score and points earned shown after scoring.
- Country flags are visible beside teams, with a neutral fallback for unknown or TBD teams.

The goal is to make the dashboard feel like a campaign game sheet instead of a generic operational dashboard.

## Campaign Branding Implications

The landing page now includes placeholders for:

- Campaign logo area.
- Campaign banner area.
- Primary color-driven campaign section.
- Background artwork area.
- Company/center-specific intro copy.
- Prize information.
- QR-friendly call to action.

These are placeholders until official GARRINCHA/TIFO assets and copy are provided.

## QR-Code Registration Implications

The landing and register pages are designed for users arriving from a QR code:

- Large mobile-first calls to action.
- Short explanation of the game.
- Registration page copy focused on quick entry.
- Simple steps: scan, register, predict.

## Prize And Promo Material Implications

The app supports promotional copy and prize information on the landing page. Final prize rules, sponsors, dates, and legal copy should come from the client before launch.

## What The Current App Already Supports

- Public campaign landing page.
- User registration and login.
- Admin login.
- Match prediction cards with flags, kickoff, stage, score inputs, status, final score, and points.
- Global, national, and GARRINCHA Center leaderboards.
- Admin score entry and bonus point pages.
- No-database UI preview mode.
- Real database behavior when `DATABASE_URL` exists.

## What Remains For Later

- Official GARRINCHA/TIFO logos and campaign artwork.
- Final flag strategy if the client prefers image assets over emoji flags.
- Real QR code target and printed-poster testing.
- Approved prize and campaign copy.
- Live Supabase audit with real persisted users, predictions, scores, and leaderboards.
- Final mobile screenshot QA with full 104-match data.

## Supabase Status

Supabase is now connected. Migrations and seed have been applied. Docker was never required and is not part of this project.
