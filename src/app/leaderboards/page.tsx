import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { getLocale } from "@/lib/i18n";
import { getLeaderboardWithMeta } from "@/lib/leaderboards";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoCenters, demoLeaderboard, hasDatabaseConfig } from "@/lib/ui-demo-data";
import { LeaderboardClient } from "@/components/LeaderboardClient";

export const metadata = { title: "Leaderboards — GARRINCHA World Cup Pronostiek 2026" };

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

  const rows = (leaderboardMeta as { rows: { id: string; name: string; nationality: string; center: string; points: number }[] }).rows;

  return (
    <>
      <div className="lb-page">
        {/* ── Page header ── */}
        <div className="lb-page-header">
          <div className="lb-page-header-inner">
            <div className="kick" style={{ fontSize: 13, color: "var(--green)" }}>
              {t(locale, "leaderboard.eyebrow")}
            </div>
            <h1>{t(locale, "leaderboard.title")}</h1>
            <p style={{ fontSize: 16, color: "var(--ink-dim)", margin: "12px 0 0", maxWidth: 560, lineHeight: 1.55 }}>
              {t(locale, "leaderboard.copy")}
            </p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="lb-page-body">
          {/* Preview info */}
          {!hasDb && (
            <div className="preview-banner" style={{ marginBottom: 20 }}>
              <span>👁</span>
              <span className="preview-banner-text">
                Sample standings — preview only. Real data appears once matches are scored.
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
            /* Professional empty state */
            <div className="lb-empty">
              <div className="lb-empty-icon">📊</div>
              <h2 className="disp" style={{ fontSize: "clamp(1.6rem,4vw,2.8rem)", margin: "0 0 12px", color: "var(--ink)" }}>
                {t(locale, "leaderboard.noPlayers")}
              </h2>
              <p style={{ fontSize: 16, color: "var(--ink-dim)", maxWidth: 420, lineHeight: 1.6, margin: "0 0 8px" }}>
                {t(locale, "leaderboard.copy")}
              </p>
              <p style={{ fontSize: 14, color: "var(--ink-faint)", maxWidth: 400, lineHeight: 1.5, margin: "0 0 28px" }}>
                Rankings will appear here once the first World Cup matches are scored. Be the first to predict!
              </p>
              <Link href="/register" className="cta cta-green cta-md">
                {t(locale, "cta_register")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
