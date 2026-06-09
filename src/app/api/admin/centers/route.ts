import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin || (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, city, country } = body as { name?: string; city?: string; country?: string };

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Center name is required (min 2 characters)." }, { status: 400 });
  }
  if (!city || typeof city !== "string" || city.trim().length < 2) {
    return NextResponse.json({ error: "City is required." }, { status: 400 });
  }
  if (!country || typeof country !== "string" || country.trim().length < 2) {
    return NextResponse.json({ error: "Country is required." }, { status: 400 });
  }

  try {
    const center = await prisma.garrinchaCenter.create({
      data: {
        name: name.trim(),
        city: city.trim(),
        country: country.trim(),
        bannerUrl: null,
      },
    });
    return NextResponse.json({ ok: true, center });
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr?.code === "P2002") {
      return NextResponse.json({ error: "A center with this name already exists." }, { status: 409 });
    }
    console.error("[admin/centers POST]", err);
    return NextResponse.json({ error: "Failed to create center." }, { status: 500 });
  }
}
