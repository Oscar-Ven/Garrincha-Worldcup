import { MatchStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculatePredictionPoints } from "@/lib/product-logic";
import { checkRateLimit } from "@/lib/rate-limit";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { finalScoreSchema } from "@/lib/validators";

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

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!(await checkRateLimit(`admin-score:${ip}`, 120, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await params;
  const parsed = finalScoreSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid final score." }, { status: 400 });
  }

  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id },
        data: {
          homeScore: parsed.data.homeScore,
          awayScore: parsed.data.awayScore,
          status: MatchStatus.FINAL,
          finalizedAt: now,
          scoreSource: "manual",
          scoreSyncStatus: null,
        },
      });

      const predictions = await tx.prediction.findMany({
        where: { matchId: id },
        select: { id: true, userId: true, homeScore: true, awayScore: true },
      });

      const updates = recalculatePredictionPoints({
        predictions,
        finalScore: parsed.data,
        calculatedAt: now,
      });

      // Batch updates by points category (at most 4: 0/2/3/5).
      // Reduces N sequential UPDATEs to ≤4 updateMany calls.
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
