import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BonusFormClient from "./BonusFormClient";

export const dynamic = "force-dynamic";

export default async function BonusPointsPage() {
  const admin = await getCurrentUser();
  if (!admin) {
    redirect("/dashboard/login");
  }

  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  const isManager = admin.role === "CENTER_ADMIN";

  if (!isOwner && !isManager) {
    redirect("/");
  }

  const centerId = admin.center?.id;

  // Retrieve players scoped to permissions
  const players = await prisma.user.findMany({
    where: isOwner
      ? { role: "USER" }
      : { role: "USER", competitionCenterId: centerId },
    select: {
      id: true,
      email: true,
      fullName: true,
      nickname: true,
      competitionCenter: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const serializedPlayers = players.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    nickname: p.nickname,
    email: p.email,
    centerName: p.competitionCenter?.name ?? "No Competition Center",
  }));

  return (
    <BonusFormClient
      currentUserRole={admin.role}
      centerName={admin.center?.name ?? ""}
      players={serializedPlayers}
    />
  );
}

