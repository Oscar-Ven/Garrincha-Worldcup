import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MatchFilter } from "@/components/MatchFilter";
import type { FilterableMatch } from "@/components/MatchFilter";
import { AvatarUpload } from "@/components/AvatarUpload";
import { DashboardAppBar } from "@/components/DashboardAppBar";
import CompetitionCenterSelect from "@/components/CompetitionCenterSelect";
import { DataModeNotice } from "@/components/DataModeNotice";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getUserRankAndPoints } from "@/lib/leaderboards";
import { getMatchesForUser } from "@/lib/matches";
import { isPredictionLocked } from "@/lib/scoring";
import { t } from "@/lib/translations";
import { demoCenters, demoLeaderboard, demoMatches, demoUser, hasDatabaseConfig } from "@/lib/ui-demo-data";
import { prisma } from "@/lib/prisma";

// ─── Small helpers ────────────────────────────────────────────────────────────

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function fmtKickoff(raw: string | Date) {
  try {
    const d = new Date(typeof raw === "string" ? raw : raw.toISOString());
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const datePart = isToday ? "Today" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const timePart = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return `${datePart}, ${timePart}`;
  } catch { return ""; }
}

// ─── Icon components ──────────────────────────────────────────────────────────

const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconZap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconGift = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 13h18"/><path d="M8 8a3 3 0 01-3-3 3 3 0 016 0c0 1.5-3 5-3 5z"/><path d="M16 8a3 3 0 003-3 3 3 0 00-6 0c0 1.5 3 5 3 5z"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconMatchNav = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconTrophy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M7 4h10v3a5 5 0 01-10 0z"/><path d="M5 5H3v1a3 3 0 003 3M19 5h2v1a3 3 0 01-3 3M9 14h6l-1 4h-4z"/>
  </svg>
);
const IconPerson = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
  </svg>
);
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M9 18l6-6-6-6"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const locale = await getLocale();
  const user = hasDatabaseConfig() ? await getCurrentUser() : demoUser;
  if (!user) redirect("/login?next=/dashboard");

  const isDemo = !hasDatabaseConfig();
  const demoRankPoints = { rank: 0, points: 0 };

  const [matches, rankPoints, centers] = isDemo
    ? [demoMatches, demoRankPoints, demoCenters]
    : await Promise.all([
        getMatchesForUser(user.id),
        getUserRankAndPoints(user.id),
        prisma.garrinchaCenter.findMany({
          orderBy: [{ country: "asc" }, { city: "asc" }],
          select: { id: true, name: true, city: true, country: true },
        }),
      ]);

  const now = new Date();
  const nowISO = now.toISOString();

  const made = matches.filter((m) => (m.predictions?.length ?? 0) > 0).length;
  const total = matches.length;
  const missing = total - made;
  const pct = total > 0 ? Math.round((made / total) * 100) : 0;

  const exactScores = matches.filter((m) => (m.predictions ?? []).some((p) => p.pointsAwarded === 5)).length;
  const correctWinners = matches.filter((m) => (m.predictions ?? []).some((p) => p.pointsAwarded >= 2)).length;

  const userRank = isDemo ? (demoLeaderboard.findIndex((r) => r.id === user.id) + 1) || 0 : rankPoints.rank;
  const userPoints = isDemo ? (demoLeaderboard.find((r) => r.id === user.id)?.points ?? 0) : rankPoints.points;

  const nextMatch = matches.find(
    (m) => !isPredictionLocked(m.kickoffAt, now) && !(m.predictions ?? []).length,
  ) ?? matches.find((m) => !isPredictionLocked(m.kickoffAt, now));

  const hasCenter = isDemo || !!user.competitionCenterId;
  const centerName = isDemo ? user.center?.name : user.competitionCenter?.name ?? null;
  const activationCenter = user.center?.name ?? "";
  const displayName = (user as { nickname?: string | null }).nickname ?? user.fullName ?? "Player";
  const avatarUrl = isDemo ? null : (user as { avatarUrl?: string | null }).avatarUrl ?? null;

  // Serialize for MatchFilter
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
      {/* ── Dedicated app bar — isolated from public site nav ── */}
      <DashboardAppBar displayName={displayName} />

      <div className="dash-page">
        <DataModeNotice locale={locale} />

        {/* ── WELCOME CARD ──────────────────────────────────────────────── */}
        <div className="dash-welcome-card">
          <div className="dash-welcome-trophy">
            <Image
              src="/images/world-cup-trophy.png"
              alt="World Cup trophy"
              width={72}
              height={90}
              priority
              unoptimized
            />
          </div>
          <div className="dash-welcome-body">
            <div className="dash-welcome-name">Welcome back, {displayName}!</div>
            <div className="dash-welcome-sub">World Cup Pronostiek 2026</div>
            <div className="dash-welcome-badges">
              <span className="dash-badge-active">
                <span className="dash-badge-dot" />
                Active Player
              </span>
              <span className="dash-badge-date">
                <IconCalendar />
                Access valid until 19 Jul 2026
              </span>
            </div>
          </div>
        </div>

        {/* ── Center picker (if not chosen) ─────────────────────────────── */}
        {!hasCenter && (
          <CompetitionCenterSelect centers={centers} activationCenterName={activationCenter} locale={locale} />
        )}

        {/* ── STATS CARDS ───────────────────────────────────────────────── */}
        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: "var(--green)" }}>
              {userPoints.toLocaleString()}
            </div>
            <div className="stat-card-label">Total Points</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: "var(--green)" }}>
              {userRank ? `#${userRank}` : "—"}
            </div>
            <div className="stat-card-label">Ranking</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: "var(--green)" }}>{correctWinners}</div>
            <div className="stat-card-label">Correct Results</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: "var(--green)" }}>{exactScores}</div>
            <div className="stat-card-label">Exact Scores</div>
          </div>
        </div>

        {/* ── TWO-COLUMN ROW: Prediction Progress + Quick Actions ───────── */}
        <div className="dash-row-2">

          {/* Prediction Progress */}
          <div className="dash-section">
            <div className="dash-section-head">
              <span className="dash-section-icon" style={{ color: "var(--green)" }}><IconTarget /></span>
              <span className="dash-section-title">Your Predictions</span>
            </div>

            <div className="dash-pred-nums">
              <div>
                <div className="dash-pred-big">
                  {made}
                  <span className="dash-pred-sep"> / {total}</span>
                </div>
                <div className="dash-pred-lbl">Predictions Made</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  className="dash-pred-big"
                  style={{ color: missing > 0 ? "var(--danger)" : "var(--green)" }}
                >
                  {missing}
                </div>
                <div className="dash-pred-lbl">Missing</div>
              </div>
            </div>

            <div className="dash-progress">
              <div className="dash-progress-track">
                <div className="dash-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="dash-progress-pct">{pct}%</span>
            </div>

            {nextMatch ? (
              <div className="dash-next-wrap">
                <div className="dash-next-lbl">Next match to predict</div>
                <div className="dash-next-match">
                  <div className="dash-flag-pair">
                    <span className="dash-flag-code">
                      {nextMatch.homeTeam.fifaCode ?? nextMatch.homeTeam.name.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="dash-vs">vs</span>
                    <span className="dash-flag-code">
                      {nextMatch.awayTeam.fifaCode ?? nextMatch.awayTeam.name.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                  <div className="dash-next-time">
                    <IconCalendar />
                    {fmtKickoff(nextMatch.kickoffAt)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="dash-all-done">
                <IconCheck />
                All upcoming matches predicted
              </div>
            )}

            <Link href="/matches" className="dash-btn-primary">
              Go to Matches →
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="dash-section">
            <div className="dash-section-head">
              <span className="dash-section-icon" style={{ color: "var(--green)" }}><IconZap /></span>
              <span className="dash-section-title">Quick Actions</span>
            </div>
            <div className="dash-actions-list">
              <Link href="/matches" className="dash-action">
                <span className="dash-action-icon"><IconMatchNav /></span>
                <div className="dash-action-text">
                  <div className="dash-action-title">Matches</div>
                  <div className="dash-action-sub">Make your predictions</div>
                </div>
                <span className="dash-action-arrow"><IconArrow /></span>
              </Link>
              <div className="dash-action-divider" />
              <Link href="/leaderboards" className="dash-action">
                <span className="dash-action-icon"><IconTrophy /></span>
                <div className="dash-action-text">
                  <div className="dash-action-title">Leaderboard</div>
                  <div className="dash-action-sub">See full rankings</div>
                </div>
                <span className="dash-action-arrow"><IconArrow /></span>
              </Link>
              <div className="dash-action-divider" />
              <Link href="/dashboard#account" className="dash-action">
                <span className="dash-action-icon"><IconPerson /></span>
                <div className="dash-action-text">
                  <div className="dash-action-title">Account</div>
                  <div className="dash-action-sub">Manage your details</div>
                </div>
                <span className="dash-action-arrow"><IconArrow /></span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── SCORING TIP ───────────────────────────────────────────────── */}
        <div className="dash-tip">
          <span className="dash-tip-icon"><IconGift /></span>
          <div>
            <div className="dash-tip-title">Scoring Guide</div>
            <div className="dash-tip-body">
              Make all your predictions before the match starts to earn maximum points!
              Exact score = 5 pts · Correct result + goal diff = 3 pts · Correct result = 2 pts.
            </div>
          </div>
        </div>

        {/* ── ACCOUNT SECTION ───────────────────────────────────────────── */}
        <div id="account" className="dash-row-2">
          <div className="dash-section">
            <div className="dash-section-head">
              <span className="dash-section-icon"><IconPerson /></span>
              <span className="dash-section-title">Your Profile</span>
            </div>
            <div className="dash-profile-body">
              <AvatarUpload
                currentUrl={avatarUrl}
                initials={initials(displayName)}
              />
              <div className="dash-profile-info">
                <div className="dash-profile-name">{displayName}</div>
                <div className="dash-profile-email">{user.email ?? ""}</div>
                {(centerName ?? activationCenter) && (
                  <div className="dash-profile-center">
                    <IconTrophy />
                    {centerName ?? activationCenter}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="dash-section">
            <div className="dash-section-head">
              <span className="dash-section-icon"><IconTrophy /></span>
              <span className="dash-section-title">Your Center</span>
            </div>
            {hasCenter ? (
              <div className="dash-center-name">{centerName ?? activationCenter}</div>
            ) : (
              <p style={{ color: "var(--text-3)", fontSize: 14 }}>
                Choose a GARRINCHA Center to represent before your first prediction.
              </p>
            )}
            {!hasCenter && (
              <CompetitionCenterSelect centers={centers} activationCenterName={activationCenter} locale={locale} />
            )}
          </div>
        </div>

        {/* ── FULL MATCH PREDICTIONS ────────────────────────────────────── */}
        <div className="dash-matches-section">
          <div className="dash-matches-head">
            <h2 className="dash-matches-title">{t(locale, "dashboard.section")}</h2>
            <p className="dash-matches-sub">
              <IconCalendar />
              {t(locale, "dashboard.lockNotice")}
            </p>
          </div>
          <MatchFilter matches={serializedMatches} locale={locale} nowISO={nowISO} />
        </div>
      </div>
    </>
  );
}
