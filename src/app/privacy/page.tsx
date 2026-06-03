import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="page legal-page">
      <section className="page-header">
        <span className="eyebrow">GARRINCHA® · Kempes BV</span>
        <h1>Privacy Policy</h1>
        <p>Last updated: June 2026 · Governed by Belgian law and GDPR</p>
      </section>

      <div className="legal-body card">
        <h2>1. Data Controller</h2>
        <p>
          <strong>Kempes BV</strong> (trading as GARRINCHA®)<br />
          Kortrijksesteenweg 1166, 9051 Gent, Belgium<br />
          VAT: BE0635670989<br />
          Web: <a href="https://www.garrincha.be" target="_blank" rel="noopener noreferrer">www.garrincha.be</a>
        </p>

        <h2>2. Data We Collect</h2>
        <p>When you register for the GARRINCHA World Cup Pronostiek we collect:</p>
        <ul>
          <li>Full name or display name</li>
          <li>Email address</li>
          <li>Date of birth</li>
          <li>Phone number</li>
          <li>Nationality (optional)</li>
          <li>Your selected GARRINCHA Center</li>
          <li>Your match predictions and earned points</li>
        </ul>

        <h2>3. Why We Collect It</h2>
        <ul>
          <li>To run the prediction game and calculate your score</li>
          <li>To display leaderboards and competition rankings</li>
          <li>To contact prize winners</li>
          <li>To send campaign updates (with your consent)</li>
        </ul>

        <h2>4. Legal Basis</h2>
        <p>Processing is based on your explicit consent at registration and on our legitimate interest in operating the campaign platform.</p>

        <h2>5. Data Sharing</h2>
        <p>
          We do not sell your data. We may share data with technical service providers (hosting, database) under data processing agreements.
          All providers operate within the European Economic Area.
        </p>

        <h2>6. Your Rights</h2>
        <p>Under GDPR you have the right to access, correct, delete, and port your data, and to object to processing. Requests are handled within 30 days.</p>
        <p>Contact: <a href="https://www.garrincha.be/nl/contact">www.garrincha.be/nl/contact</a></p>

        <h2>7. Retention</h2>
        <p>Campaign data is retained for the duration of the campaign and for a maximum of 12 months after the tournament ends (July 19, 2026).</p>

        <h2>8. Cookies</h2>
        <p>
          This platform uses a single session cookie (<code>garrincha_session</code>) to keep you logged in.
          No analytics or advertising cookies are used. See <a href="https://www.garrincha.be/nl/cookiebeleid" target="_blank" rel="noopener noreferrer">garrincha.be cookie policy</a> for the main website.
        </p>

        <h2>9. Complaints</h2>
        <p>
          You may lodge a complaint with the Belgian Data Protection Authority:<br />
          <a href="https://www.dataprotectionauthority.be" target="_blank" rel="noopener noreferrer">www.dataprotectionauthority.be</a>
        </p>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link className="button" href="/">← Back to home</Link>
      </div>
    </main>
  );
}
