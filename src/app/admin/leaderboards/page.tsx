import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LeaderboardsClient from "./LeaderboardsClient";
import { LeaderboardInputUser } from "@/lib/product-logic";

export const dynamic = "force-dynamic";

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ centerId?: string }>;
}) {
  const admin = await getCurrentUser();
  if (!admin) {
    redirect("/admin/login");
  }

  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  const isManager = admin.role === "CENTER_ADMIN";

  if (!isOwner && !isManager) {
    redirect("/");
  }

  const managerCenterId = admin.center?.id;

  // Enforce server-side protection on query filters:
  // If Manager, lock filter strictly to their assigned center
  const params = await searchParams;
  const filteredCenterId = isOwner
    ? params.centerId || "global"
    : managerCenterId || "";

  // Query centers list for dropdown select box
  const centers = await prisma.garrinchaCenter.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  // Query players dataset
  const poolQuery = prisma.user.findMany({
    where: {
      role: "USER",
      competitionCenterId:
        filteredCenterId === "global" || !filteredCenterId
          ? { not: null }
          : filteredCenterId,
    },
    select: {
      id: true,
      displayName: true,
      nickname: true,
      fullName: true,
      email: true,
      nationality: true,
      competitionCenter: { select: { name: true } },
      predictions: { select: { pointsAwarded: true } },
      pointEvents: { select: { points: true } },
    },
  }) as unknown as Promise<LeaderboardInputUser[]>;

  const players = await poolQuery;

  return (
    <LeaderboardsClient
      currentUserRole={admin.role}
      managerCenterId={managerCenterId ?? ""}
      initialCenterSelection={filteredCenterId}
      centers={centers}
      rawPlayers={players}
    />
  );
}