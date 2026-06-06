import { getAllMatches } from "@/lib/matches";
import { hasDatabaseConfig } from "@/lib/app-mode";
import { demoAllMatches } from "@/lib/ui-demo-data";

export const revalidate = 300;

export const metadata = {
  title: "World Cup 2026 Matches — GARRINCHA",
  description: "Full FIFA World Cup 2026 match schedule. Group stage, Round of 32, knockout rounds.",
};

export default async function MatchesPage() {
  const hasDb = hasDatabaseConfig();
  const matches = hasDb ? await getAllMatches().catch(() => demoAllMatches) : demoAllMatches;

  return (
    <main>
      <p>TODO: matches page ({matches.length} matches)</p>
    </main>
  );
}
