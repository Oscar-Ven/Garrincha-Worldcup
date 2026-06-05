import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Cookie Policy — GARRINCHA World Cup Pronostiek" };

export default function CookiesPage() {
  return (
    <div className="prose-page">
      <p style={{ color: "var(--ink-faint)", fontSize: 13, marginBottom: 8 }}>GARRINCHA® · Kempes BV</p>
      <h1>Cookie Policy</h1>

      <p>
        This Cookie Policy explains how <strong>www.worldcup-garrincha.com</strong> (owned by Garrincha, operated
        by Kempes BV) uses cookies and similar technologies.
      </p>

      <h2>What Are Cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help websites function
        correctly and remember your preferences.
      </p>

      <h2>Cookies We Use</h2>
      <p>
        This platform uses <strong>only essential cookies</strong> necessary for the service to function. We do not
        use advertising cookies, tracking pixels, or third-party analytics cookies.
      </p>

      <h3 style={{ fontFamily: "Arial, Helvetica, sans-serif", fontStyle: "normal", fontSize: 17, marginBottom: 8, color: "var(--ink)" }}>
        Session Cookie
      </h3>
      <p>
        <code style={{ background: "var(--surface-2)", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>
          garrincha_session
        </code>
        {" "}— A single HTTP-only session cookie that keeps you logged in to the prediction platform.
        This cookie is essential for authentication and expires when you log out or after 30 days.
      </p>

      <h3 style={{ fontFamily: "Arial, Helvetica, sans-serif", fontStyle: "normal", fontSize: 17, marginBottom: 8, marginTop: 20, color: "var(--ink)" }}>
        Language Preference Cookie
      </h3>
      <p>
        <code style={{ background: "var(--surface-2)", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>
          garrincha_locale
        </code>
        {" "}— Stores your language preference (EN, NL, FR). Expires after 1 year.
      </p>

      <h2>What We Do NOT Use</h2>
      <ul>
        <li>Google Analytics or any other analytics cookies</li>
        <li>Facebook Pixel or advertising cookies</li>
        <li>Social media tracking cookies</li>
        <li>Cross-site tracking cookies</li>
      </ul>

      <h2>Your Choices</h2>
      <p>
        Because we only use essential cookies required for the service to function, you cannot opt out of these
        cookies without affecting the usability of the platform.
      </p>
      <p>
        You can delete cookies at any time via your browser settings. This will log you out of the platform.
      </p>

      <h2>Updates to This Policy</h2>
      <p>
        We may update this Cookie Policy to reflect changes in technology or law. The date of the last update will
        be noted at the top of the page when changes are made.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about our cookie use, contact us via{" "}
        <a href="https://www.garrincha.be" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>
          www.garrincha.be
        </a>.
      </p>

      <div style={{ marginTop: 40 }}>
        <Link className="cta cta-ghost cta-md" href="/" style={{ width: "auto", display: "inline-flex" }}>
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
