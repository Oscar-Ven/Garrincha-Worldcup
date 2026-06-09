import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getSession, getCurrentUser } from "@/lib/auth";
import { isPreviewMode } from "@/lib/app-mode";
import { prisma } from "@/lib/prisma";
import { canSavePrediction } from "@/lib/product-logic";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { predictionSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`predictions:${ip}`, 60, 60 * 1000))) {
    return NextResponse.json({ error: "Too many prediction requests. Please slow down." }, { status: 429 });
  }

  const session = await getSession();
  const role =
    session?.role === Role.USER
      ? "USER"
      : session?.role === Role.ADMIN
        ? "ADMIN"
        : session?.role === Role.SUPER_ADMIN
          ? "SUPER_ADMIN"
          : undefined;

  const parsed = predictionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter valid scores." }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: parsed.data.matchId } });
  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }
  if (match.status !== "SCHEDULED") {
    return NextResponse.json({ error: "Predictions can only be submitted for scheduled matches." }, { status: 400 });
  }

  // Only save penalty fields for knockout matches where the prediction is a draw.
  const isKnockout = match.stage !== "GROUP";
  const isDraw = parsed.data.homeScore === parsed.data.awayScore;
  const penaltyWinner = isKnockout && isDraw ? (parsed.data.penaltyWinner ?? null) : null;
  const homePenaltyScore = penaltyWinner ? (parsed.data.homePenaltyScore ?? null) : null;
  const awayPenaltyScore = penaltyWinner ? (parsed.data.awayPenaltyScore ?? null) : null;

  if (!isPreviewMode() && session) {
    const user = await getCurrentUser();
    if (!user || !user.competitionCenterId) {
      return NextResponse.json(
        { error: "Choose the GARRINCHA Center you want to represent before predicting." },
        { status: 403 },
      );
    }
  }

  const existingPrediction = session
    ? await prisma.prediction.findUnique({
        where: { userId_matchId: { userId: session.userId, matchId: parsed.data.matchId } },
        select: { userId: true },
      })
    : null;

  const permission = canSavePrediction({
    session: session && role ? { userId: session.userId, role } : null,
    kickoffAt: match.kickoffAt,
    predictionUserId: existingPrediction?.userId,
  });
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.reason }, { status: permission.status });
  }
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.userId, matchId: parsed.data.matchId } },
    create: {
      userId: session.userId,
      matchId: parsed.data.matchId,
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      penaltyWinner,
      homePenaltyScore,
      awayPenaltyScore,
    },
    update: {
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      penaltyWinner,
      homePenaltyScore,
      awayPenaltyScore,
      pointsAwarded: 0,
      calculatedAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
