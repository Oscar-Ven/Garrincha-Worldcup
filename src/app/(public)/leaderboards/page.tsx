import { getLeaderboardWithMeta } from "@/lib/leaderboards";
import { hasDatabaseConfig } from "@/lib/app-mode";
import { demoLeaderboard } from "@/lib/ui-demo-data";

export const revalidate = 60;

export const metadata = {
  title: "World Cup 2026 Leaderboard — GARRINCHA",
  description: "Track top players, points, and rankings. FIFA World Cup 2026 prediction campaign.",
};

export default async function LeaderboardsPage() {
  const hasDb = hasDatabaseConfig();
  const { rows, total } = hasDb
    ? await getLeaderboardWithMeta().catch(() => ({ rows: [], total: 0, limited: false, limit: 200 }))
    : { rows: demoLeaderboard, total: demoLeaderboard.length };

  return (
    <main>
      <p>TODO: leaderboard page ({rows.length} / {total} players)</p>
    </main>
  );
}
