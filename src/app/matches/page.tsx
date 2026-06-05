import { getAllMatches } from "@/lib/matches";
import { hasDatabaseConfig } from "@/lib/app-mode";
import { demoAllMatches } from "@/lib/ui-demo-data";
import { MatchesClient, type PublicMatch } from "@/components/MatchesClient";

export const revalidate = 300;

export const metadata = {
  title: "World Cup 2026 Matches — GARRINCHA",
  description: "Full FIFA World Cup 2026 match schedule. Group stage, Round of 32, knockout rounds. Predict scores and climb the leaderboard.",
};

export default async function MatchesPage() {
  const hasDb = hasDatabaseConfig();

  const rawMatches = hasDb
    ? await getAllMatches().catch(() => demoAllMatches)
    : demoAllMatches;

  const matches: PublicMatch[] = rawMatches.map((m) => ({
    id: m.id,
    stage: m.stage,
    fifaMatchNo: m.fifaMatchNo ?? null,
    venue: m.venue ?? "",
    kickoffAt: m.kickoffAt instanceof Date ? m.kickoffAt.toISOString() : String(m.kickoffAt),
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    homeTeam: {
      id: m.homeTeam.id,
      name: m.homeTeam.name ?? "TBD",
      fifaCode: m.homeTeam.fifaCode ?? null,
      flagUrl: m.homeTeam.flagUrl ?? null,
      groupName: m.homeTeam.groupName ?? null,
    },
    awayTeam: {
      id: m.awayTeam.id,
      name: m.awayTeam.name ?? "TBD",
      fifaCode: m.awayTeam.fifaCode ?? null,
      flagUrl: m.awayTeam.flagUrl ?? null,
      groupName: m.awayTeam.groupName ?? null,
    },
  }));

  const groupMatches = matches.filter((m) => m.stage === "GROUP").length;
  const knockoutMatches = matches.length - groupMatches;

  return (
    <div className="matches-page">

      {/* ── Page hero ── */}
      <section className="page-hero">
        <div className="container page-hero-inner">
          <div>
            <div className="section-badge">FIFA WORLD CUP 2026</div>
            <h1 className="page-hero-title">Matches</h1>
            <p className="page-hero-lead">
              {matches.length} matches · {groupMatches} group stage · {knockoutMatches} knockout · Jun 11 – Jul 19, 2026
            </p>
          </div>
        </div>
      </section>

      {/* ── Match list ── */}
      <div className="matches-body">
        <div className="container">
          <MatchesClient matches={matches} />
        </div>
      </div>
    </div>
  );
}
