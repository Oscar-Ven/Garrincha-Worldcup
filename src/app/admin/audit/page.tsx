import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { History, ArrowLeftRight, Coins, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditViewPage() {
  const admin = await getCurrentUser();
  if (!admin) {
    redirect("/dashboard/login");
  }

  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  if (!isOwner) {
    redirect("/admin");
  }

  const centers = await prisma.garrinchaCenter.findMany({
    select: { id: true, name: true },
  });

  const [changeLogs, pointLogs] = await Promise.all([
    prisma.centerChangeLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, nickname: true, email: true } },
      },
    }),
    prisma.pointEvent.findMany({
      where: { matchId: null },
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
    actor: log.awardedBy ?? "System",
    centerName: log.user?.competitionCenter?.name.replace("GARRINCHA ", "") ?? "—",
  }));

  const thCls = "px-6 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider";
  const trCls = "border-b border-gray-100 hover:bg-gray-50 transition-colors";

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <History className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Audit Ledger</h1>
        </div>
        <p className="text-sm text-gray-500">
          Immutable records of center relocations and manual bonus point awards.
        </p>
      </div>

      <div className="space-y-8">
        {/* Center relocation log */}
        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-green-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Center Relocation Log ({serializedChangeLogs.length})
            </h2>
          </div>

          {serializedChangeLogs.length === 0 ? (
            <p className="text-gray-400 text-center py-12 text-sm">No logged registry changes recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className={thCls}>Timestamp</th>
                    <th className={thCls}>Player</th>
                    <th className={`${thCls} text-center`}>Center Transition</th>
                    <th className={`${thCls} text-right`}>Authorized By</th>
                  </tr>
                </thead>
                <tbody>
                  {serializedChangeLogs.map((log) => (
                    <tr key={log.id} className={trCls}>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1 text-gray-400" />
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{log.playerName}</div>
                        <div className="text-xs text-gray-500 font-mono">@{log.playerNick} Â· {log.playerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-600 font-medium">{log.fromCenter}</span>
                        <span className="mx-2 text-green-600 font-bold">â†’</span>
                        <span className="text-green-700 font-semibold">{log.toCenter}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-gray-500 text-xs whitespace-nowrap">
                        {log.actor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bonus points log */}
        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Coins className="w-4 h-4 text-green-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Manual Bonus Point Log ({serializedPointLogs.length})
            </h2>
          </div>

          {serializedPointLogs.length === 0 ? (
            <p className="text-gray-400 text-center py-12 text-sm">No manual bonus points logged.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className={thCls}>Timestamp</th>
                    <th className={thCls}>Recipient</th>
                    <th className={`${thCls} text-center`}>Center</th>
                    <th className={`${thCls} text-center`}>Points</th>
                    <th className={thCls}>Reason</th>
                    <th className={`${thCls} text-right`}>Authorized By</th>
                  </tr>
                </thead>
                <tbody>
                  {serializedPointLogs.map((log) => (
                    <tr key={log.id} className={trCls}>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1 text-gray-400" />
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{log.playerName}</div>
                        <div className="text-xs text-gray-500 font-mono">@{log.playerNick}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600 font-medium">
                        {log.centerName}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-green-700 whitespace-nowrap">
                        {log.points > 0 ? `+${log.points}` : log.points} pts
                      </td>
                      <td className="px-6 py-4 text-gray-700 max-w-xs">
                        {log.reason}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-gray-500 text-xs whitespace-nowrap">
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

