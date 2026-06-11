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

export async function GET(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  try {
    await requireCenterAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`check-in-codes-get:${ip}`, 60, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const today = getBrusselsDate();
  const active = await prisma.checkInCode.findFirst({
    where: { date: today, isActive: true },
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

  const today = getBrusselsDate();
  const expiresAt = getBrusselsEndOfDayUTC(today);

  // Deactivate today's code (if any) then generate a fresh one
  await prisma.checkInCode.updateMany({
    where: { date: today, isActive: true },
    data: { isActive: false },
  });

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
      date: today,
      expiresAt,
      createdByUserId: admin.id,
      isActive: true,
    },
  });

  return NextResponse.json({
    ok: true,
    code: created.code,
    date: created.date,
    expiresAt: created.expiresAt.toISOString(),
  });
}
