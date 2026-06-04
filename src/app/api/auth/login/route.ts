import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromRequest, rotateAndSendAccessLink } from "@/lib/access-link";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { requestLinkSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const originError = rejectCrossOriginRequest(request);
    if (originError) return originError;

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (!(await checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000))) {
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

    await rotateAndSendAccessLink(user.id, user.email, getLocaleFromRequest(request));

    return successResponse;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Service unavailable. Please try again later." }, { status: 503 });
  }
}
