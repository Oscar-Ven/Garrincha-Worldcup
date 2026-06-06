import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { getMatchesForUser } from "@/lib/matches";
import { hasDatabaseConfig, demoUser, demoMatches } from "@/lib/ui-demo-data";

export default async function DashboardPage() {
  const locale = await getLocale();
  const user = hasDatabaseConfig() ? await getCurrentUser() : demoUser;
  if (!user) redirect("/login?next=/dashboard");

  const matches = hasDatabaseConfig() ? await getMatchesForUser(user.id) : demoMatches;

  return (
    <main data-locale={locale}>
      <p>TODO: player dashboard</p>
      <p>{matches.length} matches loaded for {user.email}</p>
    </main>
  );
}
