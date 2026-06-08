import { Crown, MapPin, type LucideIcon } from "lucide-react";
import PrizeCards from "@/components/public/PrizeCards";
import { requirePlayerContext } from "@/lib/player-app";
import { getLeaderboard } from "@/lib/leaderboards";

export const dynamic = "force-dynamic";

type LeaderboardRow = {
  id: string;
  name: string;
  center: string;
  nationality: string;
  points: number;
  predictionCount: number;
};

function LeaderboardSection({
  title,
  rows,
  icon: Icon,
  currentUserId,
}: {
  title: string;
  rows: LeaderboardRow[];
  icon: LucideIcon;
  currentUserId: string;
}) {
  return (
    <section className="rounded-[28px] border border-white/8 bg-black/20 p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-lime-400" />
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm text-zinc-400">No ranked players yet.</div>
        ) : (
          rows.slice(0, 25).map((row, index) => {
            const active = row.id === currentUserId;
            return (
              <div key={row.id} className={`flex min-w-0 items-center justify-between gap-3 rounded-3xl border px-4 py-4 ${active ? "border-lime-400/40 bg-lime-400/10" : "border-white/8 bg-white/[0.03]"}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${active ? "bg-lime-400 text-zinc-950" : "bg-white/5 text-zinc-300"}`}>
                    #{index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{row.name}</div>
                    <div className="truncate text-xs text-zinc-500">{row.center.replace("GARRINCHA ", "")}</div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-lime-300">{row.points} pts</div>
                  <div className="text-xs text-zinc-500">{row.predictionCount} predictions</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default async function PlayerLeaderboardsPage() {
  const { user } = await requirePlayerContext();

  const [globalRows, centerRows] = await Promise.all([
    getLeaderboard({}, 200),
    user.competitionCenterId
      ? getLeaderboard({ competitionCenterId: user.competitionCenterId }, 200)
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
        <h1 className="text-[clamp(1.35rem,4vw,2rem)] font-semibold tracking-tight text-white">Leaderboards</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-300">Track your position in the full competition and inside your own GARRINCHA center.</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <LeaderboardSection title="Global leaderboard" rows={globalRows} icon={Crown} currentUserId={user.id} />
        <LeaderboardSection title="Center leaderboard" rows={centerRows} icon={MapPin} currentUserId={user.id} />
      </div>

      <PrizeCards preview prizesHref="/prizes" />
    </div>
  );
}