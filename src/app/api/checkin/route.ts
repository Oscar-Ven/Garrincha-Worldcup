import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimCheckIn } from "@/lib/check-in-code";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { checkInSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`checkin:${ip}`, 5, 60 * 1000))) {
    return NextResponse.json({ error: "Too many check-in attempts. Please try again shortly." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in to check in." }, { status: 401 });
  }

  const parsed = checkInSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid code." }, { status: 400 });
  }

  const result = await claimCheckIn(user.id, parsed.data.code);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 422 });
  }

  return NextResponse.json({ ok: true, pointsAwarded: result.pointsAwarded });
}
