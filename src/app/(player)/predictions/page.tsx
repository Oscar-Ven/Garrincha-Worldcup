import { requirePlayerContext } from "@/lib/player-app";
import { getPlayerDashboardData } from "@/lib/player-data";
import PredictionBoard from "@/components/player/PredictionBoard";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const { user } = await requirePlayerContext();
  const data = await getPlayerDashboardData(user);

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
        <h1 className="text-[clamp(1.35rem,4vw,2rem)] font-semibold tracking-tight text-white">Predictions</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-300">Predict every score before kickoff. Predictions lock 5 minutes before kickoff and use the existing scoring engine.</p>
      </section>

      <PredictionBoard matches={data.allMatches} mode="predictions" />
    </div>
  );
}