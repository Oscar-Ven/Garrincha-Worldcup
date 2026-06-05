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
import { getLeaderboard, getUserRankAndPoints } from "@/lib/leaderboards";
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

// ─── Icon components (Lucide-style) ──────────────────────────────────────────

const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconBar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M5 21V10M12 21V4M19 21v-7"/>
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const locale = await getLocale();
  const user = hasDatabaseConfig() ? await getCurrentUser() : demoUser;
  if (!user) redirect("/login?next=/dashboard");

  const isDemo = !hasDatabaseConfig();
  const demoRankPoints = { rank: 0, points: 0 };

  const [matches, rankPoints, centers, topPlayers] = isDemo
    ? [demoMatches, demoRankPoints, demoCenters, demoLeaderboard.map((r, i) => ({ ...r, rank: i + 1 }))]
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

      <div className="d2-root">
        <DataModeNotice locale={locale} />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div className="d2-hero">
        <div className="d2-hero-trophy">
          <Image
            src="/images/world-cup-trophy.png"
            alt="World Cup trophy"
            width={120}
            height={150}
            className="d2-trophy-img"
            priority
            unoptimized
          />
        </div>
        <div className="d2-hero-content">
          <div className="d2-hero-welcome">Welcome back, {displayName}! 👋</div>
          <div className="d2-hero-sub">World Cup Pronostiek 2026</div>
          <div className="d2-hero-badges">
            <span className="d2-badge-active">
              <span className="d2-badge-dot" />
              Active Player
            </span>
            <span className="d2-badge-date">
              <IconCalendar />
              Access valid until 19 Jul 2026
            </span>
          </div>
        </div>
        <div className="d2-hero-glow" aria-hidden />
      </div>

      {/* ── Center picker (if not chosen) ─────────────────────────────── */}
      {!hasCenter && (
        <CompetitionCenterSelect centers={centers} activationCenterName={activationCenter} locale={locale} />
      )}

      {/* ── PREDICTIONS + STATS ROW ───────────────────────────────────── */}
      <div className="d2-row-2">

        {/* Your Predictions */}
        <div className="d2-card">
          <div className="d2-card-head">
            <span className="d2-card-icon" style={{ color: "var(--d2-green)" }}><IconTarget /></span>
            <span className="d2-card-title">Your Predictions</span>
          </div>

          <div className="d2-pred-nums">
            <div>
              <div className="d2-pred-big">{made} <span className="d2-pred-sep">/ {total}</span></div>
              <div className="d2-pred-lbl">Predictions Made</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="d2-pred-big" style={{ color: missing > 0 ? "#ff6b6b" : "var(--d2-green)" }}>{missing}</div>
              <div className="d2-pred-lbl">Missing</div>
            </div>
          </div>

          <div className="d2-prog-bar">
            <div className="d2-prog-fill" style={{ width: `${pct}%` }} />
            <span className="d2-prog-pct">{pct}%</span>
          </div>

          {nextMatch ? (
            <div className="d2-next-wrap">
              <div className="d2-next-lbl">Next match to predict</div>
              <div className="d2-next-match">
                <div className="d2-flag-pair">
                  <span className="d2-flag-code">{nextMatch.homeTeam.fifaCode ?? nextMatch.homeTeam.name.slice(0, 3).toUpperCase()}</span>
                  <span className="d2-vs">vs</span>
                  <span className="d2-flag-code">{nextMatch.awayTeam.fifaCode ?? nextMatch.awayTeam.name.slice(0, 3).toUpperCase()}</span>
                </div>
                <div className="d2-next-time">
                  <IconCalendar />
                  {fmtKickoff(nextMatch.kickoffAt)}
                </div>
              </div>
            </div>
          ) : (
            <div className="d2-all-done">✓ All upcoming matches predicted</div>
          )}

          <Link href="/matches" className="d2-btn-primary">
            Go to Matches →
          </Link>
        </div>

        {/* Your Stats */}
        <div className="d2-card">
          <div className="d2-card-head">
            <span className="d2-card-icon" style={{ color: "var(--d2-green)" }}><IconBar /></span>
            <span className="d2-card-title">Your Stats</span>
          </div>

          <div className="d2-stats-grid">
            <div className="d2-stat-cell">
              <div className="d2-stat-num" style={{ color: "var(--d2-green)" }}>
                {userRank ? `#${userRank}` : "—"}
              </div>
              <div className="d2-stat-lbl">Your Ranking</div>
            </div>
            <div className="d2-stat-cell">
              <div className="d2-stat-num" style={{ color: "var(--d2-green)" }}>
                {userPoints.toLocaleString()}
              </div>
              <div className="d2-stat-lbl">Total Points</div>
            </div>
            <div className="d2-stat-cell">
              <div className="d2-stat-num" style={{ color: "var(--d2-green)" }}>{exactScores}</div>
              <div className="d2-stat-lbl">Exact Scores</div>
            </div>
            <div className="d2-stat-cell">
              <div className="d2-stat-num" style={{ color: "var(--d2-green)" }}>{correctWinners}</div>
              <div className="d2-stat-lbl">Correct Winners</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ─────────────────────────────────────────────── */}
      <div className="d2-card">
        <div className="d2-card-head">
          <span className="d2-card-icon" style={{ color: "var(--d2-green)" }}><IconZap /></span>
          <span className="d2-card-title">Quick Actions</span>
        </div>
        <div className="d2-actions-row">
          <Link href="/matches" className="d2-action">
            <span className="d2-action-icon"><IconMatchNav /></span>
            <div className="d2-action-text">
              <div className="d2-action-title">Matches</div>
              <div className="d2-action-sub">Make your predictions</div>
            </div>
            <span className="d2-action-arrow"><IconArrow /></span>
          </Link>
          <div className="d2-action-divider" />
          <Link href="/leaderboards" className="d2-action">
            <span className="d2-action-icon"><IconTrophy /></span>
            <div className="d2-action-text">
              <div className="d2-action-title">Leaderboard</div>
              <div className="d2-action-sub">See full rankings</div>
            </div>
            <span className="d2-action-arrow"><IconArrow /></span>
          </Link>
          <div className="d2-action-divider" />
          <Link href="/dashboard#account" className="d2-action">
            <span className="d2-action-icon"><IconPerson /></span>
            <div className="d2-action-text">
              <div className="d2-action-title">Account</div>
              <div className="d2-action-sub">Manage your details</div>
            </div>
            <span className="d2-action-arrow"><IconArrow /></span>
          </Link>
        </div>
      </div>

      {/* ── TIP ───────────────────────────────────────────────────────── */}
      <div className="d2-tip">
        <span className="d2-tip-icon"><IconGift /></span>
        <div>
          <div className="d2-tip-title">Tip</div>
          <div className="d2-tip-body">
            Make all your predictions before the match starts to earn maximum points!
            Exact score = 5 pts · Correct result + goal diff = 3 pts · Correct result = 2 pts.
          </div>
        </div>
      </div>

      {/* ── ACCOUNT SECTION ───────────────────────────────────────────── */}
      <div id="account" className="d2-row-2">
        <div className="d2-card">
          <div className="d2-card-head">
            <span className="d2-card-icon"><IconPerson /></span>
            <span className="d2-card-title">Your Profile</span>
          </div>
          <div className="d2-profile-body">
            <AvatarUpload
              currentUrl={avatarUrl}
              initials={initials(displayName)}
            />
            <div className="d2-profile-info">
              <div className="d2-profile-name">{displayName}</div>
              <div className="d2-profile-email">{user.email ?? ""}</div>
              {(centerName ?? activationCenter) && (
                <div className="d2-profile-center">🏟 {centerName ?? activationCenter}</div>
              )}
            </div>
          </div>
        </div>
        <div className="d2-card d2-center-card">
          <div className="d2-card-head">
            <span className="d2-card-icon"><IconTrophy /></span>
            <span className="d2-card-title">Your Center</span>
          </div>
          {hasCenter ? (
            <div className="d2-center-name">{centerName ?? activationCenter}</div>
          ) : (
            <p style={{ color: "var(--d2-text-secondary)", fontSize: 14 }}>
              Choose a GARRINCHA Center to represent before your first prediction.
            </p>
          )}
          {!hasCenter && (
            <CompetitionCenterSelect centers={centers} activationCenterName={activationCenter} locale={locale} />
          )}
        </div>
      </div>

      {/* ── FULL MATCH PREDICTIONS ────────────────────────────────────── */}
      <div className="d2-section">
        <div className="d2-section-head">
          <h2 className="d2-section-title">{t(locale, "dashboard.section")}</h2>
          <p className="d2-section-sub">⏱ {t(locale, "dashboard.lockNotice")}</p>
        </div>
        <MatchFilter matches={serializedMatches} locale={locale} nowISO={nowISO} />
      </div>
    </div>
    </>
  );
}
