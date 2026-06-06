import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CheckinClient from "./CheckinClient";

export const dynamic = "force-dynamic";

export default async function CheckinManagerPage() {
  const admin = await getCurrentUser();
  if (!admin) {
    redirect("/admin/login");
  }

  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  const isManager = admin.role === "CENTER_ADMIN";

  if (!isOwner && !isManager) {
    redirect("/");
  }

  const centerId = admin.center?.id;

  // Retrieve centers list
  const centers = await prisma.garrinchaCenter.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  // Query recent physical check-ins with client relations
  const checkins = await prisma.centerCheckIn.findMany({
    where: isOwner
      ? {}
      : { centerId: centerId ?? undefined },
    select: {
      id: true,
      createdAt: true,
      user: {
        select: {
          fullName: true,
          nickname: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  // Convert checkins to clean standard format
  const serializedCheckins = checkins.map((c) => ({
    id: pId(c.id),
    createdAt: c.createdAt.toISOString(),
    fullName: c.user?.fullName ?? "Unknown Competitor",
    nickname: c.user?.nickname ?? "anonymous",
    email: c.user?.email ?? "",
  }));

  // Resolve current active/valid session for default center
  const targetCenterId = isOwner ? centers[0]?.id : centerId;
  let activeCode = "";
  let codeExpiresAt = "";

  if (targetCenterId) {
    const activeSession = await prisma.centerSession.findFirst({
      where: {
        centerId: targetCenterId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (activeSession) {
      activeCode = activeSession.code;
      codeExpiresAt = activeSession.expiresAt.toISOString();
    }
  }

  return (
    <CheckinClient
      currentUserRole={admin.role}
      adminCenterId={centerId ?? ""}
      initialCenters={centers}
      initialCheckins={serializedCheckins}
      initialActiveCode={activeCode}
      initialExpiresAt={codeExpiresAt}
    />
  );
}

// Simple fallback helper for typings key stability
function pId(val: string | undefined): string {
  return val ?? Math.random().toString();
}
