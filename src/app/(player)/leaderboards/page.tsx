import PrizeCards from "@/components/public/PrizeCards";
import { requirePlayerContext } from "@/lib/player-app";
import { getLeaderboard } from "@/lib/leaderboards";
import { resolveLeaderboardCenter } from "@/lib/product-logic";
import { prisma } from "@/lib/prisma";
import LeaderboardsClient from "./LeaderboardsClient";

export const dynamic = "force-dynamic";

export default async function PlayerLeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ center?: string }>;
}) {
  const { user } = await requirePlayerContext();
  const { center: centerParam } = await searchParams;

  const centers = await prisma.garrinchaCenter.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  // Resolve which center to show:
  // 1. URL param ?center=<id> (explicit user choice)
  // 2. Player's own competition center (default on first visit)
  // 3. null → show "Select a center" empty state
  const validIds = new Set(centers.map((c) => c.id));
  const selectedCenterId = resolveLeaderboardCenter(
    centerParam,
    user.competitionCenterId ?? null,
    validIds,
  );

  const [globalRows, centerRows] = await Promise.all([
    getLeaderboard({}, 200),
    selectedCenterId
      ? getLeaderboard({ competitionCenterId: selectedCenterId }, 200)
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-white/8 bg-white/3 p-5">
        <h1 className="text-[clamp(1.35rem,4vw,2rem)] font-semibold tracking-tight text-white">
          Leaderboards
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-300">
          Track your position in the full competition and inside any GARRINCHA center.
        </p>
      </section>

      <LeaderboardsClient
        globalRows={globalRows}
        centerRows={centerRows}
        centers={centers}
        selectedCenterId={selectedCenterId}
        currentUserId={user.id}
      />

      <PrizeCards preview prizesHref="/prizes" />
    </div>
  );
}
