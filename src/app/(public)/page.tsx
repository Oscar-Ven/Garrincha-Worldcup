import Image from "next/image";
import Link from "next/link";

const CENTERS = [
  { short: "AN", name: "Antwerpen Noord", city: "Antwerpen" },
  { short: "AZ", name: "Antwerpen Zuid", city: "Antwerpen" },
  { short: "CD", name: "Charleroi Dampremy", city: "Charleroi" },
  { short: "CM", name: "Charleroi Montignies", city: "Charleroi" },
  { short: "DG", name: "Diegem", city: "Diegem" },
  { short: "GA", name: "Gent Arsenaal", city: "Gent" },
  { short: "GT", name: "Gent The Loop", city: "Gent" },
  { short: "KT", name: "Kortrijk", city: "Kortrijk" },
  { short: "LK", name: "Luik", city: "Luik" },
  { short: "WD", name: "Westgate Dilbeek", city: "Dilbeek" },
];

export default function HomePage() {
  return (
    <main className="lp">
      <section className="lp-hero">
        <div className="container lp-hero-inner">
          <div>
            <Image
              src="/branding/garrincha-white.png"
              alt="GARRINCHA"
              width={270}
              height={66}
              className="lp-hero-logo"
              style={{ width: "min(270px, 72vw)", height: "auto" }}
              priority
            />
            <p>World Cup 2026 Prediction Game</p>
            <h1>Predict the World Cup. Represent your GARRINCHA Center.</h1>
            <p>
              Join for free, predict match scores, earn points, and climb the
              leaderboard with your center.
            </p>
            <div className="lp-ctas">
              <Link href="/register" className="btn">
                Register free
              </Link>
              <Link href="/matches" className="btn">
                View matches
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-steps-section">
        <div className="container">
          <div className="lp-steps">
            <article className="step-card">
              <h2>Register</h2>
              <p>Create your free player profile.</p>
            </article>
            <article className="step-card">
              <h2>Predict</h2>
              <p>Choose the score before each match starts.</p>
            </article>
            <article className="step-card">
              <h2>Climb</h2>
              <p>Earn points and rise in the global and center leaderboards.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="score-section">
        <div className="container">
          <div className="score-grid">

            {/* ── Simple Scoring ── */}
            <article className="sc-card">
              <div className="sc-card-head">
                <div className="sc-hex">
                  <svg className="sc-hex-shape" viewBox="0 0 56 56" fill="none">
                    <polygon points="28,2 54,15 54,41 28,54 2,41 2,15" fill="#0c1a10" stroke="#5fe090" strokeWidth="1.5"/>
                  </svg>
                  <svg className="sc-hex-ico" viewBox="0 0 24 24" fill="none" stroke="#5fe090" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 21h8M12 17v4M12 17a5 5 0 0 0 5-5V5H7v7a5 5 0 0 0 5 5Z"/>
                    <path d="M7 5H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1M17 5h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1"/>
                  </svg>
                </div>
                <h2 className="sc-card-title">Simple<br/>Scoring</h2>
              </div>
              <div className="sc-divider"/>
              <div className="sc-rows">
                <div className="sc-row">
                  <span className="sc-row-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="22"/><line x1="2" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="22" y2="12"/></svg>
                  </span>
                  <span className="sc-row-txt">Exact score</span>
                  <span className="sc-row-sep"/>
                  <span className="sc-row-pts"><strong className="sc-pts-num">5</strong><small className="sc-pts-lbl">points</small></span>
                </div>
                <div className="sc-row">
                  <span className="sc-row-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="6" width="20" height="13" rx="1"/><path d="M2 10h20M2 14h20M9 6v13M15 6v13"/></svg>
                  </span>
                  <span className="sc-row-txt">Correct result + goal difference</span>
                  <span className="sc-row-sep"/>
                  <span className="sc-row-pts"><strong className="sc-pts-num">3</strong><small className="sc-pts-lbl">points</small></span>
                </div>
                <div className="sc-row">
                  <span className="sc-row-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                  </span>
                  <span className="sc-row-txt">Correct result</span>
                  <span className="sc-row-sep"/>
                  <span className="sc-row-pts"><strong className="sc-pts-num">2</strong><small className="sc-pts-lbl">points</small></span>
                </div>
                <div className="sc-row sc-row--wrong">
                  <span className="sc-row-ico sc-row-ico--wrong">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                  </span>
                  <span className="sc-row-txt">Wrong prediction</span>
                  <span className="sc-row-sep"/>
                  <span className="sc-row-pts sc-row-pts--zero"><strong className="sc-pts-num sc-pts-num--zero">0</strong><small className="sc-pts-lbl">points</small></span>
                </div>
              </div>
            </article>

            {/* ── Play for your Center ── */}
            <article className="sc-card">
              <div className="sc-card-head">
                <div className="sc-hex">
                  <svg className="sc-hex-shape" viewBox="0 0 56 56" fill="none">
                    <polygon points="28,2 54,15 54,41 28,54 2,41 2,15" fill="#0c1a10" stroke="#5fe090" strokeWidth="1.5"/>
                  </svg>
                  <svg className="sc-hex-ico" viewBox="0 0 24 24" fill="none" stroke="#5fe090" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/>
                  </svg>
                </div>
                <h2 className="sc-card-title">Play for your<br/>Garrincha Center</h2>
              </div>
              <div className="sc-divider"/>
              <p className="sc-desc">Choose your center during registration and help it climb the center leaderboard.</p>
              <div className="sc-centers">
                <ul>
                  <li>Antwerpen Noord, Antwerpen</li>
                  <li>Antwerpen Zuid, Antwerpen</li>
                  <li>Charleroi Dampremy, Charleroi</li>
                  <li>Charleroi Montignies, Charleroi</li>
                  <li>Diegem, Diegem</li>
                </ul>
                <ul>
                  <li>Gent Arsenal, Gent</li>
                  <li>Gent The Loop, Gent</li>
                  <li>Kortrijk, Kortrijk</li>
                  <li>Luik, Luik</li>
                  <li>Westgate Dilbeek, Dilbeek</li>
                </ul>
              </div>
              <Link href="/leaderboards" className="sc-cta-btn">
                <span>SEE LEADERBOARD</span>
                <span className="sc-cta-right">
                  <span className="sc-cta-arrow">›</span>
                  <svg className="sc-cta-ball" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    <path d="M2 12h20"/>
                  </svg>
                </span>
              </Link>
            </article>

          </div>
        </div>
      </section>

      <section className="lp-cta">
        <div className="container">
          <h2>Ready for kickoff?</h2>
          <p>Register free and start predicting the World Cup.</p>
          <div className="lp-cta-btns">
            <Link href="/register" className="btn">
              Register free
            </Link>
            <Link href="/leaderboards" className="btn">
              View leaderboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
