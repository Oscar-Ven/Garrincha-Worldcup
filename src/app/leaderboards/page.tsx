import { DataModeNotice } from "@/components/DataModeNotice";
import { getLocale } from "@/lib/i18n";
import { getLeaderboardWithMeta } from "@/lib/leaderboards";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoCenters, demoLeaderboard, hasDatabaseConfig } from "@/lib/ui-demo-data";
import { LeaderboardTabs } from "@/components/LeaderboardTabs";

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
    <div className="g-scroll" style={{ height: "100vh", overflowY: "auto", background: "var(--bg)" }}>
      {/* screen header */}
      <div className="screen-header">
        <div className="screen-header-row">
          <div>
            <h1 className="screen-header-title">{t(locale, "leaderboard.title")}</h1>
          </div>
        </div>
      </div>

      <div style={{ padding: "4px 18px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
        <DataModeNotice locale={locale} />

        {!hasDb && (
          <div className="preview-banner">
            <span style={{ fontSize: 13 }}>👁</span>
            <span className="preview-banner-text">
              Sample standings — preview only. The live app shows real data once matches are scored.
            </span>
          </div>
        )}

        <LeaderboardTabs
          rows={rows}
          centers={(centers as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name }))}
          locale={locale}
        />
      </div>
    </div>
  );
}
