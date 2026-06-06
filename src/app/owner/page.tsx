import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { hasDatabaseConfig, demoLeaderboard, demoMatches } from "@/lib/ui-demo-data";

export const metadata = { title: "Owner Dashboard" };

export default async function OwnerPage() {
  const locale = await getLocale();
  let ownerEmail = "owner@garrincha.local";

  if (hasDatabaseConfig()) {
    try {
      const owner = await requireSuperAdmin();
      ownerEmail = owner.email;
    } catch {
      redirect("/admin/login?next=/owner");
    }
  }

  const [playerCount, matchCount] = hasDatabaseConfig()
    ? await Promise.all([
        prisma.user.count({ where: { role: Role.USER } }),
        prisma.match.count(),
      ])
    : [demoLeaderboard.length, demoMatches.length];

  return (
    <main data-locale={locale}>
      <p>TODO: owner dashboard — {playerCount} players, {matchCount} matches ({ownerEmail})</p>
    </main>
  );
}
