import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { History, ArrowLeftRight, Coins, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditViewPage() {
  const admin = await getCurrentUser();
  if (!admin) {
    redirect("/admin/login");
  }

  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  if (!isOwner) {
    redirect("/admin");
  }

  // Fetch Centers to map logs names correctly
  const centers = await prisma.garrinchaCenter.findMany({
    select: { id: true, name: true },
  });

  // Query center transition change logs
  const [changeLogs, pointLogs] = await Promise.all([
    prisma.centerChangeLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            fullName: true,
            nickname: true,
            email: true,
          },
        },
      },
    }),
    prisma.pointEvent.findMany({
      where: { matchId: null }, // matchId == null implies manual bonus awards!
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            fullName: true,
            nickname: true,
            email: true,
            competitionCenter: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  // Map to unified display rows
  const serializedChangeLogs = changeLogs.map((log) => ({
    id: log.id,
    timestamp: log.createdAt.toISOString(),
    playerName: log.user?.fullName ?? "Unknown Competitor",
    playerNick: log.user?.nickname ?? "anonymous",
    playerEmail: log.user?.email ?? "",
    fromCenter: centers.find((c) => c.id === log.fromCenterId)?.name.replace("GARRINCHA ", "") ?? "Initial Activation",
    toCenter: centers.find((c) => c.id === log.toCenterId)?.name.replace("GARRINCHA ", "") ?? "—",
    actor: log.changedBy,
  }));

  const serializedPointLogs = pointLogs.map((log) => ({
    id: log.id,
    timestamp: log.createdAt.toISOString(),
    playerName: log.user?.fullName ?? "Unknown Competitor",
    playerNick: log.user?.nickname ?? "anonymous",
    playerEmail: log.user?.email ?? "",
    points: log.points,
    reason: log.reason,
    actor: log.awardedBy ?? "System calculations",
    centerName: log.user?.competitionCenter?.name.replace("GARRINCHA ", "") ?? "No registered center",
  }));

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <History className="w-8 h-8 text-lime-400" />
          Audit Ledger Trails
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Immutable registers tracking manual corrections, sports center relocations, and manual point creations inside the World Cup console.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Row 1: Registry Corrections Log */}
        <div className="border border-zinc-800 bg-zinc-900/10">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
            <ArrowLeftRight className="w-4 h-4 text-lime-400" />
            <span>Center Relocation Corrections Ledger ({serializedChangeLogs.length})</span>
          </div>

          {serializedChangeLogs.length === 0 ? (
            <p className="text-zinc-500 text-center py-12 text-xs">No logged registry changes recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-805 text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950/20">
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Player Account</th>
                    <th className="px-6 py-3 text-center">Center Shift Transition</th>
                    <th className="px-6 py-3 text-right">Authorized Executor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {serializedChangeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 text-zinc-500 font-mono text-[10px] whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1 text-zinc-650" />
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white uppercase">{log.playerName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">@{log.playerNick} · {log.playerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-zinc-400 uppercase font-semibold">{log.fromCenter}</span>
                        <span className="mx-2 text-lime-404 font-black">→</span>
                        <span className="text-lime-400 uppercase font-extrabold">{log.toCenter}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-zinc-400 text-[11px] whitespace-nowrap">
                        {log.actor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Row 2: PointEvent Manual Ledger */}
        <div className="border border-zinc-800 bg-zinc-900/10">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
            <Coins className="w-4 h-4 text-lime-400" />
            <span>Manual Bonus Point Logs Ledger ({serializedPointLogs.length})</span>
          </div>

          {serializedPointLogs.length === 0 ? (
            <p className="text-zinc-500 text-center py-12 text-xs">No manual bonus points logged.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-805 text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950/20">
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Recipient Player</th>
                    <th className="px-6 py-3 text-center">Assigned Sports Center</th>
                    <th className="px-6 py-3 text-center w-28">Score Added</th>
                    <th className="px-6 py-3">Reason For allocation</th>
                    <th className="px-6 py-3 text-right">Authorized Executor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {serializedPointLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 text-zinc-500 font-mono text-[10px] whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1 text-zinc-650" />
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white uppercase">{log.playerName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">@{log.playerNick}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-zinc-400 uppercase font-semibold">
                        {log.centerName}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-black text-lime-400 text-sm whitespace-nowrap">
                        {log.points > 0 ? `+${log.points}` : log.points} pts
                      </td>
                      <td className="px-6 py-4 text-zinc-300 font-medium">
                        {log.reason}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-zinc-400 text-[11px] whitespace-nowrap">
                        {log.actor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}