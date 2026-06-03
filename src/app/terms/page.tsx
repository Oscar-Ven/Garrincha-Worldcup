import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <main className="page legal-page">
      <section className="page-header">
        <span className="eyebrow">GARRINCHA® · Kempes BV</span>
        <h1>Terms &amp; Conditions</h1>
        <p>World Cup Pronostiek 2026 · Belgian law applies</p>
      </section>

      <div className="legal-body card">
        <h2>1. Organiser</h2>
        <p>
          <strong>Kempes BV</strong> (trading as GARRINCHA®)<br />
          Kortrijksesteenweg 1166, 9051 Gent, Belgium<br />
          VAT: BE0635670989
        </p>

        <h2>2. Campaign</h2>
        <p>
          The GARRINCHA World Cup Pronostiek is a free-to-play prediction game running alongside the FIFA World Cup 2026
          (June 11 – July 19, 2026). Participation is open to registered members of GARRINCHA Centers. No purchase,
          payment, or registration fee is required to participate.
        </p>

        <h2>3. Registration</h2>
        <ul>
          <li>Participants must register via the official platform using valid personal details.</li>
          <li>Registration is free. No payment details are collected for participation.</li>
          <li>One account per person. Multiple accounts lead to disqualification.</li>
          <li>Participants must be 16 years or older.</li>
          <li>By registering you accept these terms and our <Link href="/privacy">Privacy Policy</Link>.</li>
        </ul>

        <h2>4. How to Play</h2>
        <ul>
          <li>Submit your predicted final score for each match before kickoff.</li>
          <li>Predictions cannot be changed once the match has kicked off.</li>
          <li>Points are awarded automatically after GARRINCHA staff enter the official final score.</li>
        </ul>

        <h2>5. Scoring</h2>
        <ul>
          <li><strong>5 points</strong> — Exact score predicted correctly</li>
          <li><strong>3 points</strong> — Correct result and correct goal difference</li>
          <li><strong>2 points</strong> — Correct result only (win/draw/loss)</li>
          <li><strong>0 points</strong> — Wrong result</li>
          <li>Bonus points may be awarded by GARRINCHA admins for special campaign moments.</li>
        </ul>

        <h2>6. Leaderboard and Prizes</h2>
        <ul>
          <li>Final rankings are calculated after the tournament final (July 19, 2026).</li>
          <li>Prize details are communicated at campaign launch and via GARRINCHA channels.</li>
          <li>GARRINCHA reserves the right to disqualify participants for rule violations.</li>
          <li>Prize decisions by GARRINCHA are final.</li>
        </ul>

        <h2>7. Data</h2>
        <p>See our <Link href="/privacy">Privacy Policy</Link> for data handling details.</p>

        <h2>8. Liability</h2>
        <p>
          GARRINCHA is not liable for technical disruptions beyond its control. Participation is at the
          participant&apos;s own risk. No cash alternative is offered for prizes.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          These terms are governed by Belgian law. Disputes fall under the courts of the Gent region.
        </p>

        <h2>10. Changes</h2>
        <p>GARRINCHA reserves the right to modify these terms. Registered participants will be notified of material changes.</p>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link className="button" href="/">← Back to home</Link>
      </div>
    </main>
  );
}
