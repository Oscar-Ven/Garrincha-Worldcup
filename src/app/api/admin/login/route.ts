import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const originError = rejectCrossOriginRequest(request);
    if (originError) return originError;

    const ip = getClientIp(request);
    if (!(await checkRateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000))) {
      return NextResponse.json({ error: "Too many login attempts. Please try again in 15 minutes." }, { status: 429 });
    }

    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid login details." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (
      !user ||
      (user.role !== Role.ADMIN && user.role !== Role.CENTER_ADMIN && user.role !== Role.SUPER_ADMIN) ||
      !user.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))
    ) {
      return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
    }

    await createSession({ userId: user.id, role: user.role });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/login]", err);
    return NextResponse.json({ error: "Database not available. Connect Supabase to enable live login." }, { status: 503 });
  }
}
