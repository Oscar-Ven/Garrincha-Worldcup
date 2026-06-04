import Link from "next/link";
import { DataModeNotice } from "@/components/DataModeNotice";
import { getLocale } from "@/lib/i18n";
import { getLeaderboardWithMeta } from "@/lib/leaderboards";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoCenters, demoLeaderboard, hasDatabaseConfig } from "@/lib/ui-demo-data";
import { LeaderboardTabs } from "@/components/LeaderboardTabs";

export const metadata = { title: "Leaderboards — GARRINCHA World Cup Pronostiek" };

export default async function LeaderboardsPage() {
  const locale = await getLocale();
  const hasDb = hasDatabaseConfig();

  const [leaderboardMeta, centers] = hasDb
    ? await Promise.all([
        getLeaderboardWithMeta(),
        prisma.garrinchaCenter.findMany({ orderBy: { name: "asc" } }),
      ])
    : [
        { rows: demoLeaderboard, total: demoLeaderboard.length, limited: false, limit: 200 },
        demoCenters,
      ];

  const rows = (leaderboardMeta as { rows: { id: string; name: string; nationality: string; center: string; points: number }[] }).rows;

  return (
    <div className="lb-page">
      {/* Page header */}
      <div className="lb-page-header">
        <div className="lb-page-header-inner">
          <div className="kick" style={{ fontSize: 13, color: "var(--green)" }}>
            {t(locale, "leaderboard.eyebrow")}
          </div>
          <h1>{t(locale, "leaderboard.title")}</h1>
          <p style={{ fontSize: 15, color: "var(--ink-dim)", margin: "10px 0 0", maxWidth: 560, lineHeight: 1.55 }}>
            {t(locale, "leaderboard.copy")}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="lb-page-body">
        <DataModeNotice locale={locale} />

        {!hasDb && (
          <div className="preview-banner" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 13 }}>👁</span>
            <span className="preview-banner-text">
              Sample standings — preview only. Real data shows once matches are scored.
            </span>
          </div>
        )}

        <LeaderboardTabs
          rows={rows}
          centers={(centers as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name }))}
          locale={locale}
        />

        {/* No-data empty state */}
        {rows.length === 0 && hasDb && (
          <div className="empty-state" style={{ padding: "60px 20px", textAlign: "center" }}>
            <div className="empty-state-icon">📊</div>
            <h3 className="empty-state-title">{t(locale, "leaderboard.noPlayers")}</h3>
            <p className="empty-state-body">{t(locale, "leaderboard.copy")}</p>
            <Link href="/register" className="btn btn-green btn-auto" style={{ marginTop: 20, textDecoration: "none" }}>
              {t(locale, "cta_register")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
