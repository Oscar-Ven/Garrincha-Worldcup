import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAwardBonus } from "@/lib/product-logic";
import { checkRateLimit } from "@/lib/rate-limit";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { bonusSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!(await checkRateLimit(`admin-bonus:${ip}`, 120, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const parsed = bonusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid bonus award." }, { status: 400 });
  }

  const bonusPermission = canAwardBonus({
    session: { userId: admin.id, role: admin.role },
    reason: parsed.data.reason,
  });
  if (!bonusPermission.allowed) {
    return NextResponse.json({ error: bonusPermission.reason }, { status: bonusPermission.status });
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  try {
    await prisma.pointEvent.create({
      data: {
        userId: parsed.data.userId,
        points: parsed.data.points,
        reason: parsed.data.reason,
        awardedBy: admin.email,
      },
    });
  } catch (err) {
    console.error("[admin/bonus]", err);
    return NextResponse.json({ error: "Failed to award bonus points." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
