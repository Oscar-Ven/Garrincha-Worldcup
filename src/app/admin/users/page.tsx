import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
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

  // Query centers list for dropdown selections
  const centers = await prisma.garrinchaCenter.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  // Query users dataset
  let usersListQuery;

  if (isOwner) {
    // Owner sees all users
    usersListQuery = prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        nickname: true,
        role: true,
        phoneNumber: true,
        nationality: true,
        centerId: true,
        competitionCenterId: true,
        center: { select: { name: true } },
        competitionCenter: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    // Manager only sees player users matching their assigned center
    usersListQuery = prisma.user.findMany({
      where: {
        role: "USER",
        OR: [
          { centerId },
          { competitionCenterId: centerId },
        ],
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        nickname: true,
        role: true,
        phoneNumber: true,
        nationality: true,
        centerId: true,
        competitionCenterId: true,
        center: { select: { name: true } },
        competitionCenter: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  const [users, changeLogs] = await Promise.all([
    usersListQuery,
    isOwner
      ? prisma.centerChangeLog.findMany({
          take: 30,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { nickname: true, email: true } } },
        })
      : null,
  ]);

  const serializedUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    nickname: u.nickname,
    role: u.role,
    phoneNumber: u.phoneNumber ?? "",
    nationality: u.nationality ?? "",
    centerId: u.centerId,
    competitionCenterId: u.competitionCenterId ?? "",
    centerName: u.center?.name ?? "—",
    competitionCenterName: u.competitionCenter?.name ?? "—",
    createdAt: u.createdAt.toISOString(),
  }));

  const serializedLogs = changeLogs
    ? changeLogs.map((l) => ({
        id: l.id,
        userNickname: l.user?.nickname ?? l.user?.email ?? "Unknown",
        fromCenterName: centers.find((c) => c.id === l.fromCenterId)?.name ?? "—",
        toCenterName: centers.find((c) => c.id === l.toCenterId)?.name ?? "—",
        changedBy: l.changedBy,
        createdAt: l.createdAt.toISOString(),
      }))
    : [];

  return (
    <UsersClient
      currentUserRole={admin.role}
      currentUserId={admin.id}
      initialUsers={serializedUsers}
      centers={centers}
      logs={serializedLogs}
    />
  );
}

