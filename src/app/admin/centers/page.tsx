import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLeaderboardRows, LeaderboardInputUser } from "@/lib/product-logic";
import { Building, Trophy, MapPin, User } from "lucide-react";
import AddCenterButton from "./CentersClient";

export const dynamic = "force-dynamic";

export default async function CentersOverviewPage() {
  const admin = await getCurrentUser();
  if (!admin) {
    redirect("/dashboard/login");
  }

  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  if (!isOwner) {
    redirect("/admin");
  }

  const centers = await prisma.garrinchaCenter.findMany({
    select: { id: true, name: true, city: true, country: true },
    orderBy: { name: "asc" },
  });

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

  const centerSummaries = centers.map((center) => {
    const centerManagers = managers.filter((m) => m.centerId === center.id);
    const centerPlayers = allPlayers.filter((p) => p.competitionCenter?.name === center.name);
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Building className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Centers Directory</h1>
          </div>
          <p className="text-sm text-gray-500">
            Sports center locations, manager assignments, and top regional player rankings.
          </p>
        </div>
        <AddCenterButton />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {centerSummaries.map((ctr) => (
          <div key={ctr.id} className="bg-white border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            {/* Card header */}
            <div>
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    GARRINCHA {ctr.name}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {ctr.city}, {ctr.country}
                  </p>
                </div>
                <span className="bg-green-50 border border-green-200 text-green-700 font-semibold px-2.5 py-1 text-xs whitespace-nowrap shrink-0">
                  {ctr.playersCount} players
                </span>
              </div>

              {/* Managers */}
              <div className="mb-5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Assigned Managers ({ctr.managers.length})
                </span>
                {ctr.managers.length === 0 ? (
                  <span className="text-xs italic text-gray-400">
                    No managers assigned. Configure in Users page.
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ctr.managers.map((m) => (
                      <div key={m.id} className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-xs text-gray-700 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-900">{m.fullName}</span>
                        <span className="text-gray-400">@{m.nickname}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top competitors */}
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Trophy className="w-3.5 h-3.5 text-green-600" />
                  Top Center Competitors
                </span>
                {ctr.topPlayers.length === 0 ? (
                  <div className="text-xs italic text-gray-400 py-3 border border-dashed border-gray-200 text-center">
                    No leaderboard entries yet.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-200">
                    {ctr.topPlayers.map((row, i) => (
                      <div key={row.id} className="px-4 py-2.5 flex items-center justify-between text-sm hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className={`font-mono font-bold text-sm ${i === 0 ? "text-green-600" : "text-gray-400"}`}>
                            #{i + 1}
                          </span>
                          <span className="font-semibold text-gray-900">{row.name}</span>
                        </div>
                        <span className="font-bold text-green-700 font-mono">
                          {row.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-gray-400 border-t border-gray-100 mt-5 pt-3 font-mono">
              ID: {ctr.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

