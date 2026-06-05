import type { Metadata } from "next";
import { ArrowRight, Gift, Lock, Medal, QrCode, ShieldCheck, Trophy, UserPlus } from "lucide-react";
import Link from "next/link";
import { DataModeNotice } from "@/components/DataModeNotice";
import { TeamFlag } from "@/components/Flag";
import { getLocale } from "@/lib/i18n";
import { demoLeaderboard, demoMatches } from "@/lib/ui-demo-data";

export const metadata: Metadata = {
  title: "Demo Video | GARRINCHA World Cup Prediction",
  description: "A preview-only demo recording route for the GARRINCHA World Cup Prediction App.",
};

const upcomingMatch = demoMatches[0];
const lockedMatch = demoMatches[1];
const completedMatch = demoMatches[2];

function ScoreBox({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="demo-score-box" aria-label={`${label}: ${value}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function DemoMatchRow({
  match,
  status,
  score,
  action,
}: {
  match: typeof upcomingMatch;
  status: string;
  score: [number | string, number | string];
  action: string;
}) {
  return (
    <article className="demo-match-row">
      <div className="demo-team-side">
        <TeamFlag team={match.homeTeam} size="lg" />
        <strong>{match.homeTeam.name}</strong>
      </div>
      <div className="demo-match-center">
        <span className="badge green">{status}</span>
        <span className="demo-stage">Group {match.homeTeam.groupName ?? "stage"}</span>
        <time>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(match.kickoffAt)}</time>
        <div className="demo-scoreline">
          <ScoreBox value={score[0]} label="Home" />
          <span>-</span>
          <ScoreBox value={score[1]} label="Away" />
        </div>
        <button className="button primary" type="button">{action}</button>
      </div>
      <div className="demo-team-side">
        <TeamFlag team={match.awayTeam} size="lg" />
        <strong>{match.awayTeam.name}</strong>
      </div>
    </article>
  );
}

export default async function DemoVideoPage() {
  const locale = await getLocale();

  return (
    <main className="demo-video-page">
      <DataModeNotice locale={locale} />
      <div className="notice" role="status">
        Demo recording page: all screens below use preview data.
      </div>

      <section className="demo-video-hero">
        <div className="demo-video-hero-copy">
          <span className="eyebrow">Demo recording route</span>
          <strong>GARRINCHA</strong>
          <h1>World Cup Prediction Campaign</h1>
          <p>
            A simple QR-first pronostiek platform for GARRINCHA Centers: register, predict scores, earn
            points, and climb the leaderboards with your community.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/register">Register</Link>
            <Link className="button" href="/leaderboards">View leaderboard</Link>
          </div>
        </div>
        <div className="demo-video-poster" aria-label="Campaign poster placeholder">
          <span>GARRINCHA Center Challenge</span>
          <strong>Predict. Play. Win.</strong>
          <div className="qr-placeholder"><QrCode size={42} aria-hidden /></div>
          <p>Scan the campaign QR code</p>
        </div>
      </section>

      <section className="demo-video-band">
        <div className="section-title">
          <div>
            <span className="eyebrow">Step 1</span>
            <h2>Scan or open the campaign link</h2>
          </div>
          <span className="badge dark">Mobile first</span>
        </div>
        <div className="demo-video-grid">
          <article className="card demo-step-card">
            <QrCode aria-hidden />
            <h3>QR-ready entry</h3>
            <p className="muted">Posters, bar screens, socials, and center tablets can all point to the same campaign URL.</p>
          </article>
          <article className="card demo-register-card">
            <UserPlus aria-hidden />
            <h3>Fast registration</h3>
            <ul>
              <li>Email and password</li>
              <li>Date of birth and phone number</li>
              <li>Nationality and selected GARRINCHA Center</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="demo-video-band">
        <div className="section-title">
          <div>
            <span className="eyebrow">Step 2</span>
            <h2>Predict World Cup scores</h2>
          </div>
          <span className="badge green">Editable before kickoff</span>
        </div>
        <DemoMatchRow match={upcomingMatch} status="Upcoming" score={[2, 1]} action="Submit prediction" />
      </section>

      <section className="demo-video-band">
        <div className="section-title">
          <div>
            <span className="eyebrow">Step 3</span>
            <h2>Predictions lock at kickoff</h2>
          </div>
          <span className="badge red"><Lock size={14} aria-hidden /> Locked</span>
        </div>
        <DemoMatchRow match={lockedMatch} status="Locked" score={[1, 1]} action="Prediction locked" />
      </section>

      <section className="demo-video-band">
        <div className="section-title">
          <div>
            <span className="eyebrow">Step 4</span>
            <h2>Admin enters final scores</h2>
          </div>
          <span className="badge dark"><ShieldCheck size={14} aria-hidden /> Admin tools</span>
        </div>
        <div className="demo-admin-panel">
          <div>
            <h3>{completedMatch.homeTeam.name} vs {completedMatch.awayTeam.name}</h3>
            <p className="muted">Saving the official result recalculates every prediction for this match.</p>
          </div>
          <div className="demo-admin-score">
            <TeamFlag team={completedMatch.homeTeam} />
            <ScoreBox value={completedMatch.homeScore ?? 0} label="Final" />
            <span>-</span>
            <ScoreBox value={completedMatch.awayScore ?? 0} label="Final" />
            <TeamFlag team={completedMatch.awayTeam} />
          </div>
          <button className="button dark" type="button">Save score and recalculate</button>
        </div>
      </section>

      <section className="demo-video-band">
        <div className="section-title">
          <div>
            <span className="eyebrow">Step 5</span>
            <h2>Points, bonuses, and leaderboards</h2>
          </div>
          <span className="badge gold"><Trophy size={14} aria-hidden /> Live ranking</span>
        </div>
        <div className="demo-video-grid">
          <article className="card demo-points-card">
            <Medal aria-hidden />
            <strong>5 pts</strong>
            <span>Exact score prediction</span>
            <p className="muted">Correct and near-correct predictions automatically add points after final scores.</p>
          </article>
          <article className="card demo-points-card">
            <Gift aria-hidden />
            <strong>+3 pts</strong>
            <span>Manual bonus with reason</span>
            <p className="muted">Admins can award transparent bonus points for approved campaign moments.</p>
          </article>
        </div>
        <div className="demo-leaderboard">
          {demoLeaderboard.map((row, index) => (
            <article className="demo-leader-row" key={row.id}>
              <span className={`rank-medal top-${index + 1}`}>{index + 1}</span>
              <div>
                <strong>{row.name}</strong>
                <p>{row.nationality} - {row.center}</p>
              </div>
              <b>{row.points} pts</b>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-video-cta">
        <span className="eyebrow">Ready for launch assets</span>
        <h2>Bring the campaign to every GARRINCHA Center.</h2>
        <p>
          Add official banners, prize copy, QR codes, and center-specific visuals, then connect Supabase for live data testing.
        </p>
        <Link className="button primary" href="/register">
          Start the campaign <ArrowRight size={18} aria-hidden />
        </Link>
      </section>
    </main>
  );
}
