import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { rotateAndSendAccessLink } from "@/lib/access-link";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!(await checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again in 1 hour." },
      { status: 429 }
    );
  }

  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the registration fields." }, { status: 400 });
  }

  const {
    email,
    fullName,
    nickname,
    phoneNumber,
    activationCode,
    dateOfBirth,
    nationality,
  } = parsed.data;

  try {
    const session = await prisma.centerSession.findFirst({
      where: {
        code: activationCode,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Please scan the QR code at a GARRINCHA Center to start." },
        { status: 422 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Registration could not be completed." },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        nickname,
        displayName: nickname,
        phoneNumber,
        nationality: nationality ?? null,
        dateOfBirth: dateOfBirth ?? null,
        centerId: session.centerId,
        firstActivatedAt: new Date(),
        passwordHash: null,
        role: Role.USER,
      },
    });

    await rotateAndSendAccessLink(user.id, email);

    await createSession({ userId: user.id, role: user.role });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json(
      { error: "Registration is not available. Connect the database." },
      { status: 503 }
    );
  }
}
