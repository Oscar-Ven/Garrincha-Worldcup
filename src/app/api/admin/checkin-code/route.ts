import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireCenterAdmin } from "@/lib/auth";
import { generateSessionCode, getActiveSession, sessionExpiresAt } from "@/lib/checkin";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, rejectCrossOriginRequest } from "@/lib/request-security";
import { generateCodeSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let admin;
  try {
    admin = await requireCenterAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`admin-checkin-code:${ip}`, 60, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const centerId = searchParams.get("centerId") ?? admin.center?.id;
  if (!centerId) {
    return NextResponse.json({ error: "Your account is not linked to a center." }, { status: 403 });
  }

  if (admin.role === "CENTER_ADMIN" && centerId !== admin.center?.id) {
    return NextResponse.json({ error: "You can only view codes for your assigned center." }, { status: 403 });
  }

  const session = await getActiveSession(centerId);
  if (!session) {
    return NextResponse.json({ code: null, expiresAt: null });
  }
  return NextResponse.json({ code: session.code, expiresAt: session.expiresAt.toISOString() });
}

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let admin;
  try {
    admin = await requireCenterAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!(await checkRateLimit(`admin-checkin-code-gen:${ip}`, 30, 60 * 1000))) {
    return NextResponse.json({ error: "Too many code generation requests." }, { status: 429 });
  }

  const parsed = generateCodeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please specify a valid center." }, { status: 400 });
  }

  const { centerId } = parsed.data;

  if (admin.role === "CENTER_ADMIN" && centerId !== admin.center?.id) {
    return NextResponse.json(
      { error: "You can only generate codes for your assigned center." },
      { status: 403 },
    );
  }

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
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Concurrent request won the race for the same code — generate a fresh one.
      code = generateSessionCode();
      try {
        await prisma.centerSession.create({
          data: { centerId, code, expiresAt, createdBy: admin.email },
        });
      } catch (retryErr) {
        console.error("[admin/checkin-code] retry failed", retryErr);
        return NextResponse.json({ error: "Failed to generate code. Please try again." }, { status: 500 });
      }
    } else {
      console.error("[admin/checkin-code]", err);
      return NextResponse.json({ error: "Failed to generate code." }, { status: 500 });
    }
  }

  return NextResponse.json({ code, expiresAt: expiresAt.toISOString() });
}
