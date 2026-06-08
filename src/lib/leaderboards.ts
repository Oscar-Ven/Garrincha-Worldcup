import { Prisma } from "@prisma/client";
import { type LeaderboardRow } from "@/lib/product-logic";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 200;

// ─── Aggregated leaderboard (fast: one SQL round-trip) ───────────────────────
//
// Instead of loading all users + all their predictions into Node.js memory and
// computing points there, we push the SUM to the database. With indexes on
// Prediction.userId and PointEvent.userId this scales to tens-of-thousands
// of users without memory pressure or timeout risk.

export async function getLeaderboard(
  where: Prisma.UserWhereInput = {},
  limit = DEFAULT_LIMIT,
): Promise<LeaderboardRow[]> {
  const hasFilter = Object.keys(where).length > 0;

  if (hasFilter) {
    // ORM path — used for filtered sub-leaderboards (nationality, center)
    const users = await prisma.user.findMany({
      where: { ...where, competitionCenterId: { not: null } },
      select: {
        id: true,
        nickname: true,
        displayName: true,
        fullName: true,
        email: true,
        nationality: true,
        createdAt: true,
        competitionCenter: { select: { name: true } },
        predictions: { select: { pointsAwarded: true } },
        pointEvents: { select: { points: true } },
      },
    });

    const mapped = users.map((u) => ({
      id: u.id,
      name:
        u.nickname?.trim() ||
        u.fullName?.trim() ||
        u.displayName?.trim() ||
        `Player ${u.id.slice(-6).toUpperCase()}`,
      nationality: u.nationality ?? "Unspecified",
      center: u.competitionCenter?.name ?? "Unspecified",
      points:
        u.predictions.reduce((s, p) => s + p.pointsAwarded, 0) +
        u.pointEvents.reduce((s, e) => s + e.points, 0),
      predictionCount: u.predictions.length,
      _exactCount: u.predictions.filter((p) => p.pointsAwarded === 5).length,
      _correctCount: u.predictions.filter((p) => p.pointsAwarded >= 2).length,
      _createdAt: u.createdAt.getTime(),
    }));

    return mapped
      .sort(
        (a, b) =>
          b.points - a.points ||
          b._exactCount - a._exactCount ||
          b._correctCount - a._correctCount ||
          a._createdAt - b._createdAt,
      )
      .slice(0, limit)
      .map(({ _exactCount: _e, _correctCount: _c, _createdAt: _t, ...row }) => row);
  }

  // Fast path — one aggregated SQL query, no in-memory fan-out
  type Row = {
    id: string;
    name: string;
    nationality: string | null;
    center: string;
    points: bigint;
    predictionCount: bigint;
  };

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      u.id,
      COALESCE(
        NULLIF(TRIM(u.nickname), ''),
        NULLIF(TRIM(u."fullName"), ''),
        NULLIF(TRIM(u."displayName"), ''),
        'Player ' || RIGHT(u.id, 6)
      ) AS name,
      u.nationality,
      gc.name AS center,
      COALESCE(p.total, 0) + COALESCE(ev.total, 0) AS points,
      COALESCE(p.cnt, 0) AS "predictionCount"
    FROM "User" u
    JOIN "GarrinchaCenter" gc ON gc.id = u."competitionCenterId"
    LEFT JOIN (
      SELECT "userId",
             SUM("pointsAwarded")                       AS total,
             COUNT(*)                                    AS cnt,
             COUNT(*) FILTER (WHERE "pointsAwarded" = 5) AS exact_cnt,
             COUNT(*) FILTER (WHERE "pointsAwarded" >= 2) AS correct_cnt
      FROM "Prediction"
      GROUP BY "userId"
    ) p ON p."userId" = u.id
    LEFT JOIN (
      SELECT "userId", SUM(points) AS total
      FROM "PointEvent"
      GROUP BY "userId"
    ) ev ON ev."userId" = u.id
    WHERE u."competitionCenterId" IS NOT NULL
    ORDER BY
      points DESC,
      COALESCE(p.exact_cnt, 0) DESC,
      COALESCE(p.correct_cnt, 0) DESC,
      u."createdAt" ASC
    LIMIT ${Math.min(1000, Math.max(1, limit))}
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    nationality: r.nationality ?? "Unspecified",
    center: r.center,
    points: Number(r.points),
    predictionCount: Number(r.predictionCount),
  }));
}

export async function getLeaderboardWithMeta(
  where: Prisma.UserWhereInput = {},
  limit = DEFAULT_LIMIT,
) {
  const whereWithFilter: Prisma.UserWhereInput = {
    ...where,
    competitionCenterId: { not: null },
  };
  const [rows, total] = await Promise.all([
    getLeaderboard(where, limit),
    prisma.user.count({ where: whereWithFilter }),
  ]);
  return { rows, total, limited: total > limit, limit };
}

// ─── Fast user rank (dashboard only) ─────────────────────────────────────────
//
// Computes only the requesting user's rank and points in one focused SQL query.
// Avoids loading the full leaderboard just to display one user's position.

export async function getUserCenterRank(
  userId: string,
  competitionCenterId: string,
): Promise<number> {
  type RankRow = { rank: bigint };
  const result = await prisma.$queryRaw<RankRow[]>`
    WITH ranked AS (
      SELECT
        u.id,
        RANK() OVER (
          ORDER BY COALESCE(p.total, 0) + COALESCE(ev.total, 0) DESC
        ) AS rank
      FROM "User" u
      LEFT JOIN (
        SELECT "userId", SUM("pointsAwarded") AS total
        FROM "Prediction"
        GROUP BY "userId"
      ) p ON p."userId" = u.id
      LEFT JOIN (
        SELECT "userId", SUM(points) AS total
        FROM "PointEvent"
        GROUP BY "userId"
      ) ev ON ev."userId" = u.id
      WHERE u."competitionCenterId" = ${competitionCenterId}
    )
    SELECT rank FROM ranked WHERE id = ${userId}
  `;
  return result[0] ? Number(result[0].rank) : 0;
}

export async function getUserRankAndPoints(
  userId: string,
): Promise<{ rank: number; points: number }> {
  type RankRow = { rank: bigint; points: bigint };
  const result = await prisma.$queryRaw<RankRow[]>`
    WITH ranked AS (
      SELECT
        u.id,
        COALESCE(p.total, 0) + COALESCE(ev.total, 0) AS points,
        RANK() OVER (
          ORDER BY COALESCE(p.total, 0) + COALESCE(ev.total, 0) DESC
        ) AS rank
      FROM "User" u
      LEFT JOIN (
        SELECT "userId", SUM("pointsAwarded") AS total
        FROM "Prediction"
        GROUP BY "userId"
      ) p ON p."userId" = u.id
      LEFT JOIN (
        SELECT "userId", SUM(points) AS total
        FROM "PointEvent"
        GROUP BY "userId"
      ) ev ON ev."userId" = u.id
      WHERE u."competitionCenterId" IS NOT NULL
    )
    SELECT rank, points FROM ranked WHERE id = ${userId}
  `;
  const row = result[0];
  return {
    rank: row ? Number(row.rank) : 0,
    points: row ? Number(row.points) : 0,
  };
}
