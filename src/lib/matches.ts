import { prisma } from "@/lib/prisma";

export async function getMatchesForUser(userId?: string) {
  return prisma.match.findMany({
    orderBy: [{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }],
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: userId
        ? {
            where: { userId },
            select: { id: true, homeScore: true, awayScore: true, pointsAwarded: true },
          }
        : false,
    },
  });
}
