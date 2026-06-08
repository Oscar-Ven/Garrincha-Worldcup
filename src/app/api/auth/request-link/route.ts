import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest, rotateAndSendAccessLink } from "@/lib/access-link";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { requestLinkSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const originError = rejectCrossOriginRequest(request);
    if (originError) return originError;

    const ip = getClientIp(request);
    if (!(await checkRateLimit(`request-link:${ip}`, 5, 15 * 60 * 1000))) {
      return NextResponse.json({ error: "Too many attempts. Please try again in 15 minutes." }, { status: 429 });
    }

    const parsed = requestLinkSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const successResponse = NextResponse.json({
      ok: true,
      message: "If an account exists, a new access link has been sent to your email.",
    });

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || user.role !== Role.USER) return successResponse;

    // Non-blocking: always return success regardless of email outcome (security + resilience).
    try {
      await rotateAndSendAccessLink(user.id, user.email, getLocaleFromRequest(request));
    } catch (emailErr) {
      console.error("[auth/request-link] Email send failed:", (emailErr as Error).message);
    }

    return successResponse;
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("[auth/request-link] Fatal:", msg);
    return NextResponse.json({ error: "Service unavailable. Please try again later." }, { status: 503 });
  }
}
