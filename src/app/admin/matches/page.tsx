import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { demoMatches, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminMatchesPage() {
  const locale = await getLocale();
  let admin: Awaited<ReturnType<typeof requireAdmin>> | null = null;
  if (hasDatabaseConfig()) {
    try { admin = await requireAdmin(); }
    catch { redirect("/admin/login?next=/admin/matches"); }
  }

  const matches = hasDatabaseConfig()
    ? await prisma.match.findMany({
        orderBy: [{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }],
        include: { homeTeam: true, awayTeam: true },
      })
    : demoMatches;

  return (
    <main data-locale={locale}>
      <p>TODO: admin matches — {matches.length} matches (admin: {admin?.email ?? "demo"})</p>
    </main>
  );
}
