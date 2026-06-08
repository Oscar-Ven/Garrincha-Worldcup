import { requirePlayerContext } from "@/lib/player-app";
import PrizeCards from "@/components/public/PrizeCards";

export const dynamic = "force-dynamic";

export default async function PlayerPrizesPage() {
  await requirePlayerContext();

  return (
    <div className="space-y-2">
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-lime-400 mb-1">
          GARRINCHA World Cup 2026
        </p>
        <h1 className="text-2xl font-bold text-white">Prizes</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Compete with players from your centre and across all centres.
        </p>
      </div>

      <PrizeCards />
    </div>
  );
}
