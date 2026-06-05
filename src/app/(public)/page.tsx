import Image from "next/image";
import Link from "next/link";

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

      <section className="lp-campaign-section" aria-labelledby="lp-campaign-title">
        <div className="container">
          <h2 id="lp-campaign-title" className="sr-only">
            Register, predict, climb, and win the prize challenge
          </h2>
          <div className="lp-campaign-graphic">
            <Image
              src="/images/landing-prize-challenge.png"
              alt="Register, predict, and climb. Top players per center win the prize challenge. Register for free."
              width={1672}
              height={941}
              sizes="(max-width: 1200px) 100vw, 1180px"
              className="lp-campaign-image"
            />
            <Link href="/register" className="lp-campaign-register-link">
              <span className="sr-only">Register for free</span>
            </Link>
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
