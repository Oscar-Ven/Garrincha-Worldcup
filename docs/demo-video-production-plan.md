# Demo Video Production Plan

This plan creates a professional demo/explainer video using preview/demo mode — no live database or real credentials required.

## Recommended Tools

- OBS Studio: record the browser and mobile-sized preview windows.
- CapCut: edit, add subtitles, transitions, music, and voiceover.
- Canva: create title cards, QR placeholder graphics, and simple branded overlays.
- Remotion: optional only if the team later wants a code-driven motion video. It is not required for this phase.

## How To Record The App

1. Start the app locally:

   ```powershell
   cd /d D:\WorldCup
   npm run dev
   ```

2. Open the demo route:

   ```text
   http://localhost:3000/demo-video
   ```

3. In OBS, create a browser or window capture source.
4. Set the canvas to 1920x1080.
5. Record a clean scroll through the page in sections:
   - Campaign hero
   - QR/register step
   - Prediction step
   - Locked prediction step
   - Admin score entry step
   - Points and leaderboard step
   - Final call-to-action
6. Record extra close-up takes of:
   - QR placeholder
   - Match score inputs
   - Locked badge
   - Admin recalculation panel
   - Leaderboard rows

## How To Capture Mobile-Sized Views

1. Open Chrome or Edge DevTools.
2. Toggle device toolbar.
3. Use one of these viewport sizes:
   - 390 x 844 for iPhone-style capture
   - 430 x 932 for larger phone capture
   - 768 x 1024 for tablet capture
4. Keep zoom at 100 percent.
5. Record the same `/demo-video` route and optionally the real `/register`, `/dashboard`, and `/leaderboards` preview pages.

## How To Add Voiceover

1. Choose the 45, 60, or 90-second script from `docs/demo-video-script.md`.
2. Record voiceover in a quiet room using a USB microphone or clean headset mic.
3. Export voiceover as WAV or high-quality MP3.
4. In CapCut, align the voiceover first, then cut video to match the narration.
5. Keep music lower than voiceover, roughly -18 dB to -24 dB under speech.

## How To Add Subtitles

1. Use CapCut auto captions as a starting point.
2. Manually review every caption.
3. Keep captions short: one sentence or phrase per screen.
4. Use high-contrast white text with a subtle dark shadow or background.
5. Export a version with burned-in subtitles for social sharing.

## How To Export 1080p Video

Recommended export settings:

- Resolution: 1920 x 1080
- Frame rate: 30 fps
- Format: MP4
- Codec: H.264
- Bitrate: 12-20 Mbps
- Audio: AAC, 320 kbps if available

Optional social exports:

- 1080 x 1920 vertical version for stories and reels.
- 1080 x 1350 portrait feed version.
- 1920 x 1080 full landscape version for presentation.

## Required Assets From GARRINCHA/Client

- Approved GARRINCHA logo files.
- Approved TIFO or campaign partner assets, if applicable.
- Final campaign name and tagline.
- Official campaign colors and type guidance, if different from the current draft.
- Prize list and prize rules.
- Final QR code destination URL.
- Center-specific copy and images.
- Sponsor logos, if applicable.
- Legal or privacy copy required for registration.

## Checklist Before Final Export

- Video uses demo data only.
- No secrets, database URLs, private emails, or real credentials are visible.
- All visible copy is approved or marked as placeholder.
- The QR code either points to the final URL or is clearly a placeholder.
- GARRINCHA/client assets are approved for use.
- Voiceover matches the selected script length.
- Subtitles are proofread.
- Music license is cleared.
- Export reviewed on desktop and mobile.
- Final file name includes version and date, for example `garrincha-world-cup-demo-v1.mp4`.
