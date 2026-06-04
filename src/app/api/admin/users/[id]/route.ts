import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { rejectCrossOriginRequest } from "@/lib/request-security";

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

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (err) {
    console.error("[admin/users/delete]", err);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
