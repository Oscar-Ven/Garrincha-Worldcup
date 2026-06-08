import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { z } from "zod";

const createManagerSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  fullName: z.string().trim().min(2).max(120),
  nickname: z.string().trim().min(2).max(50),
  phoneNumber: z.string().trim().min(6).max(32),
  password: z.string().min(8),
  centerId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Super admin access required." }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`admin-create-user:${ip}`, 30, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const json = await request.json();
    const parsed = createManagerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form fields. Password must be at least 8 characters." }, { status: 400 });
    }

    const { email, fullName, nickname, phoneNumber, password, centerId } = parsed.data;

    // Check center exists
    const center = await prisma.garrinchaCenter.findUnique({
      where: { id: centerId },
      select: { id: true },
    });
    if (!center) {
      return NextResponse.json({ error: "Please select a valid GARRINCHA Center." }, { status: 422 });
    }

    // Check unique email and nickname
    const [existingEmail, existingNickname] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { nickname } }),
    ]);

    if (existingEmail) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }
    if (existingNickname) {
      return NextResponse.json({ error: "This nickname is already taken." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        nickname,
        displayName: nickname,
        phoneNumber,
        role: Role.CENTER_ADMIN,
        centerId,
        passwordHash,
        firstActivatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("[admin/users/create]", err);
    return NextResponse.json({ error: "Failed to create manager account." }, { status: 500 });
  }
}
