import { MatchStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { demoLeaderboard, demoMatches, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminPage() {
  const locale = await getLocale();
  let currentAdmin: Awaited<ReturnType<typeof requireAdmin>> | null = null;
  if (hasDatabaseConfig()) {
    try { currentAdmin = await requireAdmin(); }
    catch { redirect("/admin/login?next=/admin"); }
  }

  const isSuperAdmin = currentAdmin?.role === Role.SUPER_ADMIN || !hasDatabaseConfig();

  const [users, matches, predictions, centersCount, finalizedCount] = hasDatabaseConfig()
    ? await Promise.all([
        prisma.user.count({ where: { role: Role.USER } }),
        prisma.match.count(),
        prisma.prediction.count(),
        prisma.garrinchaCenter.count(),
        prisma.match.count({ where: { status: MatchStatus.FINAL } }),
      ])
    : [demoLeaderboard.length, demoMatches.length, demoMatches.filter((m) => m.predictions.length > 0).length, 10, 0];

  return (
    <main data-locale={locale} data-super-admin={String(isSuperAdmin)}>
      <p>TODO: admin dashboard</p>
      <p>{users} players · {matches} matches · {predictions} predictions · {centersCount} centers · {finalizedCount} finalized</p>
    </main>
  );
}
