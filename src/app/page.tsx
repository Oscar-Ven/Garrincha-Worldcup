import Link from "next/link";
import Image from "next/image";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { LandingClient } from "@/components/LandingClient";

// ── All 10 GARRINCHA centers ──────────────────────────────────────────────────
const CENTERS_DATA = [
  { short: "AN",  name: "Antwerpen Noord",      city: "Antwerpen",  color: "#5FE090" },
  { short: "AZ",  name: "Antwerpen Zuid",       city: "Antwerpen",  color: "#F5C242" },
  { short: "CD",  name: "Charleroi Dampremy",   city: "Charleroi",  color: "#FF8C66" },
  { short: "CM",  name: "Charleroi Montignies", city: "Charleroi",  color: "#FF5A4D" },
  { short: "DG",  name: "Diegem",               city: "Diegem",     color: "#6FB3FF" },
  { short: "GA",  name: "Gent Arsenaal",        city: "Gent",       color: "#C792EA" },
  { short: "GT",  name: "Gent The Loop",        city: "Gent",       color: "#4ED9C0" },
  { short: "KT",  name: "Kortrijk",             city: "Kortrijk",   color: "#FFD060" },
  { short: "LK",  name: "Luik",                 city: "Luik",       color: "#FF9F1C" },
  { short: "WD",  name: "Westgate Dilbeek",     city: "Dilbeek",    color: "#78D97C" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function CenterCard({ short, name, city, color }: { short: string; name: string; city: string; color: string }) {
  return (
    <div className="center-card">
      <div className="center-badge">
        <svg viewBox="0 0 40 44" width="52" height="58" aria-hidden="true">
          <path
            d="M20 1 L38 7 V22 C38 33 30 40 20 43 C10 40 2 33 2 22 V7 Z"
            fill={color}
            fillOpacity="0.15"
            stroke={color}
            strokeWidth="1.6"
          />
        </svg>
        <span className="center-badge-text" style={{ color }}>{short}</span>
      </div>
      <div className="center-name">{name}</div>
      <div className="center-city">{city}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const locale = await getLocale();

  return (
    <>
      {/* LandingClient: scroll glass nav + IntersectionObserver reveals */}
      <LandingClient locale={locale} />

      <main className="home-root">

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="hero" id="top">
          <div className="hero-inner">

            {/* Left: copy */}
            <div className="hero-content rv">
              <h1 className="hero-heading">
                Predict the<br />
                <span className="hero-heading-accent">World Cup.</span><br />
                Represent your<br />
                <span className="hero-heading-accent">GARRINCHA Center.</span>
              </h1>

              <p className="hero-lead">
                {t(locale, "hero_lead")}
              </p>

              <div className="hero-cta">
                <Link href="/register" className="cta-btn cta-btn-primary">
                  {t(locale, "cta_register")}
                </Link>
                <Link href="/matches" className="cta-btn cta-btn-outline">
                  View matches
                </Link>
              </div>

              <div className="hero-pills">
                <span className="hero-pill">Free to play</span>
                <span className="hero-pill">No payment required</span>
                <span className="hero-pill">Access by personal email link</span>
              </div>
            </div>

            {/* Right: trophy */}
            <div className="hero-visual rv">
              <Image
                src="/images/world-cup-trophy.png"
                alt="FIFA World Cup Trophy"
                width={420}
                height={520}
                className="hero-trophy"
                priority
              />
            </div>

          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
        <section className="section how-section" id="how">
          <div className="section-inner">
            <div className="section-header rv">
              <span className="section-kicker">{t(locale, "how_title_label")}</span>
              <h2 className="section-title">{t(locale, "how_title")}</h2>
            </div>

            <div className="how-steps">
              {[
                { num: 1, title: t(locale, "s1t"), desc: t(locale, "s1d") },
                { num: 2, title: t(locale, "s2t"), desc: t(locale, "s2d") },
                { num: 3, title: t(locale, "s5t"), desc: t(locale, "s5d") },
              ].map((step) => (
                <div key={step.num} className="how-step rv">
                  <div className="how-step-num">{step.num}</div>
                  <h3 className="how-step-title">{step.title}</h3>
                  <p className="how-step-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SIMPLE SCORING ────────────────────────────────────────── */}
        <section className="section scoring-section" id="scoring">
          <div className="section-inner">
            <div className="section-header rv">
              <span className="section-kicker">{t(locale, "nav_scoring")}</span>
              <h2 className="section-title">{t(locale, "sc_title")}</h2>
              <p className="section-lead">{t(locale, "sc_lead")}</p>
            </div>

            <div className="scoring-grid">
              <div className="scoring-card scoring-card-gold rv">
                <div className="scoring-pts">5<span className="scoring-pts-label">pts</span></div>
                <div className="scoring-name">{t(locale, "sc1t")}</div>
                <div className="scoring-desc">{t(locale, "sc1d")}</div>
              </div>
              <div className="scoring-card rv">
                <div className="scoring-pts scoring-pts-green">3<span className="scoring-pts-label">pts</span></div>
                <div className="scoring-name">{t(locale, "sc2t")}</div>
                <div className="scoring-desc">{t(locale, "sc2d")}</div>
              </div>
              <div className="scoring-card rv">
                <div className="scoring-pts scoring-pts-green">2<span className="scoring-pts-label">pts</span></div>
                <div className="scoring-name">{t(locale, "sc3t")}</div>
                <div className="scoring-desc">{t(locale, "sc3d")}</div>
              </div>
              <div className="scoring-card scoring-card-muted rv">
                <div className="scoring-pts scoring-pts-muted">0<span className="scoring-pts-label">pts</span></div>
                <div className="scoring-name">{t(locale, "sc4t")}</div>
                <div className="scoring-desc">{t(locale, "sc4d")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CENTERS ───────────────────────────────────────────────── */}
        <section className="section centers-section" id="centers">
          <div className="section-inner">
            <div className="section-header rv">
              <span className="section-kicker">{t(locale, "nav_centers")}</span>
              <h2 className="section-title">{t(locale, "ce_title")}</h2>
              <p className="section-lead">{t(locale, "ce_lead")}</p>
            </div>

            <div className="centers-grid">
              {CENTERS_DATA.map((c) => (
                <div key={c.short} className="rv">
                  <CenterCard {...c} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── READY FOR KICKOFF ─────────────────────────────────────── */}
        <section className="kickoff-section" id="register">
          <div className="kickoff-inner rv">
            <span className="section-kicker kickoff-kicker">{t(locale, "fn_kicker")}</span>
            <h2 className="kickoff-title">{t(locale, "fn_title")}</h2>
            <p className="kickoff-lead">{t(locale, "fn_lead")}</p>
            <div className="kickoff-cta">
              <Link href="/register" className="cta-btn cta-btn-primary cta-btn-lg">
                {t(locale, "cta_register")}
              </Link>
              <Link href="/login" className="cta-btn cta-btn-ghost">
                {t(locale, "cta_link")}
              </Link>
            </div>
            <p className="kickoff-note">{t(locale, "fn_note")}</p>
          </div>
        </section>

      </main>

      <style>{`
        /* ── Page root ──────────────────────────────────────────────── */
        .home-root {
          background: #ffffff;
          overflow-x: hidden;
        }

        /* ── Scroll-reveal base ─────────────────────────────────────── */
        .rv {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .rv.in {
          opacity: 1;
          transform: none;
        }

        /* ── CTA buttons ────────────────────────────────────────────── */
        .cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s, box-shadow 0.15s, transform 0.1s;
          text-decoration: none;
          cursor: pointer;
          border: none;
        }
        .cta-btn:active { transform: scale(0.97); }

        .cta-btn-primary {
          background: #1B4332;
          color: #ffffff;
        }
        .cta-btn-primary:hover { background: #14532D; box-shadow: 0 4px 14px rgba(27,67,50,0.25); }

        .cta-btn-outline {
          background: transparent;
          color: #1B4332;
          border: 2px solid #1B4332;
        }
        .cta-btn-outline:hover { background: #F0FDF4; }

        .cta-btn-ghost {
          background: transparent;
          color: rgba(255,255,255,0.85);
          border: 1.5px solid rgba(255,255,255,0.4);
        }
        .cta-btn-ghost:hover { background: rgba(255,255,255,0.12); }

        .cta-btn-lg {
          padding: 0.9rem 2rem;
          font-size: 1.05rem;
        }

        /* ── HERO ───────────────────────────────────────────────────── */
        .hero {
          background: #ffffff;
          padding-top: 5rem;
          padding-bottom: 5rem;
        }

        .hero-inner {
          max-width: 1200px;
          margin-inline: auto;
          padding-inline: 1.5rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 4rem;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .hero-heading {
          font-family: 'Saira Condensed', 'Roboto Condensed', sans-serif;
          font-style: italic;
          font-weight: 900;
          font-size: clamp(2.5rem, 5vw, 4rem);
          line-height: 1.05;
          color: #111827;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .hero-heading-accent {
          color: #1B4332;
        }

        .hero-lead {
          font-size: 1.1rem;
          color: #374151;
          line-height: 1.65;
          max-width: 480px;
          margin: 0;
        }

        .hero-cta {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          flex-wrap: wrap;
        }

        .hero-pills {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.75rem;
          background: #F0FDF4;
          color: #15803D;
          border: 1px solid #DCFCE7;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .hero-visual {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-trophy {
          width: 100%;
          max-width: 380px;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.12));
        }

        /* ── Shared section layout ─────────────────────────────────── */
        .section {
          padding-block: 5rem;
        }

        .section-inner {
          max-width: 1200px;
          margin-inline: auto;
          padding-inline: 1.5rem;
        }

        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .section-kicker {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #16A34A;
          margin-bottom: 0.5rem;
        }

        .section-title {
          font-family: 'Saira Condensed', 'Roboto Condensed', sans-serif;
          font-style: italic;
          font-weight: 900;
          font-size: clamp(1.75rem, 3.5vw, 2.75rem);
          color: #1B4332;
          line-height: 1.1;
          margin: 0 0 0.75rem;
        }

        .section-lead {
          font-size: 1rem;
          color: #6B7280;
          max-width: 560px;
          margin-inline: auto;
          line-height: 1.6;
        }

        /* ── HOW IT WORKS ─────────────────────────────────────────── */
        .how-section {
          background: #F9FAFB;
        }

        .how-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .how-step {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }

        .how-step-num {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #1B4332;
          color: #ffffff;
          font-family: 'Saira Condensed', sans-serif;
          font-style: italic;
          font-weight: 900;
          font-size: 1.4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .how-step-title {
          font-family: 'Saira Condensed', 'Roboto Condensed', sans-serif;
          font-style: italic;
          font-weight: 800;
          font-size: 1.2rem;
          color: #1B4332;
          margin: 0;
        }

        .how-step-desc {
          font-size: 0.9rem;
          color: #6B7280;
          line-height: 1.6;
          margin: 0;
        }

        /* ── SCORING ──────────────────────────────────────────────── */
        .scoring-section {
          background: #ffffff;
        }

        .scoring-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }

        .scoring-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 1.75rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          transition: box-shadow 0.15s, transform 0.15s;
        }

        .scoring-card:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.09);
          transform: translateY(-2px);
        }

        .scoring-card-gold {
          border-color: #FDE68A;
          background: #FFFBEB;
        }

        .scoring-card-muted {
          border-color: #F3F4F6;
          background: #F9FAFB;
        }

        .scoring-pts {
          font-family: 'Saira Condensed', sans-serif;
          font-style: italic;
          font-weight: 900;
          font-size: 2.75rem;
          color: #D97706;
          line-height: 1;
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .scoring-pts-green { color: #16A34A; }
        .scoring-pts-muted { color: #9CA3AF; }

        .scoring-pts-label {
          font-size: 1rem;
          font-weight: 700;
          font-style: italic;
        }

        .scoring-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: #111827;
          line-height: 1.3;
        }

        .scoring-desc {
          font-size: 0.82rem;
          color: #6B7280;
          line-height: 1.5;
        }

        /* ── CENTERS ──────────────────────────────────────────────── */
        .centers-section {
          background: #F9FAFB;
        }

        .centers-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
        }

        .center-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          text-align: center;
          transition: box-shadow 0.15s, transform 0.15s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .center-card:hover {
          box-shadow: 0 6px 18px rgba(0,0,0,0.09);
          transform: translateY(-2px);
        }

        .center-badge {
          position: relative;
          width: 52px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .center-badge svg {
          position: absolute;
          inset: 0;
        }

        .center-badge-text {
          position: relative;
          font-family: 'Saira Condensed', sans-serif;
          font-style: italic;
          font-weight: 900;
          font-size: 0.85rem;
          letter-spacing: 0.02em;
          z-index: 1;
          line-height: 1;
        }

        .center-name {
          font-weight: 700;
          font-size: 0.82rem;
          color: #111827;
          line-height: 1.3;
        }

        .center-city {
          font-size: 0.74rem;
          color: #9CA3AF;
          font-weight: 500;
        }

        /* ── KICKOFF CTA ──────────────────────────────────────────── */
        .kickoff-section {
          background: #1B4332;
          padding-block: 5rem;
          position: relative;
          overflow: hidden;
        }

        .kickoff-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url('/images/world-cup-trophy.png');
          background-repeat: no-repeat;
          background-position: right -80px center;
          background-size: 340px;
          opacity: 0.06;
          pointer-events: none;
        }

        .kickoff-inner {
          max-width: 700px;
          margin-inline: auto;
          padding-inline: 1.5rem;
          text-align: center;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .kickoff-kicker {
          color: #4ADE80;
        }

        .kickoff-title {
          font-family: 'Saira Condensed', 'Roboto Condensed', sans-serif;
          font-style: italic;
          font-weight: 900;
          font-size: clamp(2rem, 4vw, 3rem);
          color: #ffffff;
          line-height: 1.1;
          margin: 0;
        }

        .kickoff-lead {
          font-size: 1rem;
          color: rgba(255,255,255,0.75);
          line-height: 1.65;
          max-width: 520px;
          margin: 0;
        }

        .kickoff-cta {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .kickoff-cta .cta-btn-primary {
          background: #ffffff;
          color: #1B4332;
        }
        .kickoff-cta .cta-btn-primary:hover {
          background: #F0FDF4;
          box-shadow: 0 4px 14px rgba(0,0,0,0.2);
        }

        .kickoff-note {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.5);
          margin: 0;
        }

        /* ── RESPONSIVE ───────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .scoring-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .centers-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 768px) {
          .hero {
            padding-top: 3.5rem;
            padding-bottom: 3.5rem;
          }

          .hero-inner {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }

          .hero-visual {
            order: -1;
          }

          .hero-trophy {
            max-width: 220px;
          }

          .hero-heading {
            font-size: clamp(2.2rem, 8vw, 3rem);
          }

          .hero-lead {
            font-size: 1rem;
          }

          .how-steps {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .scoring-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .centers-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .section {
            padding-block: 3.5rem;
          }
        }

        @media (max-width: 480px) {
          .hero-cta {
            flex-direction: column;
            align-items: flex-start;
          }

          .hero-cta .cta-btn {
            width: 100%;
            justify-content: center;
          }

          .scoring-grid {
            grid-template-columns: 1fr 1fr;
          }

          .centers-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .kickoff-cta {
            flex-direction: column;
            width: 100%;
          }

          .kickoff-cta .cta-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
