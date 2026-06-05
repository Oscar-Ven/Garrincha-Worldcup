import { getAllMatches } from "@/lib/matches";
import { hasDatabaseConfig } from "@/lib/app-mode";
import { demoAllMatches } from "@/lib/ui-demo-data";
import { MatchesClient, type PublicMatch } from "@/components/MatchesClient";

// Revalidate every 5 minutes — match data changes only on admin score updates.
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

  const totalMatches = matches.length;
  const groupMatches = matches.filter((m) => m.stage === "GROUP").length;
  const knockoutMatches = totalMatches - groupMatches;

  return (
    <div className="matches-page">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="matches-page-header">
        <div className="matches-page-header-inner">
          <h1 className="matches-page-title">Matches</h1>
          <p className="matches-page-subtitle">
            {totalMatches} matches &middot; {groupMatches} group stage &middot; {knockoutMatches} knockout &middot; Jun 11 – Jul 19, 2026
          </p>
        </div>
      </div>

      {/* ── Interactive match list ────────────────────────────────────────── */}
      <div className="matches-page-body">
        <MatchesClient matches={matches} />
      </div>

      <style>{`
        .matches-page {
          min-height: 100vh;
          background: #F8FAFB;
        }

        .matches-page-header {
          background: #FFFFFF;
          border-bottom: 1px solid #E5E7EB;
          padding: 2.5rem 1rem 2rem;
        }

        .matches-page-header-inner {
          max-width: 900px;
          margin-inline: auto;
        }

        .matches-page-title {
          font-size: clamp(2rem, 5vw, 3rem);
          color: #1B4332;
          margin-bottom: 0.5rem;
        }

        .matches-page-subtitle {
          font-size: 0.9375rem;
          color: #6B7280;
          line-height: 1.5;
        }

        .matches-page-body {
          max-width: 900px;
          margin-inline: auto;
          padding: 2rem 1rem 4rem;
        }

        @media (max-width: 480px) {
          .matches-page-header {
            padding: 1.5rem 0.75rem 1.25rem;
          }
          .matches-page-body {
            padding: 1rem 0.75rem 3rem;
          }
        }
      `}</style>
    </div>
  );
}
