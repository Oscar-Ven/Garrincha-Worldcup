import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isPreviewMode } from "@/lib/app-mode";
import { prisma } from "@/lib/prisma";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { Role } from "@prisma/client";

const bodySchema = z.object({
  centerId: z.string().min(1),
});

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  if (user.role !== Role.USER) {
    return NextResponse.json(
      { error: "Only players can set a competition center." },
      { status: 403 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (isPreviewMode()) {
    return NextResponse.json({ ok: true, centerName: "Preview Center" });
  }

  if (user.competitionCenterLockedAt) {
    return NextResponse.json(
      { error: "Your competition center is locked after your first prediction." },
      { status: 423 },
    );
  }

  const { centerId } = parsed.data;

  let center: { id: string; name: string } | null = null;
  try {
    center = await prisma.garrinchaCenter.findUnique({
      where: { id: centerId },
      select: { id: true, name: true },
    });
  } catch (err) {
    console.error("[competition-center] center lookup failed", err);
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }

  if (!center) {
    return NextResponse.json({ error: "Competition center not found." }, { status: 404 });
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { competitionCenterId: centerId },
    });
  } catch (err) {
    console.error("[competition-center] update failed", err);
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, centerName: center.name });
}
