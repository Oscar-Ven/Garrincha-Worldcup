import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateSessionCode, getActiveSession, sessionExpiresAt } from "@/lib/checkin";
import { prisma } from "@/lib/prisma";
import { rejectCrossOriginRequest } from "@/lib/request-security";
import { generateCodeSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const centerId = searchParams.get("centerId") ?? admin.center.id;

  const session = await getActiveSession(centerId);
  if (!session) {
    return NextResponse.json({ code: null, expiresAt: null });
  }
  return NextResponse.json({ code: session.code, expiresAt: session.expiresAt.toISOString() });
}

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const parsed = generateCodeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please specify a valid center." }, { status: 400 });
  }

  const { centerId } = parsed.data;

  const center = await prisma.garrinchaCenter.findUnique({ where: { id: centerId } });
  if (!center) {
    return NextResponse.json({ error: "Center not found." }, { status: 404 });
  }

  let code: string;
  let attempts = 0;
  do {
    code = generateSessionCode();
    attempts++;
  } while (attempts < 10 && await prisma.centerSession.findUnique({ where: { code } }));

  const expiresAt = sessionExpiresAt();

  try {
    await prisma.centerSession.create({
      data: { centerId, code, expiresAt, createdBy: admin.email },
    });
  } catch (err) {
    console.error("[admin/checkin-code]", err);
    return NextResponse.json({ error: "Failed to generate code." }, { status: 500 });
  }

  return NextResponse.json({ code, expiresAt: expiresAt.toISOString() });
}
