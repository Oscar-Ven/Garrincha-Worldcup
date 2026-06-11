import { CalendarDays, CheckCircle, Zap } from "lucide-react";
import DailyBonusForm from "@/components/player/DailyBonusForm";
import { prisma } from "@/lib/prisma";
import { requirePlayerContext } from "@/lib/player-app";
import { getBrusselsDate } from "@/lib/daily-bonus";

export const dynamic = "force-dynamic";

export default async function DailyBonusPage() {
  const { user } = await requirePlayerContext();

  const today = getBrusselsDate();

  const [todayClaim, todayCode] = await Promise.all([
    prisma.dailyBonusClaim.findFirst({
      where: { userId: user.id, bonusDate: today },
    }),
    prisma.dailyBonusCode.findFirst({
      where: { bonusDate: today, isActive: true },
      select: { expiresAt: true },
    }),
  ]);

  const alreadyClaimed = Boolean(todayClaim);
  const codeAvailable = Boolean(todayCode);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/8 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-400/15">
            <Zap className="h-6 w-6 text-lime-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-lime-400">
              Daily attendance bonus
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Claim your daily +3 points</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Get the daily code from your GARRINCHA Center manager. One claim per player per day.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="rounded-[28px] border border-white/8 bg-black/20 p-5 md:p-6">
          {alreadyClaimed ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-400/15">
                <CheckCircle className="h-8 w-8 text-lime-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Already claimed today!</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  You claimed your daily attendance bonus for {today}. Come back tomorrow for another +3 points.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-white">Enter today&apos;s code</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Ask your center manager for the daily attendance code.
                  {!codeAvailable && " No code has been set for today yet."}
                </p>
              </div>
              <DailyBonusForm />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/8 bg-black/20 p-5">
            <h2 className="text-sm font-semibold text-white">How it works</h2>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              {[
                "Your center manager shares one daily code.",
                "Enter the code here to claim +3 bonus points.",
                "Each code is valid for today only (Brussels time).",
                "One claim per player per day.",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/15 text-[10px] font-bold text-lime-400">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-black/20 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <CalendarDays className="h-4 w-4 text-lime-400" />
              <span>Today</span>
            </div>
            <div className="mt-3 font-mono text-lg font-semibold text-lime-300">{today}</div>
            <div className="mt-1 text-xs text-zinc-500">Europe/Brussels timezone</div>
          </div>
        </div>
      </div>
    </div>
  );
}
