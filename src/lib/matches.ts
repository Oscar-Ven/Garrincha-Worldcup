import { prisma } from "@/lib/prisma";

/** Fetch all matches for a specific user (includes their predictions). */
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

/** Fetch all 104 matches for the public schedule page (no predictions). */
export async function getAllMatches() {
  return prisma.match.findMany({
    orderBy: [{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }],
    include: {
      homeTeam: {
        select: { id: true, name: true, fifaCode: true, flagUrl: true, groupName: true },
      },
      awayTeam: {
        select: { id: true, name: true, fifaCode: true, flagUrl: true, groupName: true },
      },
    },
  });
}
