import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { MatchFilter } from "@/components/MatchFilter";
import type { FilterableMatch } from "@/components/MatchFilter";
import CompetitionCenterSelect from "@/components/CompetitionCenterSelect";
import { CountryFlag } from "@/components/Flag";
import { DataModeNotice } from "@/components/DataModeNotice";
import { getCurrentUser } from "@/lib/auth";
import { isoCodeForNationality } from "@/lib/flags";
import { getLocale } from "@/lib/i18n";
import { getLeaderboard, getUserRankAndPoints } from "@/lib/leaderboards";
import { getMatchesForUser } from "@/lib/matches";
import { isPredictionLocked } from "@/lib/scoring";
import { t } from "@/lib/translations";
import { demoCenters, demoLeaderboard, demoMatches, demoUser, hasDatabaseConfig } from "@/lib/ui-demo-data";
import { prisma } from "@/lib/prisma";

// ─── helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, { bg: string; color: string }> = {
    1: { bg: "#F5C24222", color: "#F5C242" },
    2: { bg: "#C8CDD422", color: "#C8CDD4" },
    3: { bg: "#CD8B5B22", color: "#CD8B5B" },
  };
  const s = colors[rank] ?? { bg: "rgba(255,255,255,0.07)", color: "var(--ink-dim)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 28, height: 28, borderRadius: 7, fontSize: 13, fontWeight: 700,
      background: s.bg, color: s.color, flexShrink: 0,
    }}>
      {rank}
    </span>
  );
}

function TeamFlag({ fifaCode, name }: { fifaCode: string | null; name: string }) {
  const iso = fifaCode ? isoCodeForNationality(name) ?? null : null;
  if (iso) {
    return <CountryFlag isoCode={iso} label={name} size="sm" />;
  }
  return (
    <span style={{
      display: "inline-block", width: 24, height: 16, background: "var(--surface-2)",
      borderRadius: 3, fontSize: 9, color: "var(--ink-faint)", textAlign: "center", lineHeight: "16px",
    }}>
      {fifaCode ?? "?"}
    </span>
  );
}

function formatKickoff(iso: string, locale: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === "nl" ? "nl-BE" : locale === "fr" ? "fr-FR" : "en-GB", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const locale = await getLocale();
  const user = hasDatabaseConfig() ? await getCurrentUser() : demoUser;
  if (!user) redirect("/login?next=/dashboard");

  const isDemo = !hasDatabaseConfig();

  const demoTopPlayers = demoLeaderboard.map((r, i) => ({ ...r, rank: i + 1 }));
  const demoRankAndPoints = { rank: 0, points: 0 };

  const [matches, rankAndPoints, centers, topPlayers] = isDemo
    ? [demoMatches, demoRankAndPoints, demoCenters, demoTopPlayers]
    : await Promise.all([
        getMatchesForUser(user.id),
        getUserRankAndPoints(user.id),
        prisma.garrinchaCenter.findMany({
          orderBy: [{ country: "asc" }, { city: "asc" }],
          select: { id: true, name: true, city: true, country: true },
        }),
        getLeaderboard({}, 5).then((rows) => rows.map((r, i) => ({ ...r, rank: i + 1 }))),
      ]);

  const now = new Date();
  const nowISO = now.toISOString();

  // ── derived stats ──────────────────────────────────────────────────────────
  const made = matches.filter((m) => (m.predictions?.length ?? 0) > 0).length;
  const total = matches.length;
  const missing = total - made;
  const pct = total > 0 ? Math.round((made / total) * 100) : 0;

  const correctScores = matches.filter((m) =>
    (m.predictions ?? []).some((p) => p.pointsAwarded === 5),
  ).length;
  const correctOutcomes = matches.filter((m) =>
    (m.predictions ?? []).some((p) => p.pointsAwarded >= 2),
  ).length;

  const userRank = isDemo
    ? (demoLeaderboard.findIndex((r) => r.id === user.id) + 1) || 0
    : rankAndPoints.rank;
  const userPoints = isDemo
    ? (demoLeaderboard.find((r) => r.id === user.id)?.points ?? 0)
    : rankAndPoints.points;

  // upcoming = next 3 matches not yet locked
  const upcomingMatches = matches
    .filter((m) => !isPredictionLocked(m.kickoffAt, now))
    .slice(0, 3);

  // next unpredicted match
  const nextToPredict = matches.find(
    (m) => !isPredictionLocked(m.kickoffAt, now) && !(m.predictions ?? []).length,
  ) ?? upcomingMatches[0];

  const hasCompetitionCenter = isDemo || !!user.competitionCenterId;
  const competitionCenterName = isDemo
    ? user.center?.name
    : user.competitionCenter?.name ?? null;
  const activationCenterName = user.center?.name ?? "";
  const displayName = (user as { nickname?: string | null }).nickname ?? user.fullName ?? "Player";
  const userEmail = user.email ?? "";

  // ── leaderboard highlight ──────────────────────────────────────────────────
  const userInTopPlayers = topPlayers.some((r) => r.id === user.id);
  const displayBoard = userInTopPlayers
    ? topPlayers
    : [...topPlayers.slice(0, 4), { id: user.id, name: displayName, center: competitionCenterName ?? "", nationality: "", points: userPoints, predictionCount: made, rank: userRank }];

  // ── serialize for MatchFilter ──────────────────────────────────────────────
  const serializedMatches: FilterableMatch[] = matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    fifaMatchNo: m.fifaMatchNo ?? null,
    venue: m.venue,
    kickoffAt: m.kickoffAt instanceof Date ? m.kickoffAt.toISOString() : String(m.kickoffAt),
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, fifaCode: m.homeTeam.fifaCode ?? null, flagUrl: m.homeTeam.flagUrl ?? null, groupName: m.homeTeam.groupName ?? null },
    awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, fifaCode: m.awayTeam.fifaCode ?? null, flagUrl: m.awayTeam.flagUrl ?? null, groupName: m.awayTeam.groupName ?? null },
    predictions: (m.predictions ?? []).map((p) => ({ id: p.id, homeScore: p.homeScore, awayScore: p.awayScore, pointsAwarded: p.pointsAwarded })),
  }));

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="db-page">
      <DataModeNotice locale={locale} />

      {/* ── HERO CARD ─────────────────────────────────────────────────────── */}
      <div className="db-hero">
        <div className="db-hero-left">
          <Image
            src="/garrincha-white.png"
            alt="GARRINCHA"
            height={18}
            width={110}
            style={{ height: 18, width: "auto", opacity: 0.9 }}
          />
          <div className="db-hero-eyebrow">Welcome back,</div>
          <div className="db-hero-name">{displayName.toUpperCase()}!</div>
          <div className="db-hero-sub">World Cup Pronostiek 2026</div>
          <div className="db-status-badge">
            <span className="db-status-dot" />
            Account Status · <strong>Active</strong>
          </div>
        </div>
        <div className="db-hero-right" aria-hidden>
          <div className="db-hero-ball">⚽</div>
          <div className="db-hero-glow" />
        </div>
      </div>

      {/* ── 2-COL GRID: Prediction Status + Stats ─────────────────────────── */}
      <div className="db-grid-2">

        {/* Prediction Status */}
        <div className="db-card">
          <div className="db-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
            Prediction Status
          </div>
          <div className="db-pred-row">
            <span>Predictions submitted</span>
            <span className="db-pred-val" style={{ color: "var(--green)" }}>{made} / {total}</span>
          </div>
          <div className="db-pred-row">
            <span>Missing predictions</span>
            <span className="db-pred-val" style={{ color: missing > 0 ? "var(--live)" : "var(--green)" }}>{missing}</span>
          </div>
          {/* progress bar */}
          <div className="db-progress-bar">
            <div className="db-progress-fill" style={{ width: `${pct}%` }} />
          </div>

          {nextToPredict ? (
            <div className="db-next-match">
              <div className="db-next-label">Next match to predict</div>
              <div className="db-next-row">
                <TeamFlag fifaCode={nextToPredict.homeTeam.fifaCode} name={nextToPredict.homeTeam.name} />
                <span className="db-team-code">{nextToPredict.homeTeam.fifaCode ?? nextToPredict.homeTeam.name.slice(0, 3).toUpperCase()}</span>
                <span className="db-vs">vs</span>
                <span className="db-team-code">{nextToPredict.awayTeam.fifaCode ?? nextToPredict.awayTeam.name.slice(0, 3).toUpperCase()}</span>
                <TeamFlag fifaCode={nextToPredict.awayTeam.fifaCode} name={nextToPredict.awayTeam.name} />
              </div>
              <div className="db-next-time">
                {formatKickoff(nextToPredict.kickoffAt instanceof Date ? nextToPredict.kickoffAt.toISOString() : String(nextToPredict.kickoffAt), locale)}
              </div>
            </div>
          ) : (
            <div className="db-next-match" style={{ color: "var(--ink-dim)", fontSize: 13 }}>
              All upcoming matches predicted ✓
            </div>
          )}

          <Link href="/matches" className="db-cta-btn">
            Go to Matches →
          </Link>
        </div>

        {/* Your Stats */}
        <div className="db-card">
          <div className="db-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M5 21V10M12 21V4M19 21v-7" />
            </svg>
            Your Stats
          </div>
          <div className="db-stats-4">
            <div className="db-stat-cell">
              <div className="db-stat-label">Points</div>
              <div className="db-stat-big" style={{ color: "var(--gold)" }}>{userPoints.toLocaleString()}</div>
            </div>
            <div className="db-stat-cell">
              <div className="db-stat-label">Correct Scores</div>
              <div className="db-stat-big" style={{ color: "var(--green)" }}>{correctScores}</div>
            </div>
            <div className="db-stat-cell">
              <div className="db-stat-label">Correct Outcomes</div>
              <div className="db-stat-big" style={{ color: "var(--green)" }}>{correctOutcomes}</div>
            </div>
            <div className="db-stat-cell">
              <div className="db-stat-label">Rank</div>
              <div className="db-stat-big" style={{ color: "var(--ink)" }}>
                {userRank ? `#${userRank}` : "—"}
              </div>
              {userRank && total > 0 && (
                <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}>
                  Top {Math.max(1, Math.round((userRank / Math.max(total, 1)) * 100))}%
                </div>
              )}
            </div>
          </div>
          <Link href="/leaderboards" className="db-link-row">
            View full statistics →
          </Link>
        </div>
      </div>

      {/* ── Competition center picker (if not chosen) ─────────────────────── */}
      {!hasCompetitionCenter && (
        <CompetitionCenterSelect
          centers={centers}
          activationCenterName={activationCenterName}
          locale={locale}
        />
      )}

      {/* ── 2-COL GRID: Upcoming + Leaderboard ────────────────────────────── */}
      <div className="db-grid-2">

        {/* Upcoming Matches */}
        <div className="db-card">
          <div className="db-card-title-row">
            <div className="db-card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Upcoming Matches
            </div>
            <Link href="/matches" className="db-view-all">View all →</Link>
          </div>

          {upcomingMatches.length === 0 ? (
            <div style={{ color: "var(--ink-dim)", fontSize: 13, padding: "12px 0" }}>
              No upcoming matches yet.
            </div>
          ) : (
            <div className="db-match-list">
              {upcomingMatches.map((m) => (
                <div key={m.id} className="db-match-row">
                  <div className="db-match-teams">
                    <TeamFlag fifaCode={m.homeTeam.fifaCode} name={m.homeTeam.name} />
                    <span className="db-team-code">{m.homeTeam.fifaCode ?? m.homeTeam.name.slice(0, 3).toUpperCase()}</span>
                    <span className="db-vs">vs</span>
                    <span className="db-team-code">{m.awayTeam.fifaCode ?? m.awayTeam.name.slice(0, 3).toUpperCase()}</span>
                    <TeamFlag fifaCode={m.awayTeam.fifaCode} name={m.awayTeam.name} />
                  </div>
                  <div className="db-match-time">
                    {formatKickoff(m.kickoffAt instanceof Date ? m.kickoffAt.toISOString() : String(m.kickoffAt), locale)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link href="/matches" className="db-cta-btn">
            Go to Matches →
          </Link>
        </div>

        {/* Leaderboard Top 5 */}
        <div className="db-card">
          <div className="db-card-title-row">
            <div className="db-card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M7 4h10v3a5 5 0 01-10 0z"/><path d="M5 5H3v1a3 3 0 003 3M19 5h2v1a3 3 0 01-3 3M9 14h6l-1 4h-4z"/>
              </svg>
              Leaderboard Top 5
            </div>
            <Link href="/leaderboards" className="db-view-all">View all →</Link>
          </div>

          <div className="db-lb-list">
            {displayBoard.slice(0, 5).map((row) => {
              const isMe = row.id === user.id;
              return (
                <div key={row.id} className={`db-lb-row${isMe ? " db-lb-row--me" : ""}`}>
                  <RankBadge rank={row.rank} />
                  <span className="db-lb-name">{row.name}</span>
                  <span className="db-lb-pts">{row.points.toLocaleString()} pts</span>
                </div>
              );
            })}
          </div>

          <Link href="/leaderboards" className="db-cta-btn">
            View Full Leaderboard →
          </Link>
        </div>
      </div>

      {/* ── Profile + Help ────────────────────────────────────────────────── */}
      <div className="db-grid-2">
        {/* Profile */}
        <div className="db-card db-profile-card">
          <div className="db-profile-avatar">{initials(displayName)}</div>
          <div className="db-profile-info">
            <div className="db-profile-name">{displayName}</div>
            {userEmail && <div className="db-profile-email">{userEmail}</div>}
            {(competitionCenterName ?? activationCenterName) && (
              <div className="db-profile-center">
                🏟 {competitionCenterName ?? activationCenterName}
              </div>
            )}
          </div>
        </div>

        {/* Help */}
        <div className="db-card db-help-card">
          <div className="db-help-icon">?</div>
          <div>
            <div className="db-help-title">Need Help?</div>
            <div className="db-help-body">
              Check the FAQ or contact support if you have questions about your predictions or account.
            </div>
            <a href="https://www.garrincha.be/nl/contact" target="_blank" rel="noopener noreferrer" className="db-link-row">
              Contact Support →
            </a>
          </div>
        </div>
      </div>

      {/* ── Full Match Predictions ────────────────────────────────────────── */}
      <div className="db-section">
        <div className="db-section-head">
          <h2 className="db-section-title">{t(locale, "dashboard.section")}</h2>
          <span className="db-section-sub">⏱ {t(locale, "dashboard.lockNotice")}</span>
        </div>
        <MatchFilter matches={serializedMatches} locale={locale} nowISO={nowISO} />
      </div>
    </div>
  );
}
