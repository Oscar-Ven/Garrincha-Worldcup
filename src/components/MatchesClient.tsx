"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { isoCodeForTeam } from "@/lib/flags";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PublicMatch = {
  id: string;
  stage: string;
  fifaMatchNo: number | null;
  venue: string;
  kickoffAt: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { id: string; name: string; fifaCode: string | null; flagUrl: string | null; groupName: string | null };
  awayTeam: { id: string; name: string; fifaCode: string | null; flagUrl: string | null; groupName: string | null };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanTeamName(name: string): string {
  if (!name || name.startsWith("TBD")) return "TBD";
  return name;
}

function isKnockout(match: PublicMatch): boolean {
  return match.stage !== "GROUP";
}

function formatKickoffTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" });
}

function formatGroupDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Europe/Brussels",
  });
}

function dateKey(iso: string): string {
  const d = new Date(iso);
  // YYYY-MM-DD in Brussels time as a stable sort key
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Brussels" }); // "en-CA" gives ISO date
}

function getStatus(match: PublicMatch): "upcoming" | "live" | "finished" {
  if (match.homeScore !== null && match.awayScore !== null) return "finished";
  const ko = new Date(match.kickoffAt);
  const now = new Date();
  if (now >= ko) {
    const plus2h = new Date(ko.getTime() + 2 * 60 * 60 * 1000);
    return now < plus2h ? "live" : "upcoming";
  }
  return "upcoming";
}

// ─── Flag Image ───────────────────────────────────────────────────────────────

function TeamFlag({ team }: { team: PublicMatch["homeTeam"] }) {
  const iso = isoCodeForTeam(team);
  if (!iso) {
    return <span className="match-flag-placeholder" aria-hidden>?</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/countries/${iso.toLowerCase()}.svg`}
      alt={`${team.name} flag`}
      className="match-flag"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ match }: { match: PublicMatch }) {
  const status = getStatus(match);
  const time = formatKickoffTime(match.kickoffAt);
  const isFinished = status === "finished";
  const isLive = status === "live";

  return (
    <article className="match-card">
      <div className="match-teams">
        {/* Home */}
        <div className="match-team match-team--home">
          <TeamFlag team={match.homeTeam} />
          <span className="match-team-name">{cleanTeamName(match.homeTeam.name)}</span>
        </div>

        {/* Centre col */}
        <div className="match-center">
          {isFinished ? (
            <div className="match-score">
              <span>{match.homeScore}</span>
              <span className="match-score-sep">–</span>
              <span>{match.awayScore}</span>
            </div>
          ) : (
            <>
              <span className={`match-time${isLive ? " match-time--live" : ""}`}>{isLive ? "LIVE" : time}</span>
              <span className="match-vs">vs</span>
            </>
          )}
        </div>

        {/* Away */}
        <div className="match-team match-team--away">
          <span className="match-team-name">{cleanTeamName(match.awayTeam.name)}</span>
          <TeamFlag team={match.awayTeam} />
        </div>
      </div>

      {/* Card footer */}
      <div className="match-card-foot">
        {!isFinished && (
          <span className="match-kickoff-label">{time}</span>
        )}
        {isFinished && (
          <span className="match-finished-label">Full time</span>
        )}
        <Link href="/dashboard" className="match-predict-btn">
          Predict now
        </Link>
      </div>
    </article>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type FilterValue = "all" | "group" | "knockout";

export function MatchesClient({ matches }: { matches: PublicMatch[] }) {
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered = useMemo(() => {
    if (filter === "group") return matches.filter((m) => !isKnockout(m));
    if (filter === "knockout") return matches.filter((m) => isKnockout(m));
    return matches;
  }, [matches, filter]);

  // Group by date
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; matches: PublicMatch[] }>();
    for (const m of filtered) {
      const key = dateKey(m.kickoffAt);
      if (!map.has(key)) {
        map.set(key, { label: formatGroupDate(m.kickoffAt), matches: [] });
      }
      map.get(key)!.matches.push(m);
    }
    // Sort by date key ascending
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [filtered]);

  const tabs: Array<{ value: FilterValue; label: string }> = [
    { value: "all",      label: "All" },
    { value: "group",    label: "Group stage" },
    { value: "knockout", label: "Knockout stages" },
  ];

  return (
    <div className="matches-client">
      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      <div className="matches-tabs" role="tablist" aria-label="Filter matches">
        {tabs.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={filter === value}
            className={`matches-tab${filter === value ? " matches-tab--active" : ""}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Date groups ─────────────────────────────────────────────────── */}
      {groups.length === 0 ? (
        <p className="matches-empty">No matches in this view.</p>
      ) : (
        groups.map((group) => (
          <div key={group.label} className="match-group">
            <h2 className="match-group-date">{group.label}</h2>
            <div className="match-group-list">
              {group.matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))
      )}

      <style>{`
        /* ── Container ─────────────────────────────────────────────────── */
        .matches-client {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* ── Filter tabs ───────────────────────────────────────────────── */
        .matches-tabs {
          display: flex;
          gap: 0.375rem;
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
        }

        .matches-tab {
          padding: 0.5rem 1.125rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          cursor: pointer;
          transition: background 0.12s, color 0.12s, border-color 0.12s;
          white-space: nowrap;
        }

        .matches-tab:hover {
          background: #F3F4F6;
          border-color: #D1D5DB;
        }

        .matches-tab--active {
          background: #1B4332;
          color: #FFFFFF;
          border-color: #1B4332;
        }

        .matches-tab--active:hover {
          background: #16A34A;
          border-color: #16A34A;
        }

        /* ── Date group ────────────────────────────────────────────────── */
        .match-group {
          margin-bottom: 2rem;
        }

        .match-group-date {
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #6B7280;
          font-style: normal;
          font-family: 'Roboto', system-ui, sans-serif;
          margin-bottom: 0.625rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #E5E7EB;
        }

        .match-group-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* ── Match card ────────────────────────────────────────────────── */
        .match-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          overflow: hidden;
          transition: box-shadow 0.12s;
        }

        .match-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        /* ── Teams row ─────────────────────────────────────────────────── */
        .match-teams {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem 0.75rem;
        }

        .match-team {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          min-width: 0;
        }

        .match-team--home {
          justify-content: flex-start;
        }

        .match-team--away {
          justify-content: flex-end;
        }

        .match-flag {
          width: 28px;
          height: 20px;
          object-fit: cover;
          border-radius: 2px;
          flex-shrink: 0;
          border: 1px solid #E5E7EB;
        }

        .match-flag-placeholder {
          width: 28px;
          height: 20px;
          background: #F3F4F6;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
          color: #9CA3AF;
          flex-shrink: 0;
          border: 1px solid #E5E7EB;
        }

        .match-team-name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Centre column ─────────────────────────────────────────────── */
        .match-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.125rem;
          flex-shrink: 0;
        }

        .match-vs {
          font-size: 0.75rem;
          font-weight: 500;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .match-time {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.02em;
        }

        .match-time--live {
          color: #DC2626;
          animation: pulse-live 1.4s ease-in-out infinite;
        }

        @keyframes pulse-live {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }

        .match-score {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }

        .match-score-sep {
          color: #9CA3AF;
          font-weight: 400;
        }

        /* ── Card footer ───────────────────────────────────────────────── */
        .match-card-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem 1.25rem 0.75rem;
          border-top: 1px solid #F3F4F6;
          background: #FAFAFA;
          gap: 0.75rem;
        }

        .match-kickoff-label {
          font-size: 0.8125rem;
          color: #6B7280;
          font-weight: 500;
        }

        .match-finished-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .match-predict-btn {
          display: inline-flex;
          align-items: center;
          padding: 0.375rem 0.875rem;
          background: #16A34A;
          color: #FFFFFF;
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: 6px;
          text-decoration: none;
          transition: background 0.12s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .match-predict-btn:hover {
          background: #15803D;
        }

        /* ── Empty state ───────────────────────────────────────────────── */
        .matches-empty {
          text-align: center;
          color: #9CA3AF;
          padding: 3rem 1rem;
          font-size: 0.9375rem;
        }

        /* ── Mobile ────────────────────────────────────────────────────── */
        @media (max-width: 480px) {
          .match-teams {
            padding: 0.875rem 1rem 0.625rem;
            gap: 0.5rem;
          }

          .match-team-name {
            font-size: 0.8125rem;
          }

          .match-flag {
            width: 24px;
            height: 17px;
          }

          .match-card-foot {
            padding: 0.5rem 1rem 0.625rem;
          }

          .match-predict-btn {
            padding: 0.3125rem 0.75rem;
            font-size: 0.75rem;
          }

          .match-score {
            font-size: 1.125rem;
          }
        }

        @media (max-width: 360px) {
          .match-team-name {
            font-size: 0.75rem;
          }

          .match-flag {
            width: 20px;
            height: 14px;
          }
        }
      `}</style>
    </div>
  );
}
