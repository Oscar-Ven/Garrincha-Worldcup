import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { canChangeSelfServiceCenter } from "@/lib/product-logic";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { rejectCrossOriginRequest } from "@/lib/request-security";

const schema = z.object({ centerId: z.string().min(1) });

export async function PUT(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const user = await getCurrentUser();
  if (!user || user.role !== "USER") {
    return NextResponse.json({ error: "Please log in to update your center." }, { status: 401 });
  }

  if (!(await checkRateLimit(`user-center:${user.id}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid center." }, { status: 400 });
  }

  const { centerId } = parsed.data;

  const center = await prisma.garrinchaCenter.findUnique({
    where: { id: centerId },
    select: { id: true, name: true },
  });
  if (!center) {
    return NextResponse.json({ error: "Please select a valid GARRINCHA Center." }, { status: 422 });
  }

  const permission = canChangeSelfServiceCenter({
    user: {
      competitionCenterId: user.competitionCenterId,
      competitionCenterLockedAt: user.competitionCenterLockedAt,
    },
    newCenterId: centerId,
  });
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.reason }, { status: permission.status });
  }

  // Atomic update: only proceeds if still unlocked (race-condition safe)
  const updated = await prisma.user.updateMany({
    where: { id: user.id, competitionCenterLockedAt: null },
    data: { competitionCenterId: centerId, competitionCenterLockedAt: new Date() },
  });

  if (updated.count === 0) {
    return NextResponse.json(
      { error: "You have already used your one center change. Please contact an admin to change your competition center." },
      { status: 403 },
    );
  }

  try {
    await prisma.centerChangeLog.create({
      data: {
        userId: user.id,
        fromCenterId: user.competitionCenterId ?? null,
        toCenterId: centerId,
        changedBy: user.email,
        changeType: "SELF_SERVICE",
      },
    });
  } catch (err) {
    console.error("[user/center] Failed to write change log:", err);
  }

  return NextResponse.json({ ok: true, centerId, centerName: center.name });
}
