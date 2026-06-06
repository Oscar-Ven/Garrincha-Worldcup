import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { rejectCrossOriginRequest } from "@/lib/request-security";

const schema = z.object({
  fullName:    z.string().min(2).max(80).trim(),
  nickname:    z.string().min(2).max(40).trim(),
  nationality: z.string().max(60).trim().optional(),
  phoneNumber: z.string().max(30).trim().optional(),
});

export async function PATCH(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const user = await getCurrentUser();
  if (!user || user.role !== "USER") {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  if (!(await checkRateLimit(`user-profile:${user.id}`, 10, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { fullName, nickname, nationality, phoneNumber } = parsed.data;

  // Nickname uniqueness check (excluding self)
  if (nickname !== user.nickname) {
    const taken = await prisma.user.findFirst({
      where: { nickname, NOT: { id: user.id } },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json({ error: "That nickname is already taken." }, { status: 409 });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName,
      nickname,
      ...(nationality !== undefined ? { nationality } : {}),
      ...(phoneNumber !== undefined ? { phoneNumber } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
