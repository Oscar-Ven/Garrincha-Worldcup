import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getBrusselsDate, getBrusselsEndOfDayUTC } from "@/lib/daily-bonus";
import { generateSessionCode } from "@/lib/checkin";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { z } from "zod";

const generateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

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
  if (!(await checkRateLimit(`admin-daily-bonus-gen:${ip}`, 30, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = generateSchema.safeParse(body);
  const date = (parsed.success && parsed.data.date) ? parsed.data.date : getBrusselsDate();

  await prisma.dailyBonusCode.updateMany({
    where: { bonusDate: date, isActive: true },
    data: { isActive: false },
  });

  const code = generateSessionCode();
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
