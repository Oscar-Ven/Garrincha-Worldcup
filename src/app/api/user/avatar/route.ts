import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rejectCrossOriginRequest } from "@/lib/request-security";

const MAX_SIZE_BYTES = 400_000; // 400 KB max (after canvas resize it's usually < 50KB)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function hasImageMagicBytes(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // GIF: GIF8
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
  // WebP: RIFF....WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true;
  return false;
}

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP and GIF images are allowed." }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Image must be under 400 KB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!hasImageMagicBytes(buffer)) {
      return NextResponse.json({ error: "File does not appear to be a valid image." }, { status: 400 });
    }

    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: dataUrl },
    });

    return NextResponse.json({ ok: true, avatarUrl: dataUrl });
  } catch (err) {
    console.error("[user/avatar]", err);
    return NextResponse.json({ error: "Failed to save avatar." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { avatarUrl: null },
    });
  } catch (err) {
    console.error("[user/avatar DELETE]", err);
    return NextResponse.json({ error: "Failed to remove avatar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
