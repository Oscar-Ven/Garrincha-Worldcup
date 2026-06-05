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

      <section className="lp-split-section">
        <div className="container">
          <div className="lp-split">
            <article className="split-card">
              <h2>Simple scoring</h2>
              <ul>
                <li>Exact score: 5 points</li>
                <li>Correct result and goal difference: 3 points</li>
                <li>Correct result: 2 points</li>
                <li>Wrong prediction: 0 points</li>
              </ul>
            </article>

            <article className="split-card">
              <h2>Play for your GARRINCHA Center</h2>
              <p>
                Choose your center during registration and help it climb the
                center leaderboard.
              </p>
              <ul>
                {CENTERS.map((center) => (
                  <li key={center.short}>
                    {center.name}, {center.city}
                  </li>
                ))}
              </ul>
              <Link href="/leaderboards" className="btn">
                See leaderboard
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
