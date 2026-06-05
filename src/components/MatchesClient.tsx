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
    </div>
  );
}
