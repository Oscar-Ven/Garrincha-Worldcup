# GARRINCHA World Cup Prediction App — Workflow Logic

## 1. First QR Activation
- Player visits a GARRINCHA Center
- Player scans the QR code displayed at the center
- QR links to `/register?code=CODE` or `/register?session=CODE`
- Code is validated against `CenterSession` table (6-char, 24h validity)
- Activation center stored as `activationCenterId` on `User` (immutable)
- `firstActivatedAt` timestamp recorded
- Registration fails without a valid code

## 2. Free Registration
Fields required: full name, email, contact number, nickname, consent
Fields removed: password (uses email link), date of birth (optional), competition center (chosen later)
After registration: user receives permanent personal access link by email

## 3. Permanent Personal Access Link
- Generated at registration: random 32-byte token (base64url)
- Only SHA-256 hash stored in database (never raw token in DB)
- Raw token sent once in email as URL: `/auth/access?token=...`
- Link has no expiration — valid until manually revoked
- Opens `/auth/access` which creates a normal session
- Player can use this link anytime with internet connection
- Rotation: `/api/auth/login` or `/api/auth/request-link` generates a new token, invalidating the previous one
- Token revocation: set `accessTokenRevokedAt` (future admin feature)

## 4. Competition Center Selection
- After first login, player chooses which GARRINCHA Center to represent
- Any available center may be chosen (not limited to activation center)
- `activationCenterId` ≠ `competitionCenterId` (conceptual split)
- Competition center required before first prediction
- Competition center locked after first prediction (`competitionCenterLockedAt`)
- Admin may override (future feature, not yet implemented)

Key fields:
- `activationCenterId`: center where player first scanned QR (immutable)
- `competitionCenterId`: center player represents for leaderboards/prizes (nullable until chosen, locked after first prediction)

## 5. Prediction Eligibility
Requirements before predicting:
- Authenticated user (session or access link)
- `competitionCenterId` must be set
- No repeated check-in required after first activation

Prediction lock: 5 minutes after kickoff
- Allowed: before kickoff, at kickoff, during first 5 minutes
- Locked: at exactly kickoff + 5 minutes, and after
- Server-side enforcement is authoritative

## 6. Scoring
- Exact score: 5 points
- Correct outcome + correct goal difference: 3 points
- Correct outcome only: 2 points
- Wrong outcome: 0 points
- Points are recalculated idempotently (overwrite, never duplicate)

## 7. Football API Automation (Future)
- Architecture in `src/lib/match-data-workflow.ts`
- Admin confirmation required before recalculating points from API data
- Admin remains responsible for: emergency correction, score override, bonus points
- Score override stored as `scoreSource: "manual"`

## 8. Leaderboards
- Global: all players with `competitionCenterId` set, sorted by total points
- Center: filtered by `competitionCenterId` (not `activationCenterId`)
- National: filtered by nationality
- Prize winners: top 10 per `competitionCenterId` (owner dashboard)
- Display name: `nickname` → `fullName` → anonymous fallback (never email)

## 9. Admin Hierarchy

| Role | Who | Access |
|------|-----|--------|
| `SUPER_ADMIN` | `wc.garrincha@gmail.com` | Full platform control, health dashboard, all centers |
| `ADMIN` | `admin@garrincha.local` | Full admin access (legacy main admin) |
| `CENTER_ADMIN` | 10 `@garrincha.be` accounts | Assigned center only — QR codes, check-in, local leaderboard |
| `USER` | Players | Predictions, own profile |

Center admin emails (all share `CENTER_ADMIN_PASSWORD` initially):
- `antwerpen.noord@garrincha.be` → GARRINCHA Antwerpen Noord
- `antwerpen.zuid@garrincha.be` → GARRINCHA Antwerpen Zuid
- `charleroi.dampremy@garrincha.be` → GARRINCHA Charleroi Dampremy
- `charleroi.montignies@garrincha.be` → GARRINCHA Charleroi Montignies
- `diegem@garrincha.be` → GARRINCHA Diegem
- `gent.arsenaal@garrincha.be` → GARRINCHA Gent Arsenaal
- `gent.theloop@garrincha.be` → GARRINCHA Gent The Loop
- `kortrijk@garrincha.be` → GARRINCHA Kortrijk
- `luik@garrincha.be` → GARRINCHA Luik
- `westgate.dilbeek@garrincha.be` → GARRINCHA Westgate Dilbeek

**Pending:** Migration `20260604000000_center_admin_role.sql` adds `CENTER_ADMIN` to the Role enum. Must be applied before seeding center admins.

## 10. Infrastructure

- **Email provider**: Resend — `RESEND_API_KEY` configured. Domain `[your-domain.com]` must be verified in Resend before production email sending.
- **Database**: Supabase PostgreSQL — connected, migrations and seed applied.
- **Rate limiting**: Upstash Redis — `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` configured. `checkRateLimit` uses Redis when vars are present, falls back to in-memory otherwise.
- **App hosting**: Vercel at `https://[YOUR-APP-DOMAIN]`.

## 11. Open Client Decisions

- **Link rotation policy**: unclear whether players should be warned before rotation invalidates their saved link; no grace period defined
- **Admin center override**: `competitionCenterId` lock override is listed as a future feature; scope and authorization level not specified
- **Football API choice**: no provider selected; integration architecture exists in `match-data-workflow.ts` but the external API contract is undefined
- **Prediction lock duration**: currently set at 5 minutes post-kickoff; whether this is configurable per match or global is not decided
- **Bonus points permanence**: no decision on whether bonus points survive a score recalculation cycle or must be re-applied manually each time
