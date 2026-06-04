import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Legal Notice — GARRINCHA World Cup Pronostiek" };

export default function LegalPage() {
  return (
    <div className="prose-page">
      <p style={{ color: "var(--ink-faint)", fontSize: 13, marginBottom: 8 }}>GARRINCHA® · Kempes BV</p>
      <h1>Legal Notice</h1>

      <h2>Website Ownership</h2>
      <p>
        <strong>www.worldcup-garrincha.com is owned by Garrincha.</strong>
      </p>
      <p>
        This website is operated by Kempes BV, trading as GARRINCHA®.
      </p>

      <h2>Company Information</h2>
      <p>
        <strong>Kempes BV</strong> (trading as GARRINCHA®)<br />
        Kortrijksesteenweg 1166, 9051 Gent, Belgium<br />
        VAT: BE0635670989<br />
        Web: <a href="https://www.garrincha.be" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>www.garrincha.be</a>
      </p>

      <h2>Campaign Disclaimer</h2>
      <p>
        The GARRINCHA World Cup Pronostiek 2026 is a <strong>free-to-play prediction game</strong> independently
        operated by Kempes BV for GARRINCHA Centers in Belgium.
      </p>
      <p>
        <strong>This campaign is not affiliated with FIFA, UEFA, or any official World Cup organizer unless explicitly stated.</strong>{" "}
        The FIFA World Cup™ and associated marks are trademarks of FIFA. Use of the term &ldquo;World Cup&rdquo; refers to the
        FIFA World Cup 2026 tournament as a sporting event context only.
      </p>

      <h2>Intellectual Property</h2>
      <p>
        The GARRINCHA® brand, logo, and all campaign content on this website are the property of Kempes BV.
        Unauthorized reproduction, distribution, or use is prohibited.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        Kempes BV makes no warranties about the accuracy or completeness of information on this site.
        We are not liable for any damages arising from the use of this website or participation in the campaign.
      </p>

      <h2>Governing Law</h2>
      <p>
        This legal notice is governed by Belgian law. Disputes fall under the jurisdiction of the courts of the
        Gent region, Belgium.
      </p>

      <h2>Contact</h2>
      <p>
        For legal enquiries, contact us via{" "}
        <a href="https://www.garrincha.be" target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>
          www.garrincha.be
        </a>
        . Legal contact details are provided on the GARRINCHA website.
      </p>

      <div style={{ marginTop: 40 }}>
        <Link className="cta cta-ghost cta-md" href="/" style={{ width: "auto", display: "inline-flex" }}>
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
