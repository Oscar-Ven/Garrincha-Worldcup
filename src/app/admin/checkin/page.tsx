import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBrusselsDate } from "@/lib/check-in-code";
import { prisma } from "@/lib/prisma";
import CheckinClient from "./CheckinClient";

export const dynamic = "force-dynamic";

export default async function CheckinManagerPage() {
  const admin = await getCurrentUser();
  if (!admin) redirect("/dashboard/login");

  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  const isManager = admin.role === "CENTER_ADMIN";

  if (!isOwner && !isManager) redirect("/");

  const today = getBrusselsDate();

  // Today's active global code
  const active = await prisma.checkInCode.findFirst({
    where: { date: today, isActive: true },
    include: { _count: { select: { claims: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Today's claims (all centers)
  const claims = await prisma.checkInClaim.findMany({
    where: { date: today },
    select: {
      id: true,
      claimedAt: true,
      user: { select: { fullName: true, nickname: true, email: true } },
    },
    orderBy: { claimedAt: "desc" },
    take: 50,
  });

  const serializedClaims = claims.map((c) => ({
    id: c.id,
    createdAt: c.claimedAt.toISOString(),
    fullName: c.user?.fullName ?? "Unknown",
    nickname: c.user?.nickname ?? "anonymous",
    email: c.user?.email ?? "",
  }));

  return (
    <CheckinClient
      currentUserRole={admin.role}
      initialActiveCode={active?.code ?? ""}
      initialExpiresAt={active?.expiresAt.toISOString() ?? ""}
      initialClaimCount={active?._count.claims ?? 0}
      initialClaims={serializedClaims}
      today={today}
    />
  );
}
