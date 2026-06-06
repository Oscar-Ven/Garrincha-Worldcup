import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLeaderboardRows, LeaderboardInputUser } from "@/lib/product-logic";
import { Building, Trophy, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CentersOverviewPage() {
  const admin = await getCurrentUser();
  if (!admin) {
    redirect("/admin/login");
  }

  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  if (!isOwner) {
    redirect("/admin");
  }

  // Fetch centers list with relation counts
  const centers = await prisma.garrinchaCenter.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
    },
    orderBy: { name: "asc" },
  });

  // Fetch all players to group and calculate center leaderboard sub-rows
  const allPlayers = await prisma.user.findMany({
    where: { role: "USER", competitionCenterId: { not: null } },
    select: {
      id: true,
      displayName: true,
      nickname: true,
      fullName: true,
      email: true,
      nationality: true,
      competitionCenterId: true,
      competitionCenter: { select: { name: true } },
      predictions: { select: { pointsAwarded: true } },
      pointEvents: { select: { points: true } },
    },
  }) as unknown as LeaderboardInputUser[];

  // Fetch all managers (CENTER_ADMINs) to map them to centers
  const managers = await prisma.user.findMany({
    where: { role: "CENTER_ADMIN" },
    select: {
      id: true,
      fullName: true,
      nickname: true,
      email: true,
      centerId: true,
    },
  });

  // Process centers data with subcategories
  const centerSummaries = centers.map((center) => {
    // Managers for this center
    const centerManagers = managers.filter((m) => m.centerId === center.id);

    // Players in this center
    const centerPlayers = allPlayers.filter((p) => p.competitionCenter?.name === center.name);

    // Generate leaderboard for this center and take top 3
    const centerLeaderboard = createLeaderboardRows(centerPlayers, 3);

    return {
      id: center.id,
      name: center.name.replace("GARRINCHA ", ""),
      city: center.city,
      country: center.country,
      playersCount: centerPlayers.length,
      managers: centerManagers.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        nickname: m.nickname,
        email: m.email,
      })),
      topPlayers: centerLeaderboard,
    };
  });

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Building className="w-8 h-8 text-lime-400" />
          Centers Directory
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Detailed sports location nodes mapping, active manager assignments, and top-tier local player rankings.
        </p>
      </div>

      {/* Grid of centers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {centerSummaries.map((ctr) => (
          <div key={ctr.id} className="border border-zinc-800 bg-zinc-900/10 p-6 flex flex-col justify-between hover:border-zinc-700/60 transition-all">
            {/* Header info */}
            <div>
              <div className="flex items-start justify-between gap-4 border-b border-zinc-850 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    GARRINCHA {ctr.name}
                  </h3>
                  <p className="text-xs text-zinc-550 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-650" />
                    {ctr.city}, {ctr.country}
                  </p>
                </div>
                <div className="bg-lime-400/10 border border-lime-400/20 text-lime-400 font-bold px-2.5 py-1 text-xs select-none">
                  {ctr.playersCount} Players registered
                </div>
              </div>

              {/* Managers section */}
              <div className="mb-6 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                  Assigned Center Managers ({ctr.managers.length})
                </span>
                {ctr.managers.length === 0 ? (
                  <span className="text-xs italic text-zinc-650 block">No managers assigned currently. Configure in Users page.</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ctr.managers.map((m) => (
                      <div key={m.id} className="px-2.5 py-1 bg-zinc-950 border border-zinc-805 text-xs text-zinc-300">
                        <strong className="text-white uppercase font-bold">{m.fullName}</strong> (@{m.nickname})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leaderboard summary section */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-lime-400" />
                  Top Center Competitors
                </span>
                {ctr.topPlayers.length === 0 ? (
                  <span className="text-xs italic text-zinc-605 block py-1 border border-dashed border-zinc-850 text-center">No leaderboard entries available.</span>
                ) : (
                  <div className="divide-y divide-zinc-900 border border-zinc-805 bg-zinc-950/20">
                    {ctr.topPlayers.map((row, i) => (
                      <div key={row.id} className="p-3 flex items-center justify-between text-xs hover:bg-zinc-900/10 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-black ${i === 0 ? "text-lime-400" : "text-zinc-500"}`}>
                            #{i + 1}
                          </span>
                          <span className="text-white font-bold">{row.name}</span>
                        </div>
                        <span className="font-black text-lime-400 font-mono tracking-wider">
                          {row.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-zinc-550 border-t border-zinc-850 mt-6 pt-3 uppercase">
              Location token identifier: <code className="text-zinc-400">{ctr.id}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}