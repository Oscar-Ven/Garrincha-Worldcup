import Image from "next/image";
import Link from "next/link";

// ── Centers data ───────────────────────────────────────────────────────────────
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

export default function HomePage() {
  return (
    <>
      <style>{`
        /* ── Page tokens ── */
        .lp { --ink: #111827; --green: #1a3a2a; --green2: #1d6b3e; --gold: #c9a03a;
              --bg: #fff; --bg2: #f8fafb; --border: #e2e8f0;
              --r: 12px; --r-lg: 16px; background: var(--bg); }

        /* ── HERO ── */
        .lp-hero { background: #fff; overflow: hidden }
        .lp-hero-inner { display: grid; grid-template-columns: 1fr 1fr; min-height: 540px; align-items: center; gap: 2rem; padding: 3.5rem 0 0 }
        .lp-eyebrow { display: inline-flex; align-items: center; gap: .5rem; padding: .375rem 1rem; border-radius: 100px; background: #f0faf4; border: 1px solid #c6e8d3; font-size: .8125rem; font-weight: 600; color: #1a3a2a; margin-bottom: 1.5rem }
        .lp-h1 { font-size: clamp(2.25rem, 4.5vw, 3.375rem); font-weight: 900; line-height: 1.05; letter-spacing: -.03em; margin: 0 0 1.125rem; color: var(--ink) }
        .lp-h1 .green { color: var(--green); display: block }
        .lp-lead { font-size: 1.0625rem; color: #6b7280; line-height: 1.65; margin: 0 0 1.875rem; max-width: 460px }
        .lp-ctas { display: flex; gap: .875rem; flex-wrap: wrap; margin-bottom: 1.875rem }
        .btn-fill { display: inline-flex; align-items: center; gap: .5rem; padding: .875rem 1.875rem; background: var(--green); color: #fff; border: 2px solid var(--green); border-radius: var(--r); font-size: 1rem; font-weight: 700; cursor: pointer; transition: background .14s, transform .1s; text-decoration: none }
        .btn-fill:hover { background: var(--green2); border-color: var(--green2); transform: translateY(-1px) }
        .btn-outline { display: inline-flex; align-items: center; gap: .5rem; padding: .875rem 1.75rem; background: transparent; color: var(--ink); border: 2px solid #d1d9e0; border-radius: var(--r); font-size: 1rem; font-weight: 600; cursor: pointer; transition: border-color .14s; text-decoration: none }
        .btn-outline:hover { border-color: var(--green) }
        .lp-trust { display: flex; gap: 1.5rem; flex-wrap: wrap }
        .lp-trust-item { display: flex; align-items: center; gap: .4375rem; font-size: .875rem; color: #6b7280; font-weight: 500 }
        .lp-trust-item svg { color: #1d6b3e; flex-shrink: 0 }
        .lp-hero-img { position: relative; height: 540px; overflow: hidden }
        .lp-hero-img img { width: 100%; height: 100%; object-fit: cover; object-position: center bottom }
        @media(max-width:900px){
          .lp-hero-inner { grid-template-columns: 1fr; padding: 2rem 0 0 }
          .lp-hero-img { height: 260px; border-radius: var(--r-lg); order: -1 }
          .lp-h1 { font-size: 2.125rem }
        }

        /* ── STEPS ── */
        .lp-steps-section { background: #fff; padding: 3.5rem 0 }
        .lp-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.25rem; margin-top: 0 }
        @media(max-width:768px){ .lp-steps { grid-template-columns: 1fr } }
        .step-card { background: #fff; border: 1px solid var(--border); border-radius: var(--r-lg); padding: 1.875rem 1.625rem; box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.03) }
        .step-icon { width: 52px; height: 52px; border-radius: 50%; background: #f0faf4; border: 1.5px solid #c6e8d3; display: flex; align-items: center; justify-content: center; color: #1d6b3e; margin-bottom: 1.25rem }
        .step-num-row { display: flex; align-items: center; gap: .625rem; margin-bottom: .5rem }
        .step-num { font-size: 1.5rem; font-weight: 900; color: var(--green); line-height: 1 }
        .step-title { font-size: 1.125rem; font-weight: 800; color: var(--ink) }
        .step-body { font-size: .9375rem; color: #6b7280; line-height: 1.6; margin: 0 }

        /* ── SPLIT ── */
        .lp-split-section { background: var(--bg2); padding: 3.5rem 0 }
        .lp-split { display: grid; grid-template-columns: 1fr 1fr; gap: 1.375rem }
        @media(max-width:768px){ .lp-split { grid-template-columns: 1fr } }
        .split-card { background: #fff; border: 1px solid var(--border); border-radius: var(--r-lg); padding: 1.875rem; box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.03) }
        .split-title { font-size: 1.1875rem; font-weight: 800; color: var(--ink); margin-bottom: 1.25rem }
        .score-row { display: flex; align-items: center; justify-content: space-between; padding: .75rem 0; border-bottom: 1px solid var(--border); gap: 1rem }
        .score-row:last-child { border-bottom: none }
        .score-left { display: flex; align-items: center; gap: .75rem; font-size: .9375rem; color: #374151; font-weight: 500 }
        .score-pts { font-size: .9375rem; font-weight: 800; color: #1d6b3e; background: #f0faf4; border: 1px solid #c6e8d3; padding: .2rem .7rem; border-radius: 100px }
        .score-pts.zero { color: #9ca3af; background: #f1f4f6; border-color: var(--border) }
        .star { width: 22px; height: 22px; flex-shrink: 0 }
        /* Centers card */
        .split-lead { font-size: .9375rem; color: #6b7280; margin: 0 0 1.375rem; line-height: 1.6 }
        .center-tiles { display: flex; gap: .875rem; flex-wrap: wrap; align-items: center; margin-bottom: 1rem }
        .center-tile { display: flex; flex-direction: column; align-items: center; gap: .3rem }
        .center-avatar { width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 2px solid #c6e8d3; background: #f0faf4 }
        .center-avatar img { width: 100%; height: 100%; object-fit: cover }
        .center-label { font-size: .6875rem; font-weight: 700; color: #374151; text-align: center; max-width: 64px; line-height: 1.2 }
        .more-tile { display: flex; flex-direction: column; align-items: center; gap: .3rem }
        .more-circle { width: 60px; height: 60px; border-radius: 50%; background: #f8fafb; border: 2px dashed #d1d9e0; display: flex; align-items: center; justify-content: center; font-size: .875rem; font-weight: 800; color: #6b7280 }
        .more-label { font-size: .6875rem; color: #6b7280; text-align: center; max-width: 64px }
        .see-lb { display: inline-flex; align-items: center; gap: .375rem; font-size: .9375rem; font-weight: 700; color: #1d6b3e; text-decoration: none; margin-top: .5rem }
        .see-lb:hover { text-decoration: underline }

        /* ── CTA SECTION ── */
        .lp-cta { background: #f8fafb; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); overflow: hidden }
        .lp-cta-inner { display: grid; grid-template-columns: 1fr 1.6fr; min-height: 300px }
        @media(max-width:768px){ .lp-cta-inner { grid-template-columns: 1fr } .lp-cta-img { height: 220px; order: 2 } }
        .lp-cta-img { position: relative; overflow: hidden }
        .lp-cta-img img { width: 100%; height: 100%; object-fit: cover; object-position: left center }
        .lp-cta-text { display: flex; flex-direction: column; justify-content: center; padding: 3.5rem 3rem }
        @media(max-width:768px){ .lp-cta-text { padding: 2.5rem 1.25rem; order: 1 } }
        .lp-cta-h2 { font-size: clamp(1.875rem, 3.5vw, 2.5rem); font-weight: 900; color: var(--ink); letter-spacing: -.03em; margin: 0 0 .75rem; line-height: 1.1 }
        .lp-cta-lead { font-size: 1rem; color: #6b7280; margin: 0 0 2rem; line-height: 1.6 }
        .lp-cta-btns { display: flex; gap: .875rem; flex-wrap: wrap }
      `}</style>

      <main className="lp">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="lp-hero">
          <div className="container lp-hero-inner">

            <div>
              <div className="lp-eyebrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M6 9H3V5h3"/><path d="M18 9h3V5h-3"/><path d="M6 2h12v10a6 6 0 01-12 0V2z"/><path d="M12 18v4"/><path d="M8 22h8"/>
                </svg>
                World Cup 2026 Prediction Game
              </div>

              <h1 className="lp-h1">
                Predict the World Cup.
                <span className="green">Represent your<br/>GARRINCHA Center.</span>
              </h1>

              <p className="lp-lead">
                Join for free, predict match scores, earn points, and climb the leaderboard with your center.
              </p>

              <div className="lp-ctas">
                <Link href="/register" className="btn-fill">
                  Register free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/matches" className="btn-outline">
                  View matches
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </Link>
              </div>

              <div className="lp-trust">
                <span className="lp-trust-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 13h18"/><path d="M8 8a3 3 0 01-3-3 3 3 0 016 0"/><path d="M16 8a3 3 0 003-3 3 3 0 00-6 0"/></svg>
                  Free to play
                </span>
                <span className="lp-trust-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  No payment required
                </span>
                <span className="lp-trust-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Access by personal email link
                </span>
              </div>
            </div>

            <div className="lp-hero-img">
              <Image
                src="/images/hero-banner.png"
                alt="FIFA World Cup 2026 Trophy"
                fill
                style={{ objectFit: "cover", objectPosition: "center bottom" }}
                priority
                sizes="(max-width:900px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>

        {/* ── 3 STEPS ──────────────────────────────────────────────────────── */}
        <section className="lp-steps-section">
          <div className="container">
            <div className="lp-steps">

              <div className="step-card">
                <div className="step-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                </div>
                <div className="step-num-row">
                  <span className="step-num">1</span>
                  <h3 className="step-title">Register</h3>
                </div>
                <p className="step-body">Create your free player profile.</p>
              </div>

              <div className="step-card">
                <div className="step-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                  </svg>
                </div>
                <div className="step-num-row">
                  <span className="step-num">2</span>
                  <h3 className="step-title">Predict</h3>
                </div>
                <p className="step-body">Choose the score before each match starts.</p>
              </div>

              <div className="step-card">
                <div className="step-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <div className="step-num-row">
                  <span className="step-num">3</span>
                  <h3 className="step-title">Climb</h3>
                </div>
                <p className="step-body">Earn points and rise in the global and center leaderboards.</p>
              </div>

            </div>
          </div>
        </section>

        {/* ── SCORING + CENTERS ────────────────────────────────────────────── */}
        <section className="lp-split-section">
          <div className="container">
            <div className="lp-split">

              {/* Scoring card */}
              <div className="split-card">
                <div className="split-title">Simple scoring</div>

                <div className="score-row">
                  <div className="score-left">
                    <svg className="star" viewBox="0 0 24 24" aria-hidden>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"/>
                    </svg>
                    Exact score
                  </div>
                  <span className="score-pts">5 pts</span>
                </div>

                <div className="score-row">
                  <div className="score-left">
                    <svg className="star" viewBox="0 0 24 24" aria-hidden>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#d1d5db" stroke="#d1d5db" strokeWidth="1"/>
                    </svg>
                    Correct result + goal difference
                  </div>
                  <span className="score-pts">3 pts</span>
                </div>

                <div className="score-row">
                  <div className="score-left">
                    <svg className="star" viewBox="0 0 24 24" aria-hidden>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#d97706" stroke="#d97706" strokeWidth="1"/>
                    </svg>
                    Correct result
                  </div>
                  <span className="score-pts">2 pts</span>
                </div>

                <div className="score-row">
                  <div className="score-left">
                    <svg className="star" viewBox="0 0 24 24" aria-hidden>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#e5e7eb" stroke="#e5e7eb" strokeWidth="1"/>
                    </svg>
                    Wrong prediction
                  </div>
                  <span className="score-pts zero">0 pts</span>
                </div>
              </div>

              {/* Centers card */}
              <div className="split-card">
                <div className="split-title">Play for your GARRINCHA Center</div>
                <p className="split-lead">Choose your center during registration and help it climb the center leaderboard.</p>

                <div className="center-tiles">
                  {CENTERS.slice(0, 3).map((c) => (
                    <div key={c.short} className="center-tile">
                      <div className="center-avatar">
                        <Image
                          src="/images/player-medal.png"
                          alt={c.name}
                          width={60}
                          height={60}
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <div className="center-label">GARRINCHA<br/>{c.city.toUpperCase()}</div>
                    </div>
                  ))}
                  <div className="more-tile">
                    <div className="more-circle">+{CENTERS.length - 3}</div>
                    <div className="more-label">more centers</div>
                  </div>
                </div>

                <Link href="/leaderboards" className="see-lb">
                  See leaderboard
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* ── READY FOR KICKOFF ─────────────────────────────────────────────── */}
        <section className="lp-cta">
          <div className="lp-cta-inner">

            <div className="lp-cta-img">
              <Image
                src="/images/cta-banner.png"
                alt="Soccer ball in net"
                fill
                style={{ objectFit: "cover", objectPosition: "left center" }}
                sizes="(max-width:768px) 100vw, 38vw"
              />
            </div>

            <div className="lp-cta-text">
              <h2 className="lp-cta-h2">Ready for kickoff?</h2>
              <p className="lp-cta-lead">Register free and start predicting the World Cup.</p>
              <div className="lp-cta-btns">
                <Link href="/register" className="btn-fill">
                  Register free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/leaderboards" className="btn-outline">
                  View leaderboard
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 9H3V5h3"/><path d="M18 9h3V5h-3"/><path d="M6 2h12v10a6 6 0 01-12 0V2z"/><path d="M12 18v4"/><path d="M8 22h8"/></svg>
                </Link>
              </div>
            </div>

          </div>
        </section>

      </main>
    </>
  );
}
