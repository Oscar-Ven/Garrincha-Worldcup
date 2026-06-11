import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getBrusselsDate, getBrusselsEndOfDayUTC } from "@/lib/daily-bonus";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { z } from "zod";

const setCodeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  code: z.string().trim().min(1).max(16).toUpperCase(),
});

export async function GET(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? getBrusselsDate();

  const bonusCode = await prisma.dailyBonusCode.findFirst({
    where: { bonusDate: date, isActive: true },
    include: { _count: { select: { claims: true } } },
  });

  if (!bonusCode) {
    return NextResponse.json({ code: null, bonusDate: date, claimCount: 0 });
  }

  return NextResponse.json({
    code: bonusCode.code,
    bonusDate: bonusCode.bonusDate,
    points: bonusCode.points,
    expiresAt: bonusCode.expiresAt.toISOString(),
    claimCount: bonusCode._count.claims,
  });
}

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
  if (!(await checkRateLimit(`admin-daily-bonus:${ip}`, 30, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const parsed = setCodeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date (YYYY-MM-DD) or code (max 16 chars)." }, { status: 400 });
  }

  const { date, code } = parsed.data;

  await prisma.dailyBonusCode.updateMany({
    where: { bonusDate: date, isActive: true },
    data: { isActive: false },
  });

  const expiresAt = getBrusselsEndOfDayUTC(date);

  const newCode = await prisma.dailyBonusCode.create({
    data: { code, bonusDate: date, points: 3, createdByAdminId: admin.id, expiresAt, isActive: true },
  });

  return NextResponse.json({
    ok: true,
    code: newCode.code,
    bonusDate: newCode.bonusDate,
    points: newCode.points,
    expiresAt: newCode.expiresAt.toISOString(),
  });
}
