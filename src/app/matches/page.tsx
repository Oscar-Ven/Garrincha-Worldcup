import Link from "next/link";
import { getAllMatches } from "@/lib/matches";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { hasDatabaseConfig } from "@/lib/app-mode";
import { demoAllMatches } from "@/lib/ui-demo-data";
import { MatchFilter, type FilterableMatch } from "@/components/MatchFilter";

export const metadata = {
  title: "World Cup 2026 Matches — GARRINCHA",
  description: "Full FIFA World Cup 2026 match schedule. Group stage, Round of 32, knockout rounds. Predict scores and climb the leaderboard.",
};

export default async function MatchesPage() {
  const locale = await getLocale();
  const hasDb = hasDatabaseConfig();
  const nowISO = new Date().toISOString();

  // Fetch all 104 matches from DB or fall back to comprehensive demo data
  const rawMatches = hasDb
    ? await getAllMatches().catch(() => demoAllMatches)
    : demoAllMatches;

  // Serialize to FilterableMatch[] (ISO dates, no predictions for public view)
  const matches: FilterableMatch[] = rawMatches.map((m) => ({
    id: m.id,
    stage: m.stage,
    fifaMatchNo: m.fifaMatchNo ?? null,
    venue: m.venue,
    kickoffAt: m.kickoffAt instanceof Date ? m.kickoffAt.toISOString() : String(m.kickoffAt),
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    homeTeam: {
      id: m.homeTeam.id,
      name: m.homeTeam.name,
      fifaCode: m.homeTeam.fifaCode ?? null,
      flagUrl: m.homeTeam.flagUrl ?? null,
      groupName: m.homeTeam.groupName ?? null,
    },
    awayTeam: {
      id: m.awayTeam.id,
      name: m.awayTeam.name,
      fifaCode: m.awayTeam.fifaCode ?? null,
      flagUrl: m.awayTeam.flagUrl ?? null,
      groupName: m.awayTeam.groupName ?? null,
    },
    predictions: [], // public page — no user-specific predictions
  }));

  const totalMatches = matches.length;
  const groupMatches = matches.filter((m) => m.stage === "GROUP").length;
  const knockoutMatches = totalMatches - groupMatches;
  const finishedCount = matches.filter((m) => m.homeScore !== null).length;

  return (
    <div className="matches-page">
      {/* ── Page header ── */}
      <div className="matches-page-header">
        <div className="matches-page-header-inner">
          <div className="kick" style={{ fontSize: 13, color: "var(--green)", marginBottom: 6 }}>
            FIFA World Cup 2026 · Jun 11 – Jul 19
          </div>
          <h1 className="matches-page-title">Match Schedule</h1>
          <p className="matches-page-sub">
            {totalMatches} matches · {groupMatches} group stage · {knockoutMatches} knockout
            {finishedCount > 0 && ` · ${finishedCount} played`}
          </p>

          {/* Stats strip */}
          <div className="matches-stats-strip">
            {[
              { icon: "⚽", value: String(totalMatches), label: "Total matches" },
              { icon: "🏟", value: "12",                label: "Groups" },
              { icon: "🌍", value: "48",                label: "Nations" },
              { icon: "📅", value: "40 days",           label: "Tournament" },
            ].map((s) => (
              <div key={s.label} className="matches-stat">
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <span className="num" style={{ fontSize: 18, color: "var(--ink)" }}>{s.value}</span>
                <span className="matches-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="matches-page-body">
        {/* Preview banner in demo mode */}
        {!hasDb && (
          <div className="preview-banner" style={{ marginBottom: 16 }}>
            <span>👁</span>
            <span className="preview-banner-text">
              Preview mode — showing placeholder schedule.
              Kickoff times are UTC estimates; not yet confirmed official FIFA fixtures.
            </span>
          </div>
        )}

        {/* Scoring guide */}
        <div className="matches-scoring-strip">
          <span className="matches-scoring-label">How points work:</span>
          {[
            { pts: 5, label: "Exact score" },
            { pts: 3, label: "Result + goal diff" },
            { pts: 2, label: "Correct result" },
            { pts: 0, label: "Wrong" },
          ].map((s) => (
            <span key={s.pts} className="matches-scoring-item">
              <span className="num" style={{ color: s.pts === 5 ? "var(--gold)" : s.pts === 0 ? "var(--ink-faint)" : "var(--green)", fontSize: 14 }}>+{s.pts}</span>
              <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>{s.label}</span>
            </span>
          ))}
          <Link href="/register" className="cta cta-green cta-sm" style={{ marginLeft: "auto", display: "inline-flex" }}>
            {t(locale, "cta_register")}
          </Link>
        </div>

        {/* Match filter — read-only (no prediction forms) */}
        <MatchFilter
          matches={matches}
          locale={locale}
          nowISO={nowISO}
          readOnly
        />

        {/* Bottom CTA */}
        <div className="matches-bottom-cta">
          <div className="disp" style={{ fontSize: 24, color: "var(--ink)", marginBottom: 10 }}>
            Predict every match. Win for your center.
          </div>
          <p style={{ fontSize: 14, color: "var(--ink-dim)", marginBottom: 20, maxWidth: 440, lineHeight: 1.6 }}>
            Register for free at any GARRINCHA Center, submit your predictions before kickoff, and climb the leaderboard.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/register" className="cta cta-green cta-md">{t(locale, "cta_register")}</Link>
            <Link href="/login" className="cta cta-ghost cta-md">{t(locale, "register.requestLink")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
