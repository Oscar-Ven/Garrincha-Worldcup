import { requirePlayerContext } from "@/lib/player-app";
import { getPlayerDashboardData } from "@/lib/player-data";
import PredictionBoard from "@/components/player/PredictionBoard";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const { user } = await requirePlayerContext();
  const data = await getPlayerDashboardData(user);

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
        <h1 className="text-[clamp(1.35rem,4vw,2rem)] font-semibold tracking-tight text-white">Matches</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-300">Track upcoming kickoffs, locked fixtures, completed results, and your prediction status for every match.</p>
      </section>

      <PredictionBoard matches={data.allMatches} mode="matches" />
    </div>
  );
}