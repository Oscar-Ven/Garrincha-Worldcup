import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getSession, getCurrentUser } from "@/lib/auth";
import { isPreviewMode } from "@/lib/app-mode";
import { prisma } from "@/lib/prisma";
import { canSavePrediction } from "@/lib/product-logic";
import { checkRateLimit } from "@/lib/rate-limit";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { predictionSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
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

  // session is non-null: canSavePrediction rejects null sessions above
  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session!.userId, matchId: parsed.data.matchId } },
    create: {
      userId: session!.userId,
      matchId: parsed.data.matchId,
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
    },
    update: {
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      pointsAwarded: 0,
      calculatedAt: null,
    },
  });

  // Lock the competition center on the player's first prediction.
  // updateMany with competitionCenterLockedAt: null means it only fires once and is a no-op on all subsequent predictions.
  if (!isPreviewMode()) {
    await prisma.user.updateMany({
      where: { id: session!.userId, competitionCenterLockedAt: null },
      data: { competitionCenterLockedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
