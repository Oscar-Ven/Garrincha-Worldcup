import { MatchStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculatePredictionPoints } from "@/lib/product-logic";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { finalScoreSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = finalScoreSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid final score." }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id },
        data: {
          homeScore: parsed.data.homeScore,
          awayScore: parsed.data.awayScore,
          status: MatchStatus.FINAL,
          finalizedAt: new Date(),
          scoreSource: "manual",
        },
      });

      const predictions = await tx.prediction.findMany({
        where: { matchId: id },
        select: { id: true, userId: true, homeScore: true, awayScore: true },
      });
      const updates = recalculatePredictionPoints({
        predictions,
        finalScore: parsed.data,
        calculatedAt: new Date(),
      });

      for (const update of updates) {
        await tx.prediction.update({
          where: { id: update.id },
          data: {
            pointsAwarded: update.pointsAwarded,
            calculatedAt: update.calculatedAt,
          },
        });
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }
    console.error("[admin/matches/score]", err);
    return NextResponse.json({ error: "Failed to update match score." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
