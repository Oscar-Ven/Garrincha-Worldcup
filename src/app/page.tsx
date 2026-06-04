import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { LandingClient } from "@/components/LandingClient";
import { PublicFooter } from "@/components/PublicFooter";

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
    <div className="lp-center-card">
      <div className="lp-center-badge">
        <svg viewBox="0 0 40 44" width="56" height="62">
          <path d="M20 1 L38 7 V22 C38 33 30 40 20 43 C10 40 2 33 2 22 V7 Z"
            fill={color} fillOpacity="0.16" stroke={color} strokeWidth="1.6" />
        </svg>
        <span style={{ color }}>{short}</span>
      </div>
      <div className="lp-center-name">{name}</div>
      <div className="lp-center-city">{city}</div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const locale = await getLocale();
  const centerCount = CENTERS_DATA.length;

  return (
    <div className="landing-root">

      {/* ── NAV ─────────────────────────────────────────────────── */}
      {/* LandingClient handles scroll + burger interactivity */}
      <LandingClient locale={locale} />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="lp-hero" id="top">
        <div className="lp-wrap lp-hero-grid">

          {/* Left: copy */}
          <div>
            <span className="lp-hero-eyebrow">{t(locale, "tagline")}</span>

            <h1 className="lp-h1">
              <span>{t(locale, "hero_l1")}</span><br />
              <span>{t(locale, "hero_l2")}</span><br />
              <span className="g">{t(locale, "hero_l3")}</span><br />
              <span className="g">{t(locale, "hero_l4")}</span>
            </h1>

            <p className="lp-lead">{t(locale, "hero_lead")}</p>

            <div className="lp-hero-ctas">
              <Link href="/register" className="cta cta-green cta-lg">
                {t(locale, "cta_register")}
              </Link>
              <a href="#how" className="cta cta-ghost cta-lg">
                {t(locale, "cta_how")}
              </a>
            </div>

            <div className="lp-hero-stats">
              <div className="lp-stat">
                <div className="lp-stat-n">{centerCount}</div>
                <div className="lp-stat-l">{t(locale, "stat_centers")}</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-n">€0</div>
                <div className="lp-stat-l">{t(locale, "stat_free")}</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-n" style={{ color: "var(--green)" }}>∞</div>
                <div className="lp-stat-l">{t(locale, "stat_access")}</div>
              </div>
            </div>
          </div>

          {/* Right: phone mockup */}
          <div className="lp-phone-wrap">
            <div className="lp-phone-glow" />
            <div className="lp-phone">
              <div className="lp-island" />
              <div className="lp-phone-screen">
                <div className="lp-ps-pad">
                  <div className="lp-ps-top">
                    <Image src="/garrincha-white.png" alt="GARRINCHA" height={15} width={90} style={{ height: 15, width: "auto" }} />
                    <span className="lp-mini-chip">2 open</span>
                  </div>
                  {/* Prediction card preview */}
                  <div className="lp-pcard">
                    <div className="lp-pcard-top">
                      <span className="lp-pcard-stage">Group A · MD1</span>
                      <span className="lp-mini-chip">Open</span>
                    </div>
                    {/* Teams */}
                    <div className="lp-row" style={{ marginBottom: 14 }}>
                      <div className="lp-team">
                        <div className="lp-flag" style={{ background: "linear-gradient(90deg,#2B2B2B 0 33.3%,#FFD90F 33.3% 66.6%,#F31830 66.6%)" }} />
                        <span className="lp-team-ab">BEL</span>
                      </div>
                      <span className="lp-colon">vs</span>
                      <div className="lp-team">
                        <div className="lp-flag" style={{ background: "linear-gradient(90deg,#0055A4 0 33.3%,#fff 33.3% 66.6%,#EF4135 66.6%)" }} />
                        <span className="lp-team-ab">FRA</span>
                      </div>
                    </div>
                    {/* Score boxes */}
                    <div className="lp-row" style={{ justifyContent: "center", gap: 16, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                      <div className="lp-sbox">2</div>
                      <span className="lp-colon">:</span>
                      <div className="lp-sbox">1</div>
                    </div>
                    <div className="lp-pcard-meta">18:00 · Tue 09 Jun</div>
                    <div className="lp-pcard-save">Save prediction</div>
                  </div>
                  <div className="lp-lock-note">⏱ Locks 5 min after kickoff</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="lp-how" id="how">
        <div className="lp-wrap">
          <div className="rv">
            <span className="lp-kicker">{t(locale, "how_title_label")}</span>
            <h2 className="lp-h2">{t(locale, "how_title")}</h2>
          </div>
          <div className="lp-steps">
            {[
              { t: t(locale, "s1t"), d: t(locale, "s1d") },
              { t: t(locale, "s2t"), d: t(locale, "s2d") },
              { t: t(locale, "s3t"), d: t(locale, "s3d") },
              { t: t(locale, "s4t"), d: t(locale, "s4d") },
              { t: t(locale, "s5t"), d: t(locale, "s5d") },
            ].map((step, i) => (
              <div key={i} className="lp-step rv">
                <div className="lp-step-num">{i + 1}</div>
                <h3>{step.t}</h3>
                <p>{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCORING ──────────────────────────────────────────────── */}
      <section className="lp-scoring" id="scoring">
        <div className="lp-wrap">
          <div className="rv">
            <span className="lp-kicker">{t(locale, "nav_scoring")}</span>
            <h2 className="lp-h2">{t(locale, "sc_title")}</h2>
            <p className="lp-sec-lead">{t(locale, "sc_lead")}</p>
          </div>
          <div className="lp-score-grid">
            {[
              { pts: 5, color: "var(--gold)",      nm: t(locale, "sc1t"), ds: t(locale, "sc1d") },
              { pts: 3, color: "var(--green)",     nm: t(locale, "sc2t"), ds: t(locale, "sc2d") },
              { pts: 2, color: "var(--green)",     nm: t(locale, "sc3t"), ds: t(locale, "sc3d") },
              { pts: 0, color: "var(--ink-faint)", nm: t(locale, "sc4t"), ds: t(locale, "sc4d") },
            ].map((sc, i) => (
              <div key={i} className="lp-score-card rv">
                <div className="lp-score-pts" style={{ color: sc.color }}>
                  {sc.pts}<small>pts</small>
                </div>
                <div className="lp-score-nm">{sc.nm}</div>
                <div className="lp-score-ds">{sc.ds}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CENTERS ──────────────────────────────────────────────── */}
      <section className="lp-centers" id="centers">
        <div className="lp-wrap">
          <div className="rv">
            <span className="lp-kicker">{t(locale, "nav_centers")}</span>
            <h2 className="lp-h2">{t(locale, "ce_title")}</h2>
            <p className="lp-sec-lead">{t(locale, "ce_lead")}</p>
          </div>
          <div className="lp-center-grid">
            {CENTERS_DATA.map((c) => (
              <div key={c.short} className="rv">
                <CenterCard {...c} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIZE BANNER ─────────────────────────────────────────── */}
      <section className="lp-prize" id="prize">
        <div className="lp-wrap">
          <div className="lp-prize-band rv">
            <div className="lp-prize-glow" />
            <div>
              <div style={{ fontSize: 46, lineHeight: 1 }}>🏆</div>
              <div className="lp-prize-h">{t(locale, "pz_title")}</div>
              <div className="lp-prize-p">{t(locale, "pz_lead")}</div>
            </div>
            <Link href="/register" className="cta cta-gold cta-lg" style={{ flexShrink: 0 }}>
              {t(locale, "cta_register")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="lp-final" id="register">
        <div className="lp-wrap">
          <span className="lp-kicker">{t(locale, "fn_kicker")}</span>
          <h2 className="lp-h2">{t(locale, "fn_title")}</h2>
          <p className="lp-lead" style={{ margin: "18px auto 0" }}>{t(locale, "fn_lead")}</p>
          <div className="lp-final-ctas">
            <Link href="/register" className="cta cta-green cta-lg">{t(locale, "cta_register")}</Link>
            <Link href="/login" className="cta cta-ghost cta-lg">{t(locale, "cta_link")}</Link>
          </div>
          <div className="lp-device-note">
            🔗 <span>{t(locale, "fn_note")}</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER — shared PublicFooter component ─────────────── */}
      <PublicFooter locale={locale} />
    </div>
  );
}
