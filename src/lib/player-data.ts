import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { leaderboardDisplayName } from "@/lib/product-logic";
import { getLeaderboard, getUserCenterRank, getUserRankAndPoints } from "@/lib/leaderboards";
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
  wentToPenalties: boolean;
  penaltyWinner: string | null;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  prediction: {
    homeScore: number;
    awayScore: number;
    penaltyWinner: string | null;
    homePenaltyScore: number | null;
    awayPenaltyScore: number | null;
    pointsAwarded: number;
    calculatedAt: string | null;
  } | null;
  isLocked: boolean;
};

export const playerPredictionMatchOrderBy = [{ kickoffAt: "asc" as const }, { fifaMatchNo: "asc" as const }];

export async function getPlayerDashboardData(user: PlayerRouteUser) {
  const now = new Date();

  const [
    centerCheckin,
    predictionCount,
    matches,
    predictionPointsAgg,
    bonusPointsAgg,
    rankData,
    centerRankResult,
    leaderboardTop,
    centerLeaderboardTop,
  ] = await Promise.all([
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
            penaltyWinner: true,
            homePenaltyScore: true,
            awayPenaltyScore: true,
            pointsAwarded: true,
            calculatedAt: true,
          },
          take: 1,
        },
      },
      orderBy: playerPredictionMatchOrderBy,
    }),
    prisma.prediction.aggregate({
      where: { userId: user.id },
      _sum: { pointsAwarded: true },
    }),
    prisma.pointEvent.aggregate({
      where: { userId: user.id },
      _sum: { points: true },
    }),
    getUserRankAndPoints(user.id),
    user.competitionCenterId
      ? getUserCenterRank(user.id, user.competitionCenterId)
      : Promise.resolve(0),
    getLeaderboard({}, 8),
    user.competitionCenterId
      ? getLeaderboard({ competitionCenterId: user.competitionCenterId }, 8)
      : Promise.resolve([]),
  ]);

  const globalRank = rankData.rank > 0 ? rankData.rank : null;
  const centerRank = centerRankResult > 0 ? centerRankResult : null;

  const totalPredictionPoints = predictionPointsAgg._sum.pointsAwarded ?? 0;
  const totalBonusPoints = bonusPointsAgg._sum.points ?? 0;

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
    wentToPenalties: match.wentToPenalties,
    penaltyWinner: match.penaltyWinner,
    homePenaltyScore: match.homePenaltyScore,
    awayPenaltyScore: match.awayPenaltyScore,
    prediction: match.predictions[0]
      ? {
          homeScore: match.predictions[0].homeScore,
          awayScore: match.predictions[0].awayScore,
          penaltyWinner: match.predictions[0].penaltyWinner,
          homePenaltyScore: match.predictions[0].homePenaltyScore,
          awayPenaltyScore: match.predictions[0].awayPenaltyScore,
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
    leaderboardTop,
    centerLeaderboardTop,
  };
}
