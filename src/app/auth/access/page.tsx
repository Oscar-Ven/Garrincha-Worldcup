import { redirect } from "next/navigation";
import { isPreviewMode } from "@/lib/app-mode";
import { hashToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token || isPreviewMode()) {
    redirect("/login");
  }

  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: { accessTokenHash: tokenHash, accessTokenRevokedAt: null, role: Role.USER },
    select: { id: true, role: true },
  });

  if (!user) {
    redirect("/login");
  }

  redirect(`/api/auth/access?token=${encodeURIComponent(token)}`);
}