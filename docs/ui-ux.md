# UI/UX Direction

Supabase live testing is postponed for this phase. This document describes the current interface structure and the visual direction for the GARRINCHA World Cup Prediction App.

## Page Structure

- Public landing page: campaign hero, primary calls to action, banner slot, feature cards, and current leaders.
- Registration page: player profile form with email, password, date of birth, phone number, nationality, display name, and GARRINCHA Center.
- User login page: player access into predictions and leaderboards.
- Admin login page: clearly marked admin-only access.
- User dashboard: player stats, rank summary, match cards, prediction inputs, lock state, final scores, and points earned.
- Leaderboards page: global ranking plus national and GARRINCHA Center groupings.
- Admin overview: campaign metrics and links to score entry, bonus points, and leaderboards.
- Admin score entry: final score forms with recalculation warning.
- Admin bonus page: manual bonus form with reason and recent award history.
- Demo video route: `/demo-video` is a preview-only recording page that summarizes the campaign journey without requiring Supabase.

## Design Direction

The visual system uses a football tournament campaign feel:

- Deep green/navy base for authority and matchday atmosphere.
- Gold accents for calls to action, ranking, and winner signals.
- White cards for forms, match content, and leaderboard surfaces.
- Strong typography scale on campaign pages.
- Large mobile tap targets for buttons and score inputs.
- Rounded cards kept restrained at 8px.
- Prediction cards follow a simple pronostiek-style structure: team, centered kickoff, team, then score inputs and one obvious action.
- Landing sections include placeholders for QR campaign entry, prize information, center-specific copy, and official banner artwork.
- Flags use an accessible emoji-based helper for now, with a neutral fallback for missing or unknown teams.

## User Journey

1. User lands on the campaign page and sees the game concept.
2. User registers with required profile and center information.
3. User opens the dashboard to predict match scores.
4. User edits predictions until kickoff.
5. Locked and completed matches clearly show status and earned points.
6. User checks global, national, and center leaderboard placement.

## Admin Journey

1. Admin logs in through the admin-only page.
2. Admin reviews overview metrics.
3. Admin enters final scores after matches.
4. Saving a final score recalculates prediction points.
5. Admin awards manual bonus points with a reason.
6. Admin reviews leaderboards to confirm ranking impact.

## Accessibility Notes

- Forms use visible labels.
- Inputs and buttons have larger touch targets.
- Focus states are visible.
- Status badges use text as well as color.
- Empty states clarify missing data.
- Mobile leaderboards switch from wide tables to stacked cards.

## Assets Still Needed From GARRINCHA

- Official GARRINCHA logo in web-ready formats.
- Official World Cup campaign banner artwork.
- Center-specific banner images.
- Approved color palette and typography, if different from this draft.
- Real team flag assets or approved provider strategy.
- Prize, sponsor, and rules copy for the public campaign page.

## Remaining Visual Improvements

- Browser review on real mobile sizes.
- Replace placeholder banner artwork with official campaign assets.
- Add match filtering or tabs if the full 104-match list feels too long.
- Add player-facing copy for official scoring terms and prizes.
- Confirm color contrast with official brand colors.
- Replace the placeholder QR visual with a real QR code target after the final public URL is known.
- Decide whether to keep emoji flags or replace them with official image assets before launch.
- Replace demo video placeholders with approved logo, banner, prize, and QR assets before exporting the client-facing final cut.
