import { Prisma } from "@prisma/client";
import { createLeaderboardRows } from "@/lib/product-logic";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 200;

export async function getLeaderboard(
  where: Prisma.UserWhereInput = {},
  limit = DEFAULT_LIMIT,
) {
  const inputWhere = where;
  const users = await prisma.user.findMany({
    where: { ...inputWhere, competitionCenterId: { not: null } },
    select: {
      id: true,
      displayName: true,
      email: true,
      nationality: true,
      competitionCenter: { select: { name: true } },
      predictions: { select: { pointsAwarded: true } },
      pointEvents: { select: { points: true } },
    },
  });

  return createLeaderboardRows(users, limit);
}

export async function getLeaderboardWithMeta(
  where: Prisma.UserWhereInput = {},
  limit = DEFAULT_LIMIT,
) {
  const inputWhere = where;
  const whereWithFilter: Prisma.UserWhereInput = {
    ...inputWhere,
    competitionCenterId: { not: null },
  };
  const [rows, total] = await Promise.all([
    getLeaderboard(where, limit),
    prisma.user.count({ where: whereWithFilter }),
  ]);
  return { rows, total, limited: total > limit, limit };
}
