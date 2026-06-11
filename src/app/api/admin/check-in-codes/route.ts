import { NextRequest, NextResponse } from "next/server";
import { requireCenterAdmin } from "@/lib/auth";
import {
  generateCheckInCode,
  getBrusselsDate,
  getBrusselsEndOfDayUTC,
} from "@/lib/check-in-code";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { generateCodeSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let admin;
  try {
    admin = await requireCenterAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`check-in-codes-get:${ip}`, 60, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const centerId = searchParams.get("centerId") ?? admin.center?.id;

  if (!centerId) {
    return NextResponse.json({ error: "Center ID required." }, { status: 400 });
  }

  if (admin.role === "CENTER_ADMIN" && centerId !== admin.center?.id) {
    return NextResponse.json(
      { error: "You can only view codes for your assigned center." },
      { status: 403 },
    );
  }

  const today = getBrusselsDate();
  const active = await prisma.checkInCode.findFirst({
    where: { centerId, date: today, isActive: true },
    include: { _count: { select: { claims: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!active) {
    return NextResponse.json({ code: null, expiresAt: null, claimCount: 0 });
  }

  return NextResponse.json({
    code: active.code,
    expiresAt: active.expiresAt.toISOString(),
    claimCount: active._count.claims,
  });
}

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let admin;
  try {
    admin = await requireCenterAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  // Only owners can generate check-in codes
  if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only owners can generate check-in codes." },
      { status: 403 },
    );
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`check-in-codes-gen:${ip}`, 30, 60 * 1000))) {
    return NextResponse.json({ error: "Too many code generation requests." }, { status: 429 });
  }

  const parsed = generateCodeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please specify a valid center." }, { status: 400 });
  }

  const { centerId } = parsed.data;

  const center = await prisma.garrinchaCenter.findUnique({ where: { id: centerId } });
  if (!center) {
    return NextResponse.json({ error: "Center not found." }, { status: 404 });
  }

  const today = getBrusselsDate();
  const expiresAt = getBrusselsEndOfDayUTC(today);

  // Deactivate any existing codes for this center today
  await prisma.checkInCode.updateMany({
    where: { centerId, date: today, isActive: true },
    data: { isActive: false },
  });

  // Generate a unique code
  let code: string;
  let attempts = 0;
  do {
    code = generateCheckInCode();
    attempts++;
  } while (
    attempts < 10 &&
    (await prisma.checkInCode.findFirst({ where: { code, date: today, isActive: true } }))
  );

  const created = await prisma.checkInCode.create({
    data: {
      code,
      centerId,
      date: today,
      expiresAt,
      createdByUserId: admin.id,
      isActive: true,
    },
  });

  return NextResponse.json({
    ok: true,
    code: created.code,
    centerId: created.centerId,
    date: created.date,
    expiresAt: created.expiresAt.toISOString(),
  });
}
