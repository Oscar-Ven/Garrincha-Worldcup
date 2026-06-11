import { Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { getLocaleFromRequest, rotateAndSendAccessLink } from "@/lib/access-link";
import { getBrusselsDate } from "@/lib/check-in-code";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const ip = getClientIp(request);
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
    centerId: directCenterId,
    nationality,
  } = parsed.data;

  try {
    // ── Resolve center ──────────────────────────────────────────────────────
    // 1. Check-in code: validate against CheckInCode (daily, per-center) → +3 bonus
    // 2. Direct registration: use centerId provided directly by the user
    let resolvedCenterId: string;
    let checkInCodeForBonus: { id: string; centerId: string } | null = null;

    if (activationCode && activationCode.length > 0) {
      const today = getBrusselsDate();
      const checkInCode = await prisma.checkInCode.findFirst({
        where: {
          code: activationCode.trim().toUpperCase(),
          isActive: true,
          date: today,
          expiresAt: { gt: new Date() },
        },
        select: { id: true, centerId: true },
      });
      if (!checkInCode) {
        return NextResponse.json(
          { error: "Invalid or expired center check-in code." },
          { status: 422 }
        );
      }
      resolvedCenterId = checkInCode.centerId;
      checkInCodeForBonus = checkInCode;
    } else if (directCenterId) {
      // Direct registration: verify centerId exists
      const center = await prisma.garrinchaCenter.findUnique({
        where: { id: directCenterId },
        select: { id: true },
      });
      if (!center) {
        return NextResponse.json(
          { error: "Please select a valid GARRINCHA Center." },
          { status: 422 }
        );
      }
      resolvedCenterId = directCenterId;
    } else {
      return NextResponse.json(
        { error: "Please select a GARRINCHA Center to register." },
        { status: 422 }
      );
    }

    // ── Create user ─────────────────────────────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Request your access link to continue." },
        { status: 400 }
      );
    }

    const nicknameExists = await prisma.user.findUnique({ where: { nickname } });
    if (nicknameExists) {
      return NextResponse.json(
        { error: "This nickname is already taken. Please choose a different one." },
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
        centerId: resolvedCenterId,
        competitionCenterId: resolvedCenterId,
        firstActivatedAt: new Date(),
        passwordHash: null,
        role: Role.USER,
      },
    });

    // Award +3 check-in bonus if registration used a valid check-in code
    if (checkInCodeForBonus) {
      try {
        await prisma.$transaction([
          prisma.checkInClaim.create({
            data: {
              userId: user.id,
              checkInCodeId: checkInCodeForBonus.id,
              centerId: checkInCodeForBonus.centerId,
              date: getBrusselsDate(),
              pointsAwarded: 3,
            },
          }),
          prisma.pointEvent.create({
            data: {
              userId: user.id,
              points: 3,
              reason: "Attendance check-in bonus",
              awardedBy: "system",
            },
          }),
        ]);
      } catch {
        // Duplicate claim on same day is safe to ignore (shouldn't happen on fresh registration)
      }
    }

    // Send access link — non-blocking: user is already created.
    // If email fails (Resend not configured, domain unverified, etc.)
    // the user can request a new link from /login.
    try {
      await rotateAndSendAccessLink(user.id, email, getLocaleFromRequest(request));
    } catch (emailErr) {
      console.error("[auth/register] Email send failed (user created, can request new link):", (emailErr as Error).message);
    }

    await createSession({ userId: user.id, role: user.role });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        const field = Array.isArray(err.meta?.target) ? (err.meta.target as string[])[0] : "field";
        if (field === "email") {
          return NextResponse.json(
            { error: "An account with this email already exists. Request your access link to continue." },
            { status: 409 },
          );
        }
        return NextResponse.json(
          { error: "This nickname is already taken. Please choose a different one." },
          { status: 409 },
        );
      }
    }
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("[auth/register] Fatal:", msg);
    return NextResponse.json(
      { error: "Registration is not available. Please try again later." },
      { status: 503 }
    );
  }
}
