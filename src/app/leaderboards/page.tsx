import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import { getLeaderboardWithMeta } from "@/lib/leaderboards";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoCenters, demoLeaderboard, hasDatabaseConfig } from "@/lib/ui-demo-data";
import { LeaderboardClient } from "@/components/LeaderboardClient";

export const metadata = {
  title: "Leaderboards — GARRINCHA World Cup Pronostiek 2026",
  description: "Track the top players globally and per GARRINCHA Center. FIFA World Cup 2026 prediction campaign.",
};

export default async function LeaderboardsPage() {
  const locale = await getLocale();
  const hasDb = hasDatabaseConfig();

  const [leaderboardMeta, centers] = hasDb
    ? await Promise.all([
        getLeaderboardWithMeta().catch(() => ({ rows: [], total: 0, limited: false, limit: 200 })),
        prisma.garrinchaCenter.findMany({ orderBy: { name: "asc" } }).catch(() => demoCenters),
      ])
    : [
        { rows: demoLeaderboard, total: demoLeaderboard.length, limited: false, limit: 200 },
        demoCenters,
      ];

  const rows = (leaderboardMeta as {
    rows: { id: string; name: string; nationality: string; center: string; points: number }[];
  }).rows;

  return (
    <div className="lb-page">
      {/* ── Page header ── */}
      <div className="lb-page-header">
        <div className="lb-page-header-inner">
          <div className="kick" style={{ fontSize: 13, color: "var(--green)" }}>
            {t(locale, "leaderboard.eyebrow")} · FIFA World Cup 2026
          </div>
          <h1>{t(locale, "leaderboard.title")}</h1>
          <p style={{ fontSize: 16, color: "var(--ink-dim)", margin: "12px 0 0", maxWidth: 580, lineHeight: 1.6 }}>
            {t(locale, "leaderboard.copy")}
          </p>
          {/* Campaign info strip */}
          <div style={{ display: "flex", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
            {[
              { icon: "⚽", label: "64 matches", sub: "Group + Knockout" },
              { icon: "🏟", label: "10 centers", sub: "Across Belgium" },
              { icon: "📅", label: "Jun 11 – Jul 19", sub: "World Cup 2026" },
              { icon: "🏆", label: "5 pts per exact score", sub: "Scoring system" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div>
                  <div className="num" style={{ fontSize: 14, color: "var(--ink)" }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="lb-page-body">
        {/* Preview info */}
        {!hasDb && (
          <div className="preview-banner" style={{ marginBottom: 20 }}>
            <span>👁</span>
            <span className="preview-banner-text">
              Sample standings — preview only. Real rankings appear once World Cup matches are scored.
            </span>
          </div>
        )}

        {/* Main content */}
        {rows.length > 0 ? (
          <LeaderboardClient
            rows={rows}
            centers={(centers as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name }))}
            locale={locale}
          />
        ) : (
          /* Empty state */
          <div className="lb-empty">
            <div className="lb-empty-icon">⚽</div>
            <h2 className="disp" style={{ fontSize: "clamp(1.6rem,4vw,2.8rem)", margin: "0 0 12px", color: "var(--ink)" }}>
              Tournament not started yet
            </h2>
            <p style={{ fontSize: 16, color: "var(--ink-dim)", maxWidth: 460, lineHeight: 1.6, margin: "0 0 8px" }}>
              The FIFA World Cup 2026 kicks off on June 11. Register now, predict every match, and climb the leaderboard.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 8, marginBottom: 28 }}>
              {[
                { pts: 5, label: "Exact score" },
                { pts: 3, label: "Correct result + goal diff" },
                { pts: 2, label: "Correct result" },
                { pts: 0, label: "Wrong prediction" },
              ].map((s) => (
                <div key={s.pts} style={{ padding: "8px 14px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", textAlign: "center" }}>
                  <div className="num" style={{ fontSize: 22, color: s.pts >= 3 ? "var(--gold)" : s.pts === 2 ? "var(--green)" : "var(--ink-faint)" }}>+{s.pts}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <Link href="/register" className="cta cta-green cta-md" style={{ display: "inline-flex" }}>
              {t(locale, "cta_register")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
