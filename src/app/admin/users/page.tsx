import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { demoLeaderboard, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminUsersPage() {
  const locale = await getLocale();
  let ownerName: string | null = null;

  if (hasDatabaseConfig()) {
    try {
      const owner = await requireSuperAdmin();
      ownerName = owner.fullName ?? owner.displayName;
    } catch {
      redirect("/admin/login?next=/admin/users");
    }
  }

  const users = hasDatabaseConfig()
    ? await prisma.user.findMany({
        orderBy: [{ role: "desc" }, { email: "asc" }],
        select: {
          id: true,
          email: true,
          displayName: true,
          nationality: true,
          role: true,
          center: { select: { name: true } },
        },
      })
    : demoLeaderboard.map((row, index) => ({
        id: row.id,
        email: `${row.name.toLowerCase().replaceAll(" ", ".")}@example.com`,
        displayName: row.name,
        nationality: row.nationality,
        role: index === 0 ? Role.SUPER_ADMIN : index === 1 ? Role.ADMIN : Role.USER,
        center: { name: row.center },
      }));

  return (
    <main data-locale={locale}>
      <p>TODO: users page — {users.length} users (owner: {ownerName ?? "demo"})</p>
    </main>
  );
}
