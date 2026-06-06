import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { z } from "zod";

const updateManagerSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  nickname: z.string().trim().min(2).max(50).optional(),
  phoneNumber: z.string().trim().min(6).max(32).optional(),
  centerId: z.string().min(1).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Super admin access required." }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!(await checkRateLimit(`admin-users-patch:${ip}`, 30, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await params;
  try {
    const json = await request.json();
    const parsed = updateManagerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form fields." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const data: Record<string, string | null> = {};

    if (parsed.data.fullName !== undefined) data.fullName = parsed.data.fullName;
    if (parsed.data.phoneNumber !== undefined) data.phoneNumber = parsed.data.phoneNumber;
    if (parsed.data.centerId !== undefined) {
      const center = await prisma.garrinchaCenter.findUnique({ where: { id: parsed.data.centerId } });
      if (!center) {
        return NextResponse.json({ error: "Invalid GARRINCHA Center." }, { status: 422 });
      }
      data.centerId = parsed.data.centerId;
    }

    if (parsed.data.nickname !== undefined && parsed.data.nickname !== user.nickname) {
      const nicknameExists = await prisma.user.findUnique({ where: { nickname: parsed.data.nickname } });
      if (nicknameExists) {
        return NextResponse.json({ error: "This nickname is already taken." }, { status: 400 });
      }
      data.nickname = parsed.data.nickname;
      data.displayName = parsed.data.nickname;
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true, user: { id: updated.id } });
  } catch (err) {
    console.error("[admin/users/patch]", err);
    return NextResponse.json({ error: "Failed to update user details." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let owner;
  try {
    owner = await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Super admin access required." }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!(await checkRateLimit(`admin-users:${ip}`, 30, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await params;

  if (id === owner.id) {
    return NextResponse.json({ error: "You cannot delete the owner account." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    return NextResponse.json({ error: "Owner accounts are protected from deletion." }, { status: 403 });
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (err) {
    console.error("[admin/users/delete]", err);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
