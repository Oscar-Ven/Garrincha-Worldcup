import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimActivationBonus } from "@/lib/activation-code";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { checkInSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in to use an activation code." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`activation-code:${user.id}`, 10, 60 * 1000))) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  const parsed = checkInSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid code." }, { status: 400 });
  }

  const session = await prisma.centerSession.findFirst({
    where: { code: parsed.data.code, expiresAt: { gt: new Date() } },
    select: { id: true, centerId: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 422 });
  }

  const result = await claimActivationBonus(user.id, session.id);

  if (result.alreadyClaimed) {
    return NextResponse.json({ ok: true, pointsAwarded: 0, message: "Bonus already claimed." });
  }

  return NextResponse.json({ ok: true, pointsAwarded: result.pointsAwarded });
}
