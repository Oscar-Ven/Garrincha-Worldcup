import { Trophy } from "lucide-react";
import CenterClient from "@/components/player/CenterClient";
import { requirePlayerContext } from "@/lib/player-app";
import { prisma } from "@/lib/prisma";
import { createLeaderboardRows } from "@/lib/product-logic";

export const dynamic = "force-dynamic";

export default async function CenterPage() {
  const { user } = await requirePlayerContext();

  const [centers, users] = await Promise.all([
    prisma.garrinchaCenter.findMany({
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "USER", competitionCenterId: { not: null } },
      select: {
        id: true,
        displayName: true,
        nickname: true,
        fullName: true,
        email: true,
        nationality: true,
        competitionCenter: { select: { name: true } },
        predictions: { select: { pointsAwarded: true } },
        pointEvents: { select: { points: true } },
      },
    }),
  ]);

  const centerRows = createLeaderboardRows(users).filter((row) => row.center === (user.competitionCenter?.name ?? ""));

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
        <h1 className="text-[clamp(1.35rem,4vw,2rem)] font-semibold tracking-tight text-white">Center</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-300">You activate at one GARRINCHA center and compete for one center in the rankings. Global and center leaderboards both use that competition-center assignment.</p>
      </section>

      <CenterClient
        currentCenterId={user.competitionCenterId ?? user.center.id}
        canChangeCenter={user.competitionCenterLockedAt === null}
        centers={centers}
      />

      <section className="rounded-[28px] border border-white/8 bg-black/20 p-5">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-lime-400" />
          <h2 className="text-base font-semibold text-white">Center leaderboard</h2>
        </div>
        <div className="mt-4 space-y-3">
          {centerRows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm text-zinc-400">No ranked players for this center yet.</div>
          ) : (
            centerRows.slice(0, 20).map((row, index) => (
              <div key={row.id} className={`flex min-w-0 items-center justify-between gap-3 rounded-3xl border px-4 py-4 ${row.id === user.id ? "border-lime-400/40 bg-lime-400/10" : "border-white/8 bg-white/[0.03]"}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-sm font-semibold text-zinc-300">#{index + 1}</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{row.name}</div>
                    <div className="truncate text-xs text-zinc-500">{row.nationality}</div>
                  </div>
                </div>
                <div className="shrink-0 text-sm font-semibold text-lime-300">{row.points} pts</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}