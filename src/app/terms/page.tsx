import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <div className="prose-page">
      <h1>Terms &amp; Conditions</h1>

      <p style={{ color: "var(--ink-faint)", fontSize: 13, marginBottom: 32 }}>GARRINCHA® · Kempes BV · World Cup Pronostiek 2026 · Belgian law</p>

      <h2>1. Organiser</h2>
      <p><strong>Kempes BV</strong> (trading as GARRINCHA®)<br />
      Kortrijksesteenweg 1166, 9051 Gent, Belgium · VAT: BE0635670989</p>

      <h2>2. Campaign</h2>
      <p>The GARRINCHA World Cup Pronostiek is a free-to-play prediction game running alongside the FIFA World Cup 2026 (June 11 – July 19, 2026). No purchase, payment, or registration fee is required.</p>

      <h2>3. Registration</h2>
      <ul>
        <li>Participants must register via the official platform with valid personal details.</li>
        <li>One account per person. Multiple accounts lead to disqualification.</li>
        <li>Participants must be 16 years or older.</li>
        <li>By registering you accept these terms and our <Link href="/privacy" style={{ color: "var(--green)" }}>Privacy Policy</Link>.</li>
      </ul>

      <h2>4. How to Play</h2>
      <ul>
        <li>Submit your predicted final score for each match before kickoff.</li>
        <li>Predictions lock 5 minutes after kickoff. They cannot be changed after that.</li>
        <li>Points are awarded automatically after GARRINCHA staff enter the official final score.</li>
      </ul>

      <h2>5. Scoring</h2>
      <ul>
        <li><strong>5 points</strong> — Exact score predicted correctly</li>
        <li><strong>3 points</strong> — Correct result + correct goal difference</li>
        <li><strong>2 points</strong> — Correct result only (win/draw/loss)</li>
        <li><strong>0 points</strong> — Wrong result</li>
        <li>Bonus points may be awarded by GARRINCHA admins for special campaign moments.</li>
      </ul>

      <h2>6. Prizes</h2>
      <ul>
        <li>Final rankings are calculated after the tournament final (July 19, 2026).</li>
        <li>Prize details are communicated at campaign launch and via GARRINCHA channels.</li>
        <li>GARRINCHA reserves the right to disqualify participants for rule violations.</li>
        <li>Prize decisions by GARRINCHA are final.</li>
      </ul>

      <h2>7. Data</h2>
      <p>See our <Link href="/privacy" style={{ color: "var(--green)" }}>Privacy Policy</Link> for data handling details.</p>

      <h2>8. Liability</h2>
      <p>GARRINCHA is not liable for technical disruptions beyond its control. No cash alternative is offered for prizes.</p>

      <h2>9. Governing Law</h2>
      <p>These terms are governed by Belgian law. Disputes fall under the courts of the Gent region.</p>

      <div style={{ marginTop: 40 }}>
        <Link className="cta cta-ghost cta-md" href="/" style={{ width: "auto", display: "inline-flex" }}>← Back to home</Link>
      </div>
    </div>
  );
}
