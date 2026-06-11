import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBrusselsDate } from "@/lib/daily-bonus";
import DailyBonusAdminClient from "./DailyBonusAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminDailyBonusPage() {
  const admin = await getCurrentUser();
  if (!admin) redirect("/dashboard/login");

  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  const isManager = admin.role === "CENTER_ADMIN";
  if (!isOwner && !isManager) redirect("/");

  const today = getBrusselsDate();

  const activeCode = await prisma.dailyBonusCode.findFirst({
    where: { bonusDate: today, isActive: true },
    include: { _count: { select: { claims: true } } },
  });

  return (
    <DailyBonusAdminClient
      today={today}
      currentCode={activeCode ? activeCode.code : null}
      claimCount={activeCode ? activeCode._count.claims : 0}
      expiresAt={activeCode ? activeCode.expiresAt.toISOString() : null}
    />
  );
}
