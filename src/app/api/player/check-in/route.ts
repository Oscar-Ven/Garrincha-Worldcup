import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimCheckIn } from "@/lib/check-in-code";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { checkInSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Please log in to claim check-in bonus." },
      { status: 401 },
    );
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`player-checkin:${user.id}:${ip}`, 10, 60 * 1000))) {
    return NextResponse.json({ ok: false, error: "Too many attempts." }, { status: 429 });
  }

  const parsed = checkInSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please enter a valid code." }, { status: 400 });
  }

  const result = await claimCheckIn(user.id, parsed.data.code);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  if (result.pointsAwarded === 0) {
    return NextResponse.json({
      ok: true,
      pointsAwarded: 0,
      message: result.message,
    });
  }

  return NextResponse.json({
    ok: true,
    pointsAwarded: 3,
    message: "Check-in confirmed. You earned +3 points.",
  });
}
