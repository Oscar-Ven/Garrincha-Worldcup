import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { demoBonusEvents, demoBonusUsers, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function BonusPage() {
  const locale = await getLocale();
  let admin: Awaited<ReturnType<typeof requireAdmin>> | null = null;
  if (hasDatabaseConfig()) {
    try { admin = await requireAdmin(); }
    catch { redirect("/admin/login?next=/admin/bonus"); }
  }

  const [users, events] = hasDatabaseConfig()
    ? await Promise.all([
        prisma.user.findMany({
          where: { role: Role.USER },
          orderBy: { email: "asc" },
          select: { id: true, email: true, displayName: true },
        }),
        prisma.pointEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 25,
          include: { user: { select: { email: true, displayName: true } } },
        }),
      ])
    : [demoBonusUsers, demoBonusEvents];

  return (
    <main data-locale={locale}>
      <p>TODO: bonus page — {users.length} users, {events.length} events (admin: {admin?.email ?? "demo"})</p>
    </main>
  );
}
