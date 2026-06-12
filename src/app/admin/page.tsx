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
  Wifi,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/dashboard/login");
  }

  const isOwner = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const isManager = user.role === "CENTER_ADMIN";

  if (!isOwner && !isManager) {
    redirect("/");
  }

  // ---------------------------------------------------------------------------
  // OWNER PORTAL
  // ---------------------------------------------------------------------------
  if (isOwner) {
    const [
      totalPlayers,
      totalManagers,
      totalCenters,
      totalMatches,
      totalPredictions,
      totalCheckins,
      bonusAwardedAggr,
      activeSessions,
      centers,
      recentLogs,
      leaderboardUsers,
      invitationJobStats,
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
      prisma.user.count({
        where: { role: "USER", accessTokenHash: { not: null }, accessTokenRevokedAt: null },
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
      prisma.invitationJob.groupBy({ by: ["status"], _count: { id: true } }),
    ]);

    const bonusPointsAwarded = bonusAwardedAggr._sum.points ?? 0;
    const globalLeaderboard = createLeaderboardRows(leaderboardUsers, 5);

    const invJobs = {
      pending: invitationJobStats.find((g) => g.status === "pending")?._count.id ?? 0,
      processing: invitationJobStats.find((g) => g.status === "processing")?._count.id ?? 0,
      sent: invitationJobStats.find((g) => g.status === "sent")?._count.id ?? 0,
      failed: invitationJobStats.find((g) => g.status === "failed")?._count.id ?? 0,
      skipped: invitationJobStats.find((g) => g.status === "skipped_unsubscribed")?._count.id ?? 0,
    };
    const totalInvited = Object.values(invJobs).reduce((a, b) => a + b, 0);
    const centerSummaries = centers.map((ctr) => ({
      id: ctr.id,
      name: ctr.name.replace("GARRINCHA ", ""),
      city: ctr.city,
      playersCount: ctr.competingUsers.length,
      activeCode: ctr.sessions[0]?.code ?? null,
    }));

    const kpis = [
      { icon: Users, label: "Active Players", value: String(totalPlayers) },
      { icon: Wifi, label: "Live Sessions", value: String(activeSessions), highlight: true },
      { icon: Layers, label: "Active Managers", value: String(totalManagers) },
      { icon: MapPin, label: "Total Centers", value: String(totalCenters) },
      { icon: Activity, label: "Total Matches", value: String(totalMatches) },
      { icon: ClipboardList, label: "Predictions", value: String(totalPredictions) },
      { icon: QrCode, label: "Check-ins", value: String(totalCheckins) },
      { icon: Coins, label: "Bonus Points Awarded", value: `${bonusPointsAwarded} pts` },
    ];

    return (
      <div className="space-y-8 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Global system overview, analytics, and management interfaces.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 border border-green-200 bg-green-50 text-xs font-semibold text-green-700">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
            System Online
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {kpis.map(({ icon: Icon, label, value, highlight }) => (
            <div
              key={label}
              className={`border shadow-sm p-5 flex flex-col gap-3 ${
                highlight
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className={`w-9 h-9 border flex items-center justify-center shrink-0 ${
                highlight ? "bg-green-100 border-green-200" : "bg-green-50 border-green-100"
              }`}>
                <Icon className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold text-gray-900 tracking-tight">{value}</span>
                  {highlight && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-gray-500 font-medium mt-0.5 leading-tight">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Invitation pipeline — only rendered when import has been run */}
        {totalInvited > 0 && (
          <div className="bg-white border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                Invitation Pipeline
              </h2>
              <Link
                href="/admin/import"
                className="text-xs text-green-600 hover:text-green-800 font-semibold flex items-center gap-1 transition-colors"
              >
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Invited", value: totalInvited, color: "text-gray-900" },
                { label: "Pending", value: invJobs.pending, color: "text-amber-600" },
                { label: "Processing", value: invJobs.processing, color: "text-blue-600" },
                { label: "Sent", value: invJobs.sent, color: "text-green-700" },
                { label: "Failed", value: invJobs.failed, color: "text-red-600" },
                { label: "Unsubscribed", value: invJobs.skipped, color: "text-gray-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <div className={`text-2xl font-bold tabular-nums ${color}`}>
                    {value.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium mt-0.5">{label}</div>
                </div>
              ))}
            </div>
            {invJobs.pending > 0 && (
              <div className="px-6 pb-4">
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
                  {invJobs.pending.toLocaleString()} invitations pending — Vercel Cron sends up to 500 every 5 min automatically.
                </p>
              </div>
            )}
            {invJobs.sent === totalInvited && totalInvited > 0 && (
              <div className="px-6 pb-4">
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2">
                  All {totalInvited.toLocaleString()} invitations sent.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Center performance table (2/3) */}
          <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                Center Performance Overview
              </h2>
              <Link
                href="/admin/users"
                className="text-xs text-green-600 hover:text-green-800 font-semibold flex items-center gap-1 transition-colors"
              >
                Manage Users <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3">Sports Center</th>
                    <th className="px-6 py-3 text-center">Registrations</th>
                    <th className="px-6 py-3 text-center">Active Code</th>
                  </tr>
                </thead>
                <tbody>
                  {centerSummaries.map((ctr) => (
                    <tr key={ctr.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-gray-900">{ctr.name}</div>
                        <div className="text-xs text-gray-500">{ctr.city}, Belgium</div>
                      </td>
                      <td className="px-6 py-3.5 text-center font-medium text-gray-700">
                        {ctr.playersCount} players
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {ctr.activeCode ? (
                          <span className="font-mono bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 text-xs font-bold">
                            {ctr.activeCode}
                          </span>
                        ) : (
                          <span className="text-gray-300">{"—"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Top leaderboard */}
            <div className="bg-white border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Top Global Competitors
                </h2>
              </div>
              <div className="p-4 space-y-2">
                {globalLeaderboard.length === 0 ? (
                  <p className="text-gray-400 text-center text-xs py-6">No players locked in yet.</p>
                ) : (
                  globalLeaderboard.map((row, i) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between p-3 border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-sm ${i === 0 ? "text-green-600" : "text-gray-400"}`}>
                          #{i + 1}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{row.name}</div>
                          <div className="text-xs text-gray-500">
                            {row.center.replace("GARRINCHA ", "")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-700 tabular-nums">{row.points} pts</div>
                        <div className="text-xs text-gray-400">{row.predictionCount} preds</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Change logs */}
            <div className="bg-white border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  Registry Audit Trail
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {recentLogs.length === 0 ? (
                  <p className="text-gray-400 text-center text-xs py-4">No recent manual changes logged.</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="text-xs border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-700">Center Correction</span>
                        <span className="text-gray-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        Player <strong className="text-gray-800">{log.user?.nickname ?? log.user?.fullName}</strong> shifted.
                      </p>
                      <div className="text-xs text-gray-400 mt-0.5">
                        By: {log.changedBy}
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
  // MANAGER PORTAL
  // ---------------------------------------------------------------------------
  const centerId = user.center?.id;
  if (!centerId) {
    return (
      <div className="bg-red-50 border border-red-200 p-8 text-center max-w-lg mx-auto">
        <Shield className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h1 className="text-lg font-bold text-gray-900 mb-2">Center Not Assigned</h1>
        <p className="text-sm text-gray-600">
          Your manager account is not linked to a GARRINCHA center. Please contact the system administrator.
        </p>
      </div>
    );
  }

  const [centerPlayersCount, managerCheckinsCount, activeSession, scopedUsers] = await Promise.all([
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
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.center?.name?.replace("GARRINCHA ", "")} Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Center performance, check-in operations, and competitor directory.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200">
          <MapPin className="w-3.5 h-3.5 text-green-600" />
          <span className="text-green-700 text-xs font-semibold">{user.center?.city}</span>
        </div>
      </div>

      {/* Manager KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 shadow-sm p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{centerPlayersCount}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">Registered Players</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{managerCheckinsCount}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">Attendance Logged</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            {activeSession ? (
              <div className="font-mono text-xl font-bold text-green-700 tracking-widest">
                {activeSession.code}
              </div>
            ) : (
              <div className="text-sm text-gray-400 font-medium">No active code</div>
            )}
            <div className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
              Check-In Code
              <Link href="/admin/checkin" className="text-green-600 hover:underline ml-1 text-xs">
                [edit]
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Center leaderboard */}
        <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Regional Leaderboard
            </h2>
            <span className="text-xs text-gray-400 font-medium">Live</span>
          </div>
          <div className="p-6">
            {centerLeaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No registered players active in this center yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 w-10">Rank</th>
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 text-center w-24">Predictions</th>
                      <th className="py-3 text-right w-24">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centerLeaderboard.map((row, i) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 font-mono font-bold text-gray-400">#{i + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900">{row.name}</span>
                          <span className="text-xs text-gray-500 block">{row.nationality}</span>
                        </td>
                        <td className="py-3 text-center font-medium text-gray-600">{row.predictionCount}</td>
                        <td className="py-3 text-right font-bold text-green-700">{row.points} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Quick Actions
          </h2>

          <div className="space-y-3">
            <Link
              href="/admin/checkin"
              className="flex items-center gap-3 p-3.5 border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-sm group"
            >
              <QrCode className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-semibold text-gray-900">Generate Code</div>
                <div className="text-xs text-gray-500">Allow players to verify attendance</div>
              </div>
            </Link>

            <Link
              href="/admin/bonus"
              className="flex items-center gap-3 p-3.5 border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-sm group"
            >
              <Coins className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-semibold text-gray-900">Award Bonus Points</div>
                <div className="text-xs text-gray-500">Credit points to deserving players</div>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-3.5 border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-sm group"
            >
              <Users className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-semibold text-gray-900">Players List</div>
                <div className="text-xs text-gray-500">Inspect registered users directory</div>
              </div>
            </Link>
          </div>

          <div className="p-4 border border-gray-200 bg-gray-50 text-xs text-gray-500 leading-relaxed space-y-2">
            <div className="font-semibold text-gray-700">Manager constraints:</div>
            <p>1. Data is scoped strictly to <strong className="text-gray-800">{user.center?.name}</strong>.</p>
            <p>2. You cannot administer other locations, delete users, or access health checks.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

