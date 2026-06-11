import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimDailyBonus } from "@/lib/daily-bonus";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { checkInSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Please log in to claim the daily bonus." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`daily-bonus:${ip}:${user.id}`, 10, 60 * 1000))) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  const parsed = checkInSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please enter a valid code." }, { status: 400 });
  }

  const result = await claimDailyBonus(user.id, parsed.data.code);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  if (result.pointsAwarded === 0) {
    return NextResponse.json({ ok: true, pointsAwarded: 0, message: result.message });
  }

  return NextResponse.json({ ok: true, pointsAwarded: result.pointsAwarded, message: "Daily attendance bonus claimed. +3 points!" });
}
