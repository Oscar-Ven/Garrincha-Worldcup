import { getLeaderboardWithMeta } from "@/lib/leaderboards";
import { hasDatabaseConfig } from "@/lib/app-mode";
import { demoLeaderboard } from "@/lib/ui-demo-data";
import { LeaderboardClient, type LbRow } from "@/components/LeaderboardClient";

// Revalidate every 60s — avoids recalculating all prediction sums on every request.
export const revalidate = 60;

export const metadata = {
  title: "World Cup 2026 Leaderboard — GARRINCHA",
  description: "Track the top players, points, predictions, and rankings. FIFA World Cup 2026 prediction campaign.",
};

export default async function LeaderboardsPage() {
  const hasDb = hasDatabaseConfig();

  const { rows: rawRows, total } = hasDb
    ? await getLeaderboardWithMeta().catch(() => ({ rows: [], total: 0, limited: false, limit: 200 }))
    : { rows: demoLeaderboard, total: demoLeaderboard.length };

  const rows: LbRow[] = (rawRows as {
    id: string; name: string; nationality: string; center: string; points: number; predictionCount?: number;
  }[]).map((r) => ({
    id: r.id,
    name: r.name ?? "Anonymous",
    nationality: r.nationality ?? "Unknown",
    center: r.center ?? "Center TBD",
    points: r.points ?? 0,
    predictionCount: r.predictionCount ?? 0,
  }));

  return (
    <div className="leaderboard-page">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="lb-page-header">
        <div className="lb-page-header-inner">
          <div className="lb-page-header-text">
            <h1 className="lb-page-title">Leaderboard</h1>
            <p className="lb-page-sub">FIFA World Cup 2026 — Track rankings, points and predictions.</p>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="lb-page-body">
        {!hasDb && (
          <div className="preview-banner">
            <span aria-hidden>👁</span>
            <span className="preview-banner-text">
              Preview mode — sample standings. Real rankings appear once World Cup matches are scored.
            </span>
          </div>
        )}

        <LeaderboardClient rows={rows} total={total} />
      </div>
    </div>
  );
}
