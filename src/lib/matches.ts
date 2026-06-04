import { prisma } from "@/lib/prisma";

const TEAM_SELECT = {
  id: true, name: true, fifaCode: true, flagUrl: true, groupName: true,
} as const;

/** Fetch all matches for a specific user (includes their predictions). */
export async function getMatchesForUser(userId?: string) {
  return prisma.match.findMany({
    orderBy: [{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }],
    select: {
      id: true,
      stage: true,
      fifaMatchNo: true,
      venue: true,
      kickoffAt: true,
      status: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: TEAM_SELECT },
      awayTeam: { select: TEAM_SELECT },
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
    select: {
      id: true,
      stage: true,
      fifaMatchNo: true,
      venue: true,
      kickoffAt: true,
      status: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: TEAM_SELECT },
      awayTeam: { select: TEAM_SELECT },
    },
  });
}
