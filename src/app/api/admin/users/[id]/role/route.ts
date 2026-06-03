import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { userRoleSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let owner;
  try {
    owner = await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Super admin access required." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = userRoleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please select a valid role." }, { status: 400 });
  }

  if (id === owner.id && parsed.data.role !== Role.SUPER_ADMIN) {
    return NextResponse.json({ error: "The owner account must keep the super admin role." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
    });
  } catch (err) {
    console.error("[admin/users/role]", err);
    return NextResponse.json({ error: "Failed to update user role." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
