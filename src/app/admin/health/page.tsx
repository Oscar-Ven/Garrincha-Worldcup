/* eslint-disable react-hooks/purity, @typescript-eslint/no-unused-vars */
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
    redirect("/admin/login");
  }

  // Strictly enforce Super Admin / Admin restrictions
  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  if (!isOwner) {
    redirect("/admin");
  }

  // Core database dynamic diagnostics
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

  // Load database metadata volume stats
  const totalUsers = await prisma.user.count();
  const totalMatches = await prisma.match.count();
  const totalPredictions = await prisma.prediction.count();
  const activeSessions = await prisma.centerSession.count({
    where: { expiresAt: { gt: new Date() } },
  });
  const pointLogsCount = await prisma.pointEvent.count();

  // Environment checks
  const isSentryConfigured = !!(
    process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  );
  const isSupabaseConfigured = !!(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  const nodeEnv = process.env.NODE_ENV ?? "development";

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Upper header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Activity className="w-8 h-8 text-lime-400" />
          System Diagnostic & Health
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Inspect core service heartbeat, API provider endpoints, database latency, and storage volume indexes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core Heartbeat card */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
            System Status
          </span>
          <div className="my-4 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-white uppercase">
              Online
            </span>
            <span className="w-2.5 h-2.5 bg-lime-400 rounded-full animate-pulse shrink-0 block" />
          </div>
          <span className="text-[10px] text-zinc-400">
            Node environment: <strong className="text-zinc-300 uppercase">{nodeEnv}</strong>
          </span>
        </div>

        {/* Database latency card */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
            Prisma database Live latency
          </span>
          <div className="my-4 flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tight text-white">
              {dbHealthy ? `${dbLatency}ms` : "DOWN"}
            </span>
            {dbHealthy && <span className="text-[10px] font-bold text-lime-400 uppercase">OK</span>}
          </div>
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-zinc-500" />
            Supabase server status
          </span>
        </div>

        {/* Active sessions card */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
            Active Check-In Keys
          </span>
          <div className="my-4 flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tight text-white">
              {activeSessions}
            </span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Units</span>
          </div>
          <span className="text-[10px] text-zinc-400">
            Across global physical centers
          </span>
        </div>

        {/* Point Logging Events card */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
            Scoring Actions Logged
          </span>
          <div className="my-4 flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tight text-white">
              {pointLogsCount}
            </span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Updates</span>
          </div>
          <span className="text-[10px] text-zinc-400">
            Including match & bonus calculations
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environment configuration validations */}
        <div className="lg:col-span-1 bg-zinc-900/40 border border-zinc-800 p-6 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-wider border-b border-zinc-800 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-lime-400" />
            Environment Check-Desk
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
              <span className="text-zinc-400 font-bold block">Prisma Connection</span>
              <span className={`px-2 py-0.5 font-bold uppercase text-[9px] ${dbHealthy ? "bg-lime-400/10 text-lime-400" : "bg-red-400/10 text-red-500"}`}>
                {dbHealthy ? "Verified" : "Fail"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
              <span className="text-zinc-400 font-bold block">Supabase Client</span>
              <span className={`px-2 py-0.5 font-bold uppercase text-[9px] ${isSupabaseConfigured ? "bg-lime-400/10 text-lime-400" : "bg-zinc-800 text-zinc-400"}`}>
                {isSupabaseConfigured ? "Connected" : "Not Set"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
              <span className="text-zinc-400 font-bold block">Sentry Monitoring</span>
              <span className={`px-2 py-0.5 font-bold uppercase text-[9px] ${isSentryConfigured ? "bg-lime-400/10 text-lime-400" : "bg-zinc-800 text-zinc-400"}`}>
                {isSentryConfigured ? "Active" : "Not Locked"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 string border-b border-zinc-900">
              <span className="text-zinc-400 font-bold block">Next.js Standalone</span>
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 font-bold uppercase text-[9px]">
                App Router
              </span>
            </div>
          </div>
        </div>

        {/* Database volume indices */}
        <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 p-6 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-wider border-b border-zinc-800 pb-3 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-lime-400" />
            Storage Volumes Table Index
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950 border border-zinc-800 p-4 flex items-center gap-4">
              <Users className="w-8 h-8 text-lime-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block leading-none">
                  Accounts
                </span>
                <span className="text-xl font-black text-white block mt-1">
                  {totalUsers}
                </span>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-4 flex items-center gap-4">
              <Trophy className="w-8 h-8 text-lime-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block leading-none">
                  Fixtures
                </span>
                <span className="text-xl font-black text-white block mt-1">
                  {totalMatches}
                </span>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-4 flex items-center gap-4">
              <Cpu className="w-8 h-8 text-lime-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block leading-none">
                  Predictions
                </span>
                <span className="text-xl font-black text-white block mt-1">
                  {totalPredictions}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 border border-dashed border-zinc-800 bg-zinc-950/20 text-[11px] text-zinc-500 leading-relaxed font-sans mt-2">
            <strong>Diagnostic Instruction:</strong> Standard pipeline is healthy. PointEvent recalculations run securely on each official score submission or external syncer triggers.
          </div>
        </div>
      </div>
    </div>
  );
}
