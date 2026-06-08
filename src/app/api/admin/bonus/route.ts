import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAwardBonus } from "@/lib/product-logic";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { bonusSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`admin-bonus:${ip}`, 120, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const parsed = bonusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid bonus award." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, competitionCenterId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const bonusPermission = canAwardBonus({
    session: { userId: admin.id, role: admin.role, centerId: admin.center?.id ?? null },
    reason: parsed.data.reason,
    targetCompetitionCenterId: user.competitionCenterId,
  });
  if (!bonusPermission.allowed) {
    return NextResponse.json({ error: bonusPermission.reason }, { status: bonusPermission.status });
  }

  const recentDuplicate = await prisma.pointEvent.findFirst({
    where: {
      userId: parsed.data.userId,
      points: parsed.data.points,
      reason: parsed.data.reason,
      awardedBy: admin.email,
      createdAt: { gte: new Date(Date.now() - 30_000) },
    },
  });
  if (recentDuplicate) {
    return NextResponse.json(
      { error: "This bonus was already awarded. Wait 30 seconds before awarding again." },
      { status: 409 },
    );
  }

  try {
    await prisma.pointEvent.create({
      data: {
        userId: parsed.data.userId,
        points: parsed.data.points,
        reason: parsed.data.reason,
        awardedBy: admin.email,
      },
    });
  } catch (err) {
    console.error("[admin/bonus]", err);
    return NextResponse.json({ error: "Failed to award bonus points." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
