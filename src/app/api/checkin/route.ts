import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { checkInSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`checkin:${ip}`, 5, 60 * 1000))) {
    return NextResponse.json({ error: "Too many check-in attempts. Please try again shortly." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in to check in." }, { status: 401 });
  }
  if (!user.center) {
    return NextResponse.json({ error: "Your account is not linked to a valid center." }, { status: 400 });
  }

  const parsed = checkInSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid code." }, { status: 400 });
  }

  const session = await prisma.centerSession.findUnique({
    where: { code: parsed.data.code },
  });

  if (!session || session.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Invalid or expired code. Ask your center admin for today's code." }, { status: 404 });
  }

  try {
    await prisma.centerCheckIn.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        centerId: session.centerId,
        sessionId: session.id,
        expiresAt: session.expiresAt,
      },
      update: {
        centerId: session.centerId,
        sessionId: session.id,
        expiresAt: session.expiresAt,
      },
    });
  } catch (err) {
    console.error("[checkin]", err);
    return NextResponse.json({ error: "Check-in could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expiresAt: session.expiresAt.toISOString() });
}
