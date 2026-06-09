import Link from "next/link";
import { MapPin } from "lucide-react";
import { requirePlayerContext } from "@/lib/player-app";
import { getPlayerDashboardData } from "@/lib/player-data";
import PredictionBoard from "@/components/player/PredictionBoard";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const { user } = await requirePlayerContext();
  const data = await getPlayerDashboardData(user);

  const needsCenter = !user.competitionCenterId;

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
        <h1 className="text-[clamp(1.35rem,4vw,2rem)] font-semibold tracking-tight text-white">Predictions</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-300">Predict every score before kickoff. Predictions lock 5 minutes before kickoff and use the existing scoring engine.</p>
      </section>

      {needsCenter && (
        <div className="flex items-start gap-3 rounded-[20px] border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-sm text-amber-200">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <span>
            You haven&apos;t selected your competition center yet. Your first prediction will auto-assign your activation center.{" "}
            <Link href="/center" className="underline underline-offset-2 hover:text-white transition-colors">
              Change it on the Center page →
            </Link>
          </span>
        </div>
      )}

      <PredictionBoard matches={data.allMatches} mode="predictions" />
    </div>
  );
}