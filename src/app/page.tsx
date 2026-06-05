import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";

// ── GARRINCHA Centers ─────────────────────────────────────────────────────────
const CENTERS = [
  { short: "AN", name: "Antwerpen Noord",      city: "Antwerpen" },
  { short: "AZ", name: "Antwerpen Zuid",       city: "Antwerpen" },
  { short: "CD", name: "Charleroi Dampremy",   city: "Charleroi" },
  { short: "CM", name: "Charleroi Montignies", city: "Charleroi" },
  { short: "DG", name: "Diegem",               city: "Diegem"    },
  { short: "GA", name: "Gent Arsenaal",        city: "Gent"      },
  { short: "GT", name: "Gent The Loop",        city: "Gent"      },
  { short: "KT", name: "Kortrijk",             city: "Kortrijk"  },
  { short: "LK", name: "Luik",                 city: "Luik"      },
  { short: "WD", name: "Westgate Dilbeek",     city: "Dilbeek"   },
];

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/>
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

// ── Steps data ────────────────────────────────────────────────────────────────
const STEPS = [
  {
    icon: <IconUsers />,
    num: "01",
    title: "Register at a GARRINCHA Center",
    text: "Visit any of the 10 GARRINCHA Centers in Belgium, scan the QR code, and create your free account.",
  },
  {
    icon: <IconTarget />,
    num: "02",
    title: "Predict every match score",
    text: "Before each kickoff, enter your predicted score for every World Cup match. Predictions lock 5 min after kick-off.",
  },
  {
    icon: <IconTrophy />,
    num: "03",
    title: "Earn points & win prizes",
    text: "Score 5 pts for an exact result, 3 for goal difference, 2 for the correct outcome. Top your center leaderboard.",
  },
];

// ── Scoring rows ──────────────────────────────────────────────────────────────
const SCORING_ROWS = [
  { star: "gold",   label: "Exact score",           pts: 5  },
  { star: "gold",   label: "Result + goal diff",    pts: 3  },
  { star: "green",  label: "Correct result only",   pts: 2  },
  { star: "none",   label: "Wrong prediction",      pts: 0  },
];

// ── Star SVG ──────────────────────────────────────────────────────────────────
function StarIcon({ variant }: { variant: "gold" | "green" | "none" }) {
  const fill =
    variant === "gold"  ? "#c9a03a" :
    variant === "green" ? "#1d6b3e" : "#d1d9e0";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={fill}
        stroke={fill}
        strokeWidth="1"
      />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const locale = await getLocale();

  return (
    <main className="lp-root">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="lp-hero">
        <div className="container lp-hero-inner">

          {/* Left copy */}
          <div className="lp-hero-copy">
            <div className="lp-hero-eyebrow">
              <IconCheck />
              World Cup 2026 · Free to Play
            </div>

            <h1 className="lp-hero-headline">
              Predict every<br />
              match. <span className="green">Win for</span><br />
              <span className="green">your center.</span>
            </h1>

            <p className="lp-hero-lead">
              Join the official GARRINCHA World Cup prediction challenge. Register free at your center, predict all 104 matches, and compete for prizes on the leaderboard.
            </p>

            <div className="lp-hero-ctas">
              <Link href="/register" className="btn btn-primary btn-lg">
                Register for free
              </Link>
              <Link href="/matches" className="btn btn-secondary btn-lg">
                View matches
              </Link>
            </div>

            <div className="lp-hero-trust">
              <span className="lp-hero-trust-item">
                <IconCheck />
                10 GARRINCHA Centers
              </span>
              <span className="lp-hero-trust-item">
                <IconCheck />
                104 matches
              </span>
              <span className="lp-hero-trust-item">
                <IconCheck />
                €0 to play
              </span>
            </div>
          </div>

          {/* Right — hero banner */}
          <div className="lp-hero-visual">
            <Image
              src="/images/hero-banner.png"
              alt="FIFA World Cup 2026 trophy"
              fill
              style={{ objectFit: "cover", objectPosition: "center bottom" }}
              priority
              sizes="(max-width:900px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
      <section className="lp-section lp-section-alt">
        <div className="container">
          <div className="lp-section-head">
            <div className="section-badge">How it works</div>
            <h2 className="lp-section-title">Three steps to the top</h2>
            <p className="lp-section-lead">
              It takes 2 minutes to join. Then predict every match before kickoff and watch your ranking rise.
            </p>
          </div>

          <div className="lp-steps">
            {STEPS.map((step) => (
              <div key={step.num} className="lp-step">
                <div className="lp-step-icon">{step.icon}</div>
                <div className="lp-step-num-row">
                  <span className="lp-step-num">{step.num}</span>
                  <h3 className="lp-step-title">{step.title}</h3>
                </div>
                <p className="lp-step-text">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SCORING + CENTERS ════════════════════════════════════════════════ */}
      <section className="lp-section">
        <div className="container">
          <div className="lp-split">

            {/* Scoring card */}
            <div className="lp-card">
              <h3 className="lp-card-title">How points are scored</h3>
              {SCORING_ROWS.map((row) => (
                <div key={row.label} className="score-row">
                  <div className="score-row-left">
                    <StarIcon variant={row.star as "gold" | "green" | "none"} />
                    {row.label}
                  </div>
                  <span className={`score-pts${row.pts === 0 ? " zero" : ""}`}>
                    +{row.pts} pts
                  </span>
                </div>
              ))}
            </div>

            {/* Centers card */}
            <div className="lp-card">
              <h3 className="lp-card-title">Participating centers</h3>
              <p className="lp-center-lead">
                10 GARRINCHA Centers across Belgium compete together. Each center has its own leaderboard — represent yours.
              </p>
              <div className="lp-center-tiles">
                {CENTERS.slice(0, 6).map((c) => (
                  <div key={c.short} className="lp-center-tile">
                    <div className="lp-center-tile-img">{c.short}</div>
                    <span className="lp-center-tile-name">{c.city}</span>
                  </div>
                ))}
                <div className="lp-center-tile">
                  <div className="lp-center-more">+{CENTERS.length - 6}</div>
                </div>
              </div>
              <Link href="/leaderboards" className="lp-see-leaderboard">
                See leaderboard <IconArrow />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA SECTION ══════════════════════════════════════════════════════ */}
      <section className="lp-cta-section">
        <div className="lp-cta-inner">

          {/* Left — CTA banner image */}
          <div className="lp-cta-img-col">
            <Image
              src="/images/cta-banner.png"
              alt="Soccer ball in net"
              fill
              style={{ objectFit: "cover", objectPosition: "left center" }}
              sizes="(max-width:768px) 100vw, 38vw"
            />
          </div>

          {/* Right — text + buttons */}
          <div className="lp-cta-text-col">
            <h2 className="lp-cta-title">Ready for kickoff?</h2>
            <p className="lp-cta-lead">
              The tournament starts June 11, 2026. Register now at your nearest GARRINCHA Center and make sure your predictions are in before the first whistle.
            </p>
            <div className="lp-cta-btns">
              <Link href="/register" className="btn btn-primary btn-lg">
                Register for free
              </Link>
              <Link href="/matches" className="btn btn-secondary btn-lg">
                View all matches
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
