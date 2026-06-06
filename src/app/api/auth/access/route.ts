import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { createSession, hashToken, isAccessTokenExpired } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPreviewMode } from "@/lib/app-mode";

export async function GET(request: NextRequest) {
  const base = new URL(request.url).origin;

  if (isPreviewMode()) {
    return NextResponse.redirect(`${base}/login?error=preview`);
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${base}/login?error=missing`);
  }

  const hash = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      accessTokenHash: hash,
      accessTokenRevokedAt: null,
      role: Role.USER,
    },
    select: { id: true, role: true, accessTokenCreatedAt: true },
  });

  if (!user) {
    return NextResponse.redirect(`${base}/login?error=invalid`);
  }

  if (isAccessTokenExpired(user.accessTokenCreatedAt)) {
    return NextResponse.redirect(`${base}/login?error=expired`);
  }

  await createSession({ userId: user.id, role: user.role });

  return NextResponse.redirect(`${base}/dashboard`);
}
