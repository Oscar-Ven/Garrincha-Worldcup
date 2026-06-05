import { redirect } from "next/navigation";
import { FeaturedMatchCard } from "@/components/FeaturedMatchCard";
import { MatchFilter } from "@/components/MatchFilter";
import type { FilterableMatch } from "@/components/MatchFilter";
import { DashboardAppBar } from "@/components/DashboardAppBar";
import CompetitionCenterSelect from "@/components/CompetitionCenterSelect";
import { DataModeNotice } from "@/components/DataModeNotice";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getLeaderboard, getUserRankAndPoints } from "@/lib/leaderboards";
import { getMatchesForUser } from "@/lib/matches";
import { isPredictionLocked } from "@/lib/scoring";
import { t } from "@/lib/translations";
import { demoCenters, demoLeaderboard, demoMatches, demoUser, hasDatabaseConfig } from "@/lib/ui-demo-data";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const locale = await getLocale();
  const user = hasDatabaseConfig() ? await getCurrentUser() : demoUser;
  if (!user) redirect("/login?next=/dashboard");

  const isDemo = !hasDatabaseConfig();
  const demoRankPoints = { rank: 0, points: 0 };

  const [matches, rankPoints, centers, topPredictors] = isDemo
    ? [demoMatches, demoRankPoints, demoCenters, demoLeaderboard.slice(0, 3)]
    : await Promise.all([
        getMatchesForUser(user.id),
        getUserRankAndPoints(user.id),
        prisma.garrinchaCenter.findMany({
          orderBy: [{ country: "asc" }, { city: "asc" }],
          select: { id: true, name: true, city: true, country: true },
        }),
        getLeaderboard({}, 3),
      ]);

  const now = new Date();
  const nowISO = now.toISOString();

  const made = matches.filter((m) => (m.predictions?.length ?? 0) > 0).length;
  const total = matches.length;
  const pct = total > 0 ? Math.round((made / total) * 100) : 0;

  const exactScores = matches.filter((m) => (m.predictions ?? []).some((p) => p.pointsAwarded === 5)).length;

  const userRank = isDemo ? (demoLeaderboard.findIndex((r) => r.id === user.id) + 1) || 0 : rankPoints.rank;
  const userPoints = isDemo ? (demoLeaderboard.find((r) => r.id === user.id)?.points ?? 0) : rankPoints.points;

  const nextMatch = matches.find(
    (m) => !isPredictionLocked(m.kickoffAt, now) && !(m.predictions ?? []).length,
  ) ?? matches.find((m) => !isPredictionLocked(m.kickoffAt, now));

  const hasCenter = isDemo || !!user.competitionCenterId;
  const centerName = isDemo ? user.center?.name : user.competitionCenter?.name ?? null;
  const activationCenter = user.center?.name ?? "";
  const displayName = (user as { nickname?: string | null }).nickname ?? user.fullName ?? "Player";

  const serializedMatches: FilterableMatch[] = matches.map((m) => ({
    id: m.id, stage: m.stage, fifaMatchNo: m.fifaMatchNo ?? null, venue: m.venue,
    kickoffAt: m.kickoffAt instanceof Date ? m.kickoffAt.toISOString() : String(m.kickoffAt),
    homeScore: m.homeScore ?? null, awayScore: m.awayScore ?? null,
    homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, fifaCode: m.homeTeam.fifaCode ?? null, flagUrl: m.homeTeam.flagUrl ?? null, groupName: m.homeTeam.groupName ?? null },
    awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, fifaCode: m.awayTeam.fifaCode ?? null, flagUrl: m.awayTeam.flagUrl ?? null, groupName: m.awayTeam.groupName ?? null },
    predictions: (m.predictions ?? []).map((p) => ({ id: p.id, homeScore: p.homeScore, awayScore: p.awayScore, pointsAwarded: p.pointsAwarded })),
  }));

  return (
    <>
      <DashboardAppBar displayName={displayName} />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="db-hero">
        <div className="db-hero-content">
          <div className="db-hero-eyebrow">WORLD CUP</div>
          <h1 className="db-hero-heading">PREDICTOR</h1>
          <div className="db-hero-stats">
            <div className="db-hero-stat">
              <span className="db-hero-stat-val">{userPoints.toLocaleString()}</span>
              <span className="db-hero-stat-lbl">POINTS</span>
            </div>
            <div className="db-hero-divider" />
            <div className="db-hero-stat">
              <span className="db-hero-stat-val">{userRank ? `#${userRank}` : "—"}</span>
              <span className="db-hero-stat-lbl">RANK</span>
            </div>
            <div className="db-hero-divider" />
            <div className="db-hero-stat">
              <span className="db-hero-stat-val">{exactScores}</span>
              <span className="db-hero-stat-lbl">EXACT</span>
            </div>
            <div className="db-hero-divider" />
            <div className="db-hero-stat">
              <span className="db-hero-stat-val">{pct}%</span>
              <span className="db-hero-stat-lbl">PREDICTED</span>
            </div>
          </div>
        </div>
      </section>

      <div className="dash-page">
        <DataModeNotice locale={locale} />

        {/* ── Center picker ─────────────────────────────────────────────── */}
        {!hasCenter && (
          <CompetitionCenterSelect centers={centers} activationCenterName={activationCenter} locale={locale} />
        )}

        {/* ── Featured match ────────────────────────────────────────────── */}
        {nextMatch && (
          <FeaturedMatchCard
            matchId={nextMatch.id}
            homeTeam={{ name: nextMatch.homeTeam.name, flagUrl: (nextMatch.homeTeam as { flagUrl?: string | null }).flagUrl ?? null }}
            awayTeam={{ name: nextMatch.awayTeam.name, flagUrl: (nextMatch.awayTeam as { flagUrl?: string | null }).flagUrl ?? null }}
            stage={nextMatch.stage}
            venue={nextMatch.venue ?? null}
            kickoffAt={nextMatch.kickoffAt instanceof Date ? nextMatch.kickoffAt.toISOString() : String(nextMatch.kickoffAt)}
            existingHome={(nextMatch.predictions ?? [])[0]?.homeScore ?? null}
            existingAway={(nextMatch.predictions ?? [])[0]?.awayScore ?? null}
            locked={isPredictionLocked(nextMatch.kickoffAt, now)}
          />
        )}

        {/* ── Top predictors ────────────────────────────────────────────── */}
        {topPredictors.length > 0 && (
          <div className="db-top-preds">
            <div className="db-top-preds-head">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M7 4h10v3a5 5 0 01-10 0z"/>
                <path d="M5 5H3v1a3 3 0 003 3M19 5h2v1a3 3 0 01-3 3"/>
                <path d="M9 12h6l-1 4H10z M12 16v4M9 20h6"/>
              </svg>
              TOP PREDICTORS
            </div>
            {topPredictors.map((p, i) => (
              <div key={p.id} className="db-top-pred-row">
                <span className="db-top-pred-rank">#{i + 1}</span>
                <span className="db-top-pred-name">{p.name}</span>
                <span className="db-top-pred-pts">{p.points} <small>pts</small></span>
              </div>
            ))}
            <Link href="/leaderboards" className="db-top-preds-link">VIEW FULL LEADERBOARD →</Link>
          </div>
        )}

        {/* ── Full match list ────────────────────────────────────────────── */}
        <div id="stats" className="dash-matches-section">
          <div className="dash-matches-head">
            <h2 className="dash-matches-title">{t(locale, "dashboard.section")}</h2>
            <p className="dash-matches-sub">{t(locale, "dashboard.lockNotice")}</p>
          </div>
          <MatchFilter matches={serializedMatches} locale={locale} nowISO={nowISO} />
        </div>

        {/* ── Center info (footer) ───────────────────────────────────────── */}
        {hasCenter && (centerName ?? activationCenter) && (
          <div id="rewards" className="db-center-footer">
            <span className="db-center-footer-label">YOUR CENTER</span>
            <span className="db-center-footer-name">{centerName ?? activationCenter}</span>
          </div>
        )}
        {!hasCenter && (
          <CompetitionCenterSelect centers={centers} activationCenterName={activationCenter} locale={locale} />
        )}
      </div>
    </>
  );
}
