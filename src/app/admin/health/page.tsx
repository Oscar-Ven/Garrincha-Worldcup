/* eslint-disable react-hooks/purity */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  Database,
  ShieldCheck,
  Cpu,
  HardDrive,
  Users,
  Trophy,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SystemHealthPage() {
  const admin = await getCurrentUser();
  if (!admin) {
    redirect("/dashboard/login");
  }

  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  if (!isOwner) {
    redirect("/admin");
  }

  const dbStart = performance.now();
  let dbHealthy = false;
  let dbLatency = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Math.round(performance.now() - dbStart);
    dbHealthy = true;
  } catch (err) {
    console.error("Health check DB fail", err);
  }

  const totalUsers = await prisma.user.count();
  const totalMatches = await prisma.match.count();
  const totalPredictions = await prisma.prediction.count();
  const activeSessions = await prisma.centerSession.count({
    where: { expiresAt: { gt: new Date() } },
  });
  const pointLogsCount = await prisma.pointEvent.count();

  const isSentryConfigured = !!(
    process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  );
  const nodeEnv = process.env.NODE_ENV ?? "development";

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Activity className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
        </div>
        <p className="text-sm text-gray-500">
          Service heartbeat, database latency, and storage volume indexes.
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System status */}
        <div className="bg-white border border-gray-200 shadow-sm p-5 flex flex-col justify-between min-h-32">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Status</span>
          <div className="flex items-center gap-2 my-3">
            <span className="text-2xl font-bold text-gray-900">Online</span>
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shrink-0" />
          </div>
          <span className="text-xs text-gray-500">
            Env: <strong className="text-gray-700 uppercase">{nodeEnv}</strong>
          </span>
        </div>

        {/* DB latency */}
        <div className="bg-white border border-gray-200 shadow-sm p-5 flex flex-col justify-between min-h-32">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Database Latency</span>
          <div className="flex items-baseline gap-1.5 my-3">
            <span className={`text-2xl font-bold ${dbHealthy ? "text-gray-900" : "text-red-600"}`}>
              {dbHealthy ? `${dbLatency}ms` : "DOWN"}
            </span>
            {dbHealthy && (
              <span className="text-xs font-bold text-green-600 uppercase">OK</span>
            )}
          </div>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-gray-400" />
            Prisma &rarr; Supabase PostgreSQL
          </span>
        </div>

        {/* Active check-in keys */}
        <div className="bg-white border border-gray-200 shadow-sm p-5 flex flex-col justify-between min-h-32">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Check-In Keys</span>
          <div className="flex items-baseline gap-1 my-3">
            <span className="text-2xl font-bold text-gray-900">{activeSessions}</span>
            <span className="text-xs text-gray-400 uppercase font-medium">active</span>
          </div>
          <span className="text-xs text-gray-500">Across global physical centers</span>
        </div>

        {/* Point events logged */}
        <div className="bg-white border border-gray-200 shadow-sm p-5 flex flex-col justify-between min-h-32">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Scoring Events Logged</span>
          <div className="flex items-baseline gap-1 my-3">
            <span className="text-2xl font-bold text-gray-900">{pointLogsCount}</span>
            <span className="text-xs text-gray-400 uppercase font-medium">records</span>
          </div>
          <span className="text-xs text-gray-500">Match & bonus calculations</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environment checks */}
        <div className="lg:col-span-1 bg-white border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            Environment Check
          </h2>

          <div className="space-y-3 text-sm">
            {[
              {
                label: "Prisma Connection",
                ok: dbHealthy,
                okLabel: "Verified",
                failLabel: "Failed",
              },
              {
                label: "Sentry Monitoring",
                ok: isSentryConfigured,
                okLabel: "Active",
                failLabel: "Not Set",
              },
            ].map(({ label, ok, okLabel, failLabel }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-gray-600 font-medium">{label}</span>
                <span className={`px-2 py-0.5 text-xs font-semibold ${ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-gray-100 border border-gray-200 text-gray-500"}`}>
                  {ok ? okLabel : failLabel}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Database Layer</span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700">
                Prisma ORM
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Next.js Router</span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700">
                App Router
              </span>
            </div>
          </div>
        </div>

        {/* Storage volumes */}
        <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-green-600" />
            Storage Volume Index
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 p-4 flex items-center gap-4">
              <Users className="w-7 h-7 text-green-600 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase block">Accounts</span>
                <span className="text-2xl font-bold text-gray-900 block mt-0.5">{totalUsers}</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 flex items-center gap-4">
              <Trophy className="w-7 h-7 text-green-600 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase block">Fixtures</span>
                <span className="text-2xl font-bold text-gray-900 block mt-0.5">{totalMatches}</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 flex items-center gap-4">
              <Cpu className="w-7 h-7 text-green-600 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase block">Predictions</span>
                <span className="text-2xl font-bold text-gray-900 block mt-0.5">{totalPredictions}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 bg-gray-50 text-xs text-gray-500 leading-relaxed mt-2">
            <strong className="text-gray-700">Diagnostic note:</strong> Standard pipeline is healthy. PointEvent recalculations run securely on each official score submission.
          </div>
        </div>
      </div>
    </div>
  );
}

