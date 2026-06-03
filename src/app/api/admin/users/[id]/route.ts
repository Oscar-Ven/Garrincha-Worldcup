import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rejectCrossOriginRequest } from "@/lib/request-security";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const originError = rejectCrossOriginRequest(_request);
  if (originError) return originError;

  let owner;
  try {
    owner = await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Super admin access required." }, { status: 403 });
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
