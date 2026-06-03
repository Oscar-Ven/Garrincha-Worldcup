import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { createSession, hashToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPreviewMode } from "@/lib/app-mode";

export async function GET(request: NextRequest) {
  if (isPreviewMode()) {
    return NextResponse.json(
      { error: "Access links require a live database." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Invalid access link." }, { status: 400 });
  }

  const hash = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      accessTokenHash: hash,
      accessTokenRevokedAt: null,
      role: Role.USER,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "This access link is invalid or has been revoked." },
      { status: 404 }
    );
  }

  console.log(`[auth/access] Session created for user: ${user.id}`);

  await createSession({ userId: user.id, role: user.role });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
