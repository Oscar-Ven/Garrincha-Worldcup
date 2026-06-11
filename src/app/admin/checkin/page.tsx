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

  const centerId = admin.center?.id;
  const today = getBrusselsDate();

  const centers = await prisma.garrinchaCenter.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  // Today's claims (who already claimed check-in bonus)
  const targetCenterId = isOwner ? centers[0]?.id : centerId;
  const claims = await prisma.checkInClaim.findMany({
    where: {
      date: today,
      centerId: isOwner ? undefined : (centerId ?? undefined),
    },
    select: {
      id: true,
      claimedAt: true,
      centerId: true,
      user: { select: { fullName: true, nickname: true, email: true } },
    },
    orderBy: { claimedAt: "desc" },
    take: 40,
  });

  const serializedClaims = claims.map((c) => ({
    id: c.id,
    createdAt: c.claimedAt.toISOString(),
    fullName: c.user?.fullName ?? "Unknown",
    nickname: c.user?.nickname ?? "anonymous",
    email: c.user?.email ?? "",
    centerId: c.centerId,
  }));

  // Active check-in code for default center
  let activeCode = "";
  let codeExpiresAt = "";
  let claimCount = 0;

  if (targetCenterId) {
    const active = await prisma.checkInCode.findFirst({
      where: { centerId: targetCenterId, date: today, isActive: true },
      include: { _count: { select: { claims: true } } },
      orderBy: { createdAt: "desc" },
    });
    if (active) {
      activeCode = active.code;
      codeExpiresAt = active.expiresAt.toISOString();
      claimCount = active._count.claims;
    }
  }

  return (
    <CheckinClient
      currentUserRole={admin.role}
      adminCenterId={centerId ?? ""}
      initialCenters={centers}
      initialClaims={serializedClaims}
      initialActiveCode={activeCode}
      initialExpiresAt={codeExpiresAt}
      initialClaimCount={claimCount}
      today={today}
    />
  );
}
