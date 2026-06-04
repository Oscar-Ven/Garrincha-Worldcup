import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CompetitionCenterSelect from "@/components/CompetitionCenterSelect";
import { DataModeNotice } from "@/components/DataModeNotice";
import { MatchFilter } from "@/components/MatchFilter";
import type { FilterableMatch } from "@/components/MatchFilter";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getLeaderboard } from "@/lib/leaderboards";
import { getMatchesForUser } from "@/lib/matches";
import { isPredictionLocked } from "@/lib/scoring";
import { t } from "@/lib/translations";
import { demoCenters, demoLeaderboard, demoMatches, demoUser, hasDatabaseConfig } from "@/lib/ui-demo-data";
import { prisma } from "@/lib/prisma";

function CenterShield({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  const short = name.replace("GARRINCHA ", "").slice(0, 3).toUpperCase();
  return (
    <div style={{ width: size, height: size * 1.1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 40 44" width={size} height={size * 1.1} style={{ position: "absolute", inset: 0 }}>
        <path d="M20 1 L38 7 V22 C38 33 30 40 20 43 C10 40 2 33 2 22 V7 Z" fill={color} fillOpacity="0.16" stroke={color} strokeWidth="1.6" />
      </svg>
      <span style={{ position: "relative", fontFamily: "var(--f-disp)", fontWeight: 900, fontStyle: "italic", fontSize: size * 0.34, color, letterSpacing: "-0.02em" }}>{short}</span>
    </div>
  );
}

function ProgressRing({ pct, made, total }: { pct: number; made: number; total: number }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div className="progress-ring-wrap">
      <svg width="68" height="68" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="34" cy="34" r={r} fill="none" stroke="var(--green)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: "stroke-dashoffset .6s" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="num" style={{ fontSize: 17, color: "var(--ink)" }}>{made}</span>
        <span style={{ fontSize: 9, color: "var(--ink-faint)" }}>/{total}</span>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const locale = await getLocale();
  const user = hasDatabaseConfig() ? await getCurrentUser() : demoUser;
  if (!user) redirect("/login?next=/dashboard");

  const isDemo = !hasDatabaseConfig();

  const [matches, leaderboard, centers] = isDemo
    ? [demoMatches, demoLeaderboard, demoCenters]
    : await Promise.all([
        getMatchesForUser(user.id),
        getLeaderboard(),
        prisma.garrinchaCenter.findMany({
          orderBy: [{ country: "asc" }, { city: "asc" }],
          select: { id: true, name: true, city: true, country: true },
        }),
      ]);

  const now = new Date();
  const nowISO = now.toISOString();

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

  const made = matches.filter((m) => (m.predictions?.length ?? 0) > 0).length;
  const total = matches.length;
  const pct = total > 0 ? Math.round((made / total) * 100) : 0;
  const lockedMatches = matches.filter((m) => isPredictionLocked(m.kickoffAt, now));
  const userRank = (leaderboard as { id: string; points: number }[]).findIndex((r) => r.id === user.id) + 1;
  const userPoints = (leaderboard as { id: string; points: number }[]).find((r) => r.id === user.id)?.points ?? 0;

  const hasCompetitionCenter = isDemo || !!user.competitionCenterId;
  const competitionCenterName = isDemo ? user.center.name : user.competitionCenter?.name ?? null;
  const competitionCenterLocked = isDemo ? false : !!user.competitionCenterLockedAt;
  const activationCenterName = user.center.name;

  const centerColor = "#5FE090"; // default; real impl could map center id to color

  const displayName = (user as { nickname?: string | null }).nickname ?? user.fullName ?? "Player";

  return (
    <div className="g-scroll" style={{ height: "100vh", overflowY: "auto", background: "var(--bg)" }}>
      {/* ── Greeting header ── */}
      <div className="dash-greeting">
        <div className="dash-greeting-row">
          <Image src="/garrincha-white.png" alt="GARRINCHA" height={18} width={108} style={{ height: 18, width: "auto" }} />
          <span className="chip chip-green" style={{ fontSize: 11 }}>📡 {t(locale, "auth.remoteAccess")}</span>
        </div>
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 13 }}>
          <div className="dash-avatar">{(displayName[0] ?? "P").toUpperCase()}</div>
          <div>
            <div style={{ fontSize: 13, color: "var(--ink-dim)" }}>{t(locale, "welcome")},</div>
            <div className="disp" style={{ fontSize: 26, color: "var(--ink)" }}>{displayName}</div>
          </div>
        </div>
      </div>

      <div className="dash-content">
        <DataModeNotice locale={locale} />

        {/* Remote access note */}
        <div className="dash-remote-note">
          <div className="dash-remote-icon">🔗</div>
          <div>
            <div className="dash-remote-title">{t(locale, "dashboard.activationNotice", { center: activationCenterName })} · {t(locale, "auth.remoteAccess")}</div>
            <div className="dash-remote-body">{t(locale, "dashboard.remoteAccess")}</div>
          </div>
        </div>

        {/* Competition center */}
        {!hasCompetitionCenter ? (
          <CompetitionCenterSelect
            centers={centers}
            activationCenterName={activationCenterName}
            locale={locale}
          />
        ) : (
          <div className="center-representing" style={{ background: `linear-gradient(110deg,${centerColor}1f,var(--surface))`, border: `1px solid ${centerColor}55` }}>
            <CenterShield name={competitionCenterName ?? activationCenterName} color={centerColor} size={44} />
            <div style={{ flex: 1 }}>
              <div className="label" style={{ fontSize: 9, color: centerColor }}>{t(locale, "dashboard.representing", { center: "" })}</div>
              <div className="disp" style={{ fontSize: 21, color: "var(--ink)" }}>{competitionCenterName ?? activationCenterName}</div>
            </div>
            {competitionCenterLocked && <span className="chip chip-locked">🔒</span>}
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: t(locale, "dashboard.totalPoints"), value: userPoints, accent: "var(--gold)" },
            { label: t(locale, "dashboard.globalRank"), value: userRank || "—", accent: "var(--ink)" },
            { label: t(locale, "dashboard.lockedMatches"), value: lockedMatches.length, accent: "var(--ink)" },
          ].map((s, i) => (
            <div key={i} className="card stat-tile">
              <div className="stat-tile-value" style={{ color: s.accent }}>{s.value}</div>
              <div className="stat-tile-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="card progress-card">
          <ProgressRing pct={pct} made={made} total={total} />
          <div style={{ flex: 1 }}>
            <div className="disp" style={{ fontSize: 18, color: "var(--ink)" }}>{t(locale, "dashboard.section")}</div>
            <div style={{ fontSize: 13, color: "var(--ink-dim)", marginTop: 2 }}>{made} / {total} {t(locale, "dashboard.myPredictions").toLowerCase()}</div>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <Link href="#predictions" className="btn btn-green" style={{ height: 40, fontSize: 14, textDecoration: "none" }}>
                {made === 0 ? t(locale, "prediction.submit") : t(locale, "leaders.viewAll")}
              </Link>
            </div>
          </div>
        </div>

        {/* Leaderboard quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Link href="/leaderboards" className="card link-card" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 22 }}>🌍</span>
            <div>
              <div className="disp" style={{ fontSize: 15, color: "var(--ink)" }}>{t(locale, "leaderboard.global")}</div>
              <div className="label" style={{ fontSize: 8, color: "var(--ink-faint)", marginTop: 2 }}>{t(locale, "leaderboard.title")}</div>
            </div>
          </Link>
          <Link href="/leaderboards" className="card link-card" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 22 }}>🏟</span>
            <div>
              <div className="disp" style={{ fontSize: 15, color: "var(--ink)" }}>{t(locale, "leaderboard.centers")}</div>
              <div className="label" style={{ fontSize: 8, color: "var(--ink-faint)", marginTop: 2 }}>{t(locale, "leaderboard.title")}</div>
            </div>
          </Link>
        </div>

        {/* Match filter with predictions */}
        <div id="predictions">
          <div className="section-title-row">
            <h2 className="section-title-text">{t(locale, "dashboard.section")}</h2>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-faint)", margin: "-8px 0 12px" }}>
            ⏱ {t(locale, "dashboard.lockNotice")}
          </p>
          <MatchFilter matches={serializedMatches} locale={locale} nowISO={nowISO} />
        </div>
      </div>
    </div>
  );
}
