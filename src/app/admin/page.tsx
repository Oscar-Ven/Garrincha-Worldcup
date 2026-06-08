import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLeaderboardRows, LeaderboardInputUser } from "@/lib/product-logic";
import {
  Users,
  Layers,
  Coins,
  QrCode,
  Shield,
  Activity,
  ArrowRight,
  TrendingUp,
  MapPin,
  ClipboardList,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const isOwner = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const isManager = user.role === "CENTER_ADMIN";

  if (!isOwner && !isManager) {
    redirect("/");
  }

  // ---------------------------------------------------------------------------
  // 1. OWNER PORTAL METRICS (SUPER_ADMIN / ADMIN)
  // ---------------------------------------------------------------------------
  if (isOwner) {
    // Fetch statistics
    const [
      totalPlayers,
      totalManagers,
      totalCenters,
      totalMatches,
      totalPredictions,
      totalCheckins,
      bonusAwardedAggr,
      centers,
      recentLogs,
      leaderboardUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "CENTER_ADMIN" } }),
      prisma.garrinchaCenter.count(),
      prisma.match.count(),
      prisma.prediction.count(),
      prisma.centerCheckIn.count(),
      prisma.pointEvent.aggregate({
        where: { matchId: null },
        _sum: { points: true },
      }),
      prisma.garrinchaCenter.findMany({
        select: {
          id: true,
          name: true,
          city: true,
          competingUsers: { select: { id: true } },
          sessions: {
            where: { expiresAt: { gt: new Date() } },
            select: { code: true, expiresAt: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.centerChangeLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { fullName: true, nickname: true } },
        },
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
      }) as unknown as Promise<LeaderboardInputUser[]>,
    ]);

    const bonusPointsAwarded = bonusAwardedAggr._sum.points ?? 0;

    // Format global leaderboard
    const globalLeaderboard = createLeaderboardRows(leaderboardUsers, 5);

    // Center summary formatting
    const centerSummaries = centers.map((ctr) => ({
      id: ctr.id,
      name: ctr.name.replace("GARRINCHA ", ""),
      city: ctr.city,
      playersCount: ctr.competingUsers.length,
      activeCode: ctr.sessions[0]?.code ?? null,
    }));

    return (
      <div className="space-y-10">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">
              Owner Command Center
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Global system overview, analytical feeds, and management interfaces.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-400">
            Node status: <span className="text-lime-400 font-bold">ONLINE</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Players */}
          <div className="border border-zinc-800 bg-zinc-900/40 p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white tracking-tight">{totalPlayers}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">
                Active Players
              </div>
            </div>
          </div>

          {/* Active Managers */}
          <div className="border border-zinc-800 bg-zinc-900/40 p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white tracking-tight">{totalManagers}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">
                Active Managers
              </div>
            </div>
          </div>

          {/* Total Centers */}
          <div className="border border-zinc-800 bg-zinc-900/40 p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white tracking-tight">{totalCenters}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">
                Total Centers
              </div>
            </div>
          </div>

          {/* Total Matches */}
          <div className="border border-zinc-800 bg-zinc-900/40 p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white tracking-tight">{totalMatches}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">
                Total Matches
              </div>
            </div>
          </div>

          {/* Predictions Count */}
          <div className="border border-zinc-800 bg-zinc-900/40 p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white tracking-tight">{totalPredictions}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">
                Predictions Count
              </div>
            </div>
          </div>

          {/* Check-ins Count */}
          <div className="border border-zinc-800 bg-zinc-900/40 p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white tracking-tight">{totalCheckins}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">
                Check-ins Count
              </div>
            </div>
          </div>

          {/* Bonus Points Awarded */}
          <div className="border border-zinc-800 bg-zinc-900/40 p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white tracking-tight">{bonusPointsAwarded} pts</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">
                Bonus Points Awarded
              </div>
            </div>
          </div>
        </div>

        {/* Mid layout blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Center Perf (2/3 cols) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="border border-zinc-800 bg-zinc-900/10">
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
                <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-lime-400" />
                  Center Performance Overview
                </h2>
                <Link
                  href="/admin/users"
                  className="text-[10px] text-lime-400 hover:text-white uppercase font-bold flex items-center gap-1 transition-colors"
                >
                  Manage Users <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950/20">
                      <th className="px-6 py-3">Sports Center</th>
                      <th className="px-6 py-3 text-center">Registrations</th>
                      <th className="px-6 py-3 text-center">Active Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centerSummaries.map((ctr) => (
                      <tr key={ctr.id} className="border-b border-zinc-800 hover:bg-zinc-900/30 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-white uppercase">{ctr.name}</div>
                          <div className="text-[10px] text-zinc-500">{ctr.city}, Belgium</div>
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold text-zinc-300">
                          {ctr.playersCount} players
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          {ctr.activeCode ? (
                            <span className="font-mono bg-lime-400/10 border border-lime-400/20 text-lime-400 px-2.5 py-1 text-[11px] font-black">
                              {ctr.activeCode}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-8">
            {/* Top Leaderboard */}
            <div className="border border-zinc-800 bg-zinc-900/10">
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30">
                <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-lime-400" />
                  Top Global Competitors
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {globalLeaderboard.length === 0 ? (
                  <p className="text-zinc-500 text-center text-xs py-6">No players locked in yet.</p>
                ) : (
                  globalLeaderboard.map((row, i) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between p-3 border border-zinc-800/40 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-black text-sm italic ${i === 0 ? "text-lime-400" : "text-zinc-500"}`}>
                          #{i + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white">{row.name}</div>
                          <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-tight">
                            {row.center.replace("GARRINCHA ", "")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-lime-400 tabular-nums">{row.points} pts</div>
                        <div className="text-[8px] text-zinc-500 uppercase font-black">{row.predictionCount} preds</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Change logs */}
            <div className="border border-zinc-800 bg-zinc-900/10">
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30">
                <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-lime-400" />
                  Registry Audit Trail
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {recentLogs.length === 0 ? (
                  <p className="text-zinc-500 text-center text-xs py-4">No recent manual changes logged.</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="text-xs border-b border-zinc-800/60 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1 text-[10px]">
                        <span className="font-bold text-white uppercase">Center Correction</span>
                        <span className="text-zinc-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Player <strong className="text-zinc-300">{log.user?.nickname ?? log.user?.fullName}</strong> shifted.
                      </p>
                      <div className="text-[9px] text-zinc-500 mt-1 uppercase font-semibold">
                        Authorized: {log.changedBy}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. MANAGER PORTAL METRICS (CENTER_ADMIN)
  // ---------------------------------------------------------------------------
  const centerId = user.center?.id;
  if (!centerId) {
    return (
      <div className="border border-red-900/50 bg-red-900/5 p-8 text-center max-w-lg mx-auto">
        <Shield className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h1 className="text-lg font-black text-white uppercase tracking-tight mb-2">
          Center Mapping Deficiency
        </h1>
        <p className="text-sm text-zinc-400">
          Your Manager account has not been bound correctly to a GARRINCHA center. Please contact the focal system administrator.
        </p>
      </div>
    );
  }

  // Stats for the active manager
  const [
    centerPlayersCount,
    managerCheckinsCount,
    activeSession,
    scopedUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { competitionCenterId: centerId, role: "USER" } }),
    prisma.centerCheckIn.count({ where: { centerId } }),
    prisma.centerSession.findFirst({
      where: { centerId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "USER", competitionCenterId: centerId },
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
    }) as unknown as Promise<LeaderboardInputUser[]>,
  ]);

  const centerLeaderboard = createLeaderboardRows(scopedUsers, 8);

  return (
    <div className="space-y-10">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Control Panel // {user.center?.name}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Center performance index, check-in operations, and competitor directory.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-lime-400/10 border border-lime-400/20 rounded-sm">
          <MapPin className="w-3.5 h-3.5 text-lime-400" />
          <span className="text-lime-400 text-xs font-black uppercase tracking-wider">
            {user.center?.city} Node
          </span>
        </div>
      </div>

      {/* KPI Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border border-zinc-800 bg-zinc-900/40 p-6 flex items-start gap-4">
          <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">{centerPlayersCount}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">
              Registered Center Players
            </div>
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/40 p-6 flex items-start gap-4">
          <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">{managerCheckinsCount}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">
              Center Attendance Logged
            </div>
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/40 p-6 flex items-start gap-4">
          <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-mono text-lg font-black text-white">
              {activeSession ? (
                <span className="text-lime-400 tracking-widest">{activeSession.code}</span>
              ) : (
                <span className="text-zinc-500 text-sm">NO ACTIVE CODE</span>
              )}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1.5 flex items-center gap-1">
              Check-In Code
              <Link href="/admin/checkin" className="text-lime-400 hover:underline inline-block ml-1">
                [edit]
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scoped Center Leaderboard */}
        <div className="lg:col-span-2 border border-zinc-800 bg-zinc-900/10">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
            <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-lime-400" />
              Regional Leaderboard Rankings
            </h2>
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
              Live Feed
            </span>
          </div>
          <div className="p-6">
            {centerLeaderboard.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-xs">No registered players active in this center yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                      <th className="py-2 w-10">Rank</th>
                      <th className="py-2 px-4">Player</th>
                      <th className="py-2 text-center w-24">Predictions</th>
                      <th className="py-2 text-right w-24">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centerLeaderboard.map((row, i) => (
                      <tr key={row.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/20 transition-colors">
                        <td className="py-3 font-mono font-black italic text-zinc-400">
                          #{i + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-white text-sm">{row.name}</span>
                          <span className="text-[10px] text-zinc-500 block">{row.nationality}</span>
                        </td>
                        <td className="py-3 text-center font-bold text-zinc-300">
                          {row.predictionCount}
                        </td>
                        <td className="py-3 text-right font-black text-lime-400 text-sm">
                          {row.points} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Manager Actions / Guides Sidebar */}
        <div className="border border-zinc-800 bg-zinc-900/10 p-6 space-y-6">
          <h2 className="text-xs font-black text-white uppercase tracking-widest border-b border-zinc-800 pb-3">
            Quick Actions Checklist
          </h2>

          <div className="space-y-4">
            <Link
              href="/admin/checkin"
              className="flex items-center gap-3 p-3.5 border border-zinc-800 hover:border-lime-400/30 hover:bg-zinc-900/40 transition-all text-xs group"
            >
              <QrCode className="w-4.5 h-4.5 text-lime-400 group-hover:scale-110 transition-transform" />
              <div className="flex-1">
                <div className="font-bold text-white uppercase">Generate Code</div>
                <div className="text-[10px] text-zinc-500">Allow players to verify attendance</div>
              </div>
            </Link>

            <Link
              href="/admin/bonus"
              className="flex items-center gap-3 p-3.5 border border-zinc-800 hover:border-lime-400/30 hover:bg-zinc-900/40 transition-all text-xs group"
            >
              <Coins className="w-4.5 h-4.5 text-lime-400 group-hover:scale-110 transition-transform" />
              <div className="flex-1">
                <div className="font-bold text-white uppercase">Award Bonus Points</div>
                <div className="text-[10px] text-zinc-500">Credit points to deserving players</div>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-3.5 border border-zinc-800 hover:border-lime-400/30 hover:bg-zinc-900/40 transition-all text-xs group"
            >
              <Users className="w-4.5 h-4.5 text-lime-400 group-hover:scale-110 transition-transform" />
              <div className="flex-1">
                <div className="font-bold text-white uppercase">Players List</div>
                <div className="text-[10px] text-zinc-500">Inspect registered users directory</div>
              </div>
            </Link>
          </div>

          <div className="p-4 border border-zinc-800 bg-zinc-950/40 text-[11px] text-zinc-500 leading-relaxed space-y-2">
            <div className="font-bold text-zinc-400 uppercase text-[10px]">Manager Constraints:</div>
            <p>1. You can only view and query data pertaining to <strong>{user.center?.name}</strong>.</p>
            <p>2. You cannot administer other locations, delete users, modify global values, or access health checks.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
