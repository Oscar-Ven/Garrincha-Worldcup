import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";

const schema = z.object({ centerId: z.string().min(1) });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  // CENTER_ADMIN cannot correct player centers — only ADMIN or SUPER_ADMIN
  if (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only an admin or super admin can correct a player's competition center." },
      { status: 403 },
    );
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`admin-center:${ip}`, 30, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id: userId } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid center." }, { status: 400 });
  }

  const { centerId } = parsed.data;

  const [center, targetUser] = await Promise.all([
    prisma.garrinchaCenter.findUnique({ where: { id: centerId }, select: { id: true } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, competitionCenterId: true },
    }),
  ]);

  if (!center) {
    return NextResponse.json({ error: "Please select a valid GARRINCHA Center." }, { status: 422 });
  }
  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (targetUser.role !== "USER") {
    return NextResponse.json({ error: "Competition center can only be set for players." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { competitionCenterId: centerId },
    }),
    prisma.centerChangeLog.create({
      data: {
        userId,
        fromCenterId: targetUser.competitionCenterId ?? null,
        toCenterId: centerId,
        changedBy: admin.email,
        changeType: "ADMIN_CORRECTION",
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}