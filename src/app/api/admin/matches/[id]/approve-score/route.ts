import { MatchStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculatePredictionPoints } from "@/lib/product-logic";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`admin-approve-score:${ip}`, 60, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    select: { pendingHomeScore: true, pendingAwayScore: true, scoreSyncStatus: true },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }
  if (match.scoreSyncStatus !== "pending_review") {
    return NextResponse.json({ error: "This match has no pending score to approve." }, { status: 400 });
  }
  if (match.pendingHomeScore === null || match.pendingAwayScore === null) {
    return NextResponse.json({ error: "Pending score data is missing." }, { status: 400 });
  }

  const finalHome = match.pendingHomeScore;
  const finalAway = match.pendingAwayScore;
  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      // Atomic optimistic lock: only update if still pending_review — prevents double-approve races.
      const { count } = await tx.match.updateMany({
        where: { id, scoreSyncStatus: "pending_review" },
        data: {
          homeScore: finalHome,
          awayScore: finalAway,
          status: MatchStatus.FINAL,
          finalizedAt: now,
          scoreSource: "api-football",
          scoreSyncStatus: "admin_approved",
          pendingHomeScore: null,
          pendingAwayScore: null,
          lastScoreSyncAt: now,
        },
      });
      if (count === 0) throw new Error("ALREADY_PROCESSED");

      const predictions = await tx.prediction.findMany({
        where: { matchId: id },
        select: { id: true, userId: true, homeScore: true, awayScore: true },
      });

      if (predictions.length > 0) {
        const updates = recalculatePredictionPoints({
          predictions,
          finalScore: { homeScore: finalHome, awayScore: finalAway },
          calculatedAt: now,
        });

        const byPoints = new Map<number, string[]>();
        for (const u of updates) {
          const list = byPoints.get(u.pointsAwarded) ?? [];
          list.push(u.id);
          byPoints.set(u.pointsAwarded, list);
        }

        await Promise.all(
          [...byPoints.entries()].map(([pts, ids]) =>
            tx.prediction.updateMany({
              where: { id: { in: ids } },
              data: { pointsAwarded: pts, calculatedAt: now },
            }),
          ),
        );
      }
    });
  } catch (err) {
    if ((err as Error).message === "ALREADY_PROCESSED") {
      return NextResponse.json({ error: "This score was already approved." }, { status: 409 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }
    console.error("[admin/matches/approve-score]", err);
    return NextResponse.json({ error: "Failed to approve match score." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
