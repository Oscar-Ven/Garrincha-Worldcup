import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createLeaderboardRows, leaderboardDisplayName, type LeaderboardInputUser } from "@/lib/product-logic";
import { isPredictionLocked } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";

export type PlayerRouteUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requirePlayerRouteUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "USER") {
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || user.role === "CENTER_ADMIN") {
      redirect("/admin");
    }
    redirect("/");
  }

  return user;
}

export type PlayerMatchCard = {
  id: string;
  fifaMatchNo: number | null;
  stage: string;
  venue: string;
  kickoffAt: string;
  status: string;
  homeTeamName: string;
  homeTeamFlag: string;
  awayTeamName: string;
  awayTeamFlag: string;
  homeScore: number | null;
  awayScore: number | null;
  prediction: {
    homeScore: number;
    awayScore: number;
    pointsAwarded: number;
    calculatedAt: string | null;
  } | null;
  isLocked: boolean;
};

export const playerPredictionMatchOrderBy = [{ kickoffAt: "asc" as const }, { fifaMatchNo: "asc" as const }];

export async function getPlayerDashboardData(user: PlayerRouteUser) {
  const now = new Date();

  const [leaderboardUsers, centerCheckin, predictionCount, matches] = await Promise.all([
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
    }) as Promise<LeaderboardInputUser[]>,
    prisma.centerCheckIn.findUnique({
      where: { userId: user.id },
      select: { createdAt: true, expiresAt: true, centerId: true },
    }),
    prisma.prediction.count({ where: { userId: user.id } }),
    prisma.match.findMany({
      include: {
        homeTeam: { select: { name: true, flagUrl: true } },
        awayTeam: { select: { name: true, flagUrl: true } },
        predictions: {
          where: { userId: user.id },
          select: {
            homeScore: true,
            awayScore: true,
            pointsAwarded: true,
            calculatedAt: true,
          },
          take: 1,
        },
      },
      orderBy: playerPredictionMatchOrderBy,
    }),
  ]);

  const leaderboard = createLeaderboardRows(leaderboardUsers);
  const playerRow = leaderboard.find((row) => row.id === user.id);
  const globalRank = playerRow ? leaderboard.findIndex((row) => row.id === user.id) + 1 : null;
  const centerLeaderboard = leaderboard.filter((row) => row.center === (user.competitionCenter?.name ?? ""));
  const centerRank = playerRow ? centerLeaderboard.findIndex((row) => row.id === user.id) + 1 : null;

  const totalPredictionPoints = leaderboardUsers
    .find((entry) => entry.id === user.id)
    ?.predictions.reduce((sum, prediction) => sum + prediction.pointsAwarded, 0) ?? 0;
  const totalBonusPoints = leaderboardUsers
    .find((entry) => entry.id === user.id)
    ?.pointEvents.reduce((sum, event) => sum + event.points, 0) ?? 0;

  const playerName = leaderboardDisplayName({
    id: user.id,
    displayName: user.displayName,
    nickname: user.nickname,
    fullName: user.fullName,
  });

  const matchCards: PlayerMatchCard[] = matches.map((match) => ({
    id: match.id,
    fifaMatchNo: match.fifaMatchNo,
    stage: match.stage,
    venue: match.venue,
    kickoffAt: match.kickoffAt.toISOString(),
    status: match.status,
    homeTeamName: match.homeTeam.name,
    homeTeamFlag: match.homeTeam.flagUrl,
    awayTeamName: match.awayTeam.name,
    awayTeamFlag: match.awayTeam.flagUrl,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    prediction: match.predictions[0]
      ? {
          homeScore: match.predictions[0].homeScore,
          awayScore: match.predictions[0].awayScore,
          pointsAwarded: match.predictions[0].pointsAwarded,
          calculatedAt: match.predictions[0].calculatedAt?.toISOString() ?? null,
        }
      : null,
    isLocked: isPredictionLocked(match.kickoffAt, now),
  }));

  return {
    user,
    playerName,
    totalPoints: totalPredictionPoints + totalBonusPoints,
    totalPredictionPoints,
    totalBonusPoints,
    globalRank,
    centerRank,
    predictionCount,
    checkInStatus: centerCheckin
      ? {
          createdAt: centerCheckin.createdAt.toISOString(),
          expiresAt: centerCheckin.expiresAt.toISOString(),
          isActive: centerCheckin.expiresAt > now,
        }
      : null,
    upcomingMatchesNeedingPrediction: matchCards.filter(
      (match) => match.status === "SCHEDULED" && !match.isLocked && !match.prediction,
    ).slice(0, 4),
    recentCompletedMatches: matchCards.filter((match) => match.status === "FINAL").slice(-4).reverse(),
    allMatches: matchCards,
    leaderboardTop: leaderboard.slice(0, 8),
    centerLeaderboardTop: centerLeaderboard.slice(0, 8),
  };
}
