import { Coins, Gift, Trophy } from "lucide-react";
import { requirePlayerContext } from "@/lib/player-app";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MyPointsPage() {
  const { user } = await requirePlayerContext();

  const [predictions, pointEvents] = await Promise.all([
    prisma.prediction.findMany({
      where: { userId: user.id },
      include: {
        match: {
          include: {
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
      },
      orderBy: { match: { kickoffAt: "desc" } },
    }),
    prisma.pointEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const predictionPoints = predictions.reduce((sum, prediction) => sum + prediction.pointsAwarded, 0);
  const bonusPoints = pointEvents.reduce((sum, event) => sum + event.points, 0);
  const attendancePoints = pointEvents
    .filter((event) => /attendance|check-?in/i.test(event.reason))
    .reduce((sum, event) => sum + event.points, 0);

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-white/8 bg-white/3 p-5">
        <h1 className="text-[clamp(1.35rem,4vw,2rem)] font-semibold tracking-tight text-white">My points</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-300">Your total combines scored predictions and point events such as manual bonus allocations.</p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total points", value: predictionPoints + bonusPoints, icon: Coins },
          { label: "Prediction points", value: predictionPoints, icon: Trophy },
          { label: "Bonus points", value: bonusPoints, icon: Gift },
          { label: "Attendance points", value: attendancePoints, icon: Coins },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-3xl border border-white/8 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500">{card.label}</span>
                <Icon className="h-4 w-4 text-lime-400" />
              </div>
              <div className="mt-3 text-2xl font-semibold text-white">{card.value}</div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[28px] border border-white/8 bg-black/20 p-5">
          <h2 className="text-base font-semibold text-white">Prediction history</h2>
          <div className="mt-4 space-y-3">
            {predictions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm text-zinc-400">No prediction history yet.</div>
            ) : (
              predictions.map((prediction) => (
                <div key={prediction.id} className="rounded-3xl border border-white/8 bg-white/3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{prediction.match.homeTeam.name} vs {prediction.match.awayTeam.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">Prediction {prediction.homeScore}-{prediction.awayScore}</div>
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-lime-300">{prediction.pointsAwarded} pts</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/8 bg-black/20 p-5">
          <h2 className="text-base font-semibold text-white">Point events</h2>
          <div className="mt-4 space-y-3">
            {pointEvents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm text-zinc-400">No point events yet.</div>
            ) : (
              pointEvents.map((event) => (
                <div key={event.id} className="rounded-3xl border border-white/8 bg-white/3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{event.reason}</div>
                      <div className="mt-1 text-xs text-zinc-500">{new Date(event.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-lime-300">{event.points > 0 ? `+${event.points}` : event.points}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}