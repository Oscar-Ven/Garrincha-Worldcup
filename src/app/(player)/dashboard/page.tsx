import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Coins, Landmark, Target, Trophy } from "lucide-react";
import PrizeCards from "@/components/public/PrizeCards";
import { prisma } from "@/lib/prisma";
import { createLeaderboardRows } from "@/lib/product-logic";
import { isPredictionLocked } from "@/lib/scoring";
import { requirePlayerContext } from "@/lib/player-app";
import { t } from "@/lib/translations";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, locale } = await requirePlayerContext();

  if (!user.competitionCenterId) {
    redirect("/center");
  }

  const [predictions, matches, leaderboardUsers, pointEvents, checkIn] = await Promise.all([
    prisma.prediction.findMany({
      where: { userId: user.id },
      select: { matchId: true, pointsAwarded: true },
    }),
    prisma.match.findMany({
      include: {
        homeTeam: { select: { name: true, fifaCode: true, flagUrl: true } },
        awayTeam: { select: { name: true, fifaCode: true, flagUrl: true } },
      },
      orderBy: { kickoffAt: "asc" },
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
    prisma.pointEvent.findMany({
      where: { userId: user.id },
      select: { points: true, reason: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.centerCheckIn.findUnique({ where: { userId: user.id } }),
  ]);

  const predictionMap = new Map(predictions.map((prediction) => [prediction.matchId, prediction]));
  const totalPoints =
    predictions.reduce((sum, prediction) => sum + prediction.pointsAwarded, 0) +
    pointEvents.reduce((sum, event) => sum + event.points, 0);

  const leaderboard = createLeaderboardRows(leaderboardUsers);
  const globalRank = leaderboard.findIndex((row) => row.id === user.id) + 1;
  const centerBoard = leaderboard.filter((row) => row.center === (user.competitionCenter?.name ?? ""));
  const centerRank = centerBoard.findIndex((row) => row.id === user.id) + 1;

  const upcomingMatches = matches
    .filter((match) => match.status === "SCHEDULED" && !isPredictionLocked(match.kickoffAt))
    .slice(0, 3)
    .map((match) => ({
      id: match.id,
      label: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      kickoffAt: match.kickoffAt,
      predicted: predictionMap.has(match.id),
    }));

  const recentCompleted = matches
    .filter((match) => match.status === "FINAL")
    .slice(-3)
    .reverse()
    .map((match) => ({
      id: match.id,
      label: `${match.homeTeam.name} ${match.homeScore ?? "-"}-${match.awayScore ?? "-"} ${match.awayTeam.name}`,
      predicted: predictionMap.has(match.id),
      points: predictionMap.get(match.id)?.pointsAwarded ?? 0,
    }));

  const statCards = [
    { label: t(locale, "dashboard.totalPoints"), value: String(totalPoints), icon: Coins },
    { label: t(locale, "dashboard.globalRank"), value: globalRank > 0 ? `#${globalRank}` : "-", icon: Trophy },
    { label: "Center rank", value: centerRank > 0 ? `#${centerRank}` : "-", icon: Landmark },
    { label: t(locale, "dashboard.myPredictions"), value: String(predictions.length), icon: Target },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/8 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-lime-400">{t(locale, "dashboard.eyebrow")}</p>
            <h1 className="text-[clamp(1.4rem,4vw,2.1rem)] font-semibold tracking-tight text-white">
              {t(locale, "welcome")}, {user.nickname}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-300">
              {t(locale, "dashboard.copy", { center: user.competitionCenter?.name ?? user.center.name })}
            </p>
          </div>
          <div className="rounded-3xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-200">
            {t(locale, "dashboard.lockNotice")}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="min-w-0 rounded-[24px] border border-white/8 bg-zinc-950/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-zinc-400">{card.label}</span>
                <Icon className="h-4 w-4 shrink-0 text-lime-400" />
              </div>
              <div className="mt-3 truncate text-2xl font-semibold text-white">{card.value}</div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/8 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">Upcoming matches needing attention</h2>
                <p className="mt-1 text-sm text-zinc-400">Your next open predictions before the 5-minute lock.</p>
              </div>
              <Link href="/predictions" className="inline-flex items-center gap-2 text-sm font-medium text-lime-300">
                <span>{t(locale, "nav.predict")}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {upcomingMatches.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm text-zinc-400">No open fixtures right now.</div>
              ) : (
                upcomingMatches.map((match) => (
                  <div key={match.id} className="flex min-w-0 items-center justify-between gap-3 rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">{match.label}</div>
                      <div className="mt-1 text-xs text-zinc-500">{new Date(match.kickoffAt).toLocaleString()}</div>
                    </div>
                    <div className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${match.predicted ? "bg-lime-400/15 text-lime-300" : "bg-amber-500/10 text-amber-300"}`}>
                      {match.predicted ? "Predicted" : "Not predicted"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">Recently completed</h2>
                <p className="mt-1 text-sm text-zinc-400">Latest final scores and your awarded points.</p>
              </div>
              <Link href="/matches" className="inline-flex items-center gap-2 text-sm font-medium text-lime-300">
                <span>{t(locale, "nav.matches")}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {recentCompleted.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm text-zinc-400">No completed matches yet.</div>
              ) : (
                recentCompleted.map((match) => (
                  <div key={match.id} className="flex min-w-0 items-center justify-between gap-3 rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">{match.label}</div>
                      <div className="mt-1 text-xs text-zinc-500">{match.predicted ? "Prediction scored" : "No prediction submitted"}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-lime-300">{match.points} pts</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/8 bg-black/20 p-5">
            <h2 className="text-base font-semibold text-white">Quick actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                { href: "/predictions", label: "Predict next match", icon: Target },
                { href: "/leaderboards", label: "View leaderboards", icon: Trophy },
                { href: "/my-points", label: "View my points", icon: Coins },
                { href: "/profile", label: "View profile", icon: CalendarDays },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href} className="flex items-center gap-3 rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]">
                    <Icon className="h-4 w-4 shrink-0 text-lime-400" />
                    <span className="min-w-0 truncate">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-black/20 p-5">
            <h2 className="text-base font-semibold text-white">Center and bonus status</h2>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Competition center</div>
                <div className="mt-2 font-medium text-white">{user.competitionCenter?.name ?? user.center.name}</div>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Attendance / check-in</div>
                <div className="mt-2 font-medium text-white">{checkIn ? "Checked in for a session" : "No active check-in record yet"}</div>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Recent bonus activity</div>
                <div className="mt-2 space-y-2">
                  {pointEvents.length === 0 ? (
                    <div className="text-zinc-400">No recent point events.</div>
                  ) : (
                    pointEvents.map((event) => (
                      <div key={`${event.createdAt.toISOString()}-${event.reason}`} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-zinc-300">{event.reason}</span>
                        <span className="shrink-0 font-semibold text-lime-300">{event.points > 0 ? `+${event.points}` : event.points}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PrizeCards preview prizesHref="/prizes" />
    </div>
  );
}