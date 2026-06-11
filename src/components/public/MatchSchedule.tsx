"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { isoCodeForTeam } from "@/lib/flags";
import { formatBelgiumDateLong, formatBelgiumTime, getBelgiumDateKey } from "@/lib/date";

type MatchTeam = {
  name: string;
  fifaCode: string;
  flagUrl: string;
  groupName: string | null;
};

export type PublicMatchRow = {
  id: string;
  fifaMatchNo: number | null;
  stage: string;
  venue: string;
  kickoffAt: string; // ISO 8601 string
  status: "SCHEDULED" | "LIVE" | "FINAL";
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  homeScore: number | null;
  awayScore: number | null;
};

type Filter = "all" | "group" | "knockout" | "belgium" | "upcoming";

const STAGE_LABELS: Record<string, string> = {
  GROUP: "Group Stage",
  ROUND_OF_32: "Round of 32",
  ROUND_OF_16: "Round of 16",
  QUARTER_FINAL: "Quarter-Final",
  SEMI_FINAL: "Semi-Final",
  THIRD_PLACE: "Third Place",
  FINAL: "Final",
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "group", label: "Group Stage" },
  { key: "knockout", label: "Knockout" },
  { key: "belgium", label: "Belgium" },
  { key: "upcoming", label: "Upcoming" },
];

function TeamFlag({ team }: { team: MatchTeam }) {
  const isoCode = isoCodeForTeam(team);
  if (!isoCode) {
    return (
      <div className="w-8 h-5 bg-zinc-800 rounded-sm flex items-center justify-center text-[9px] font-black text-zinc-400 shrink-0">
        {team.fifaCode.slice(0, 3)}
      </div>
    );
  }
  return (
    <Image
      src={`https://flagcdn.com/w40/${isoCode.toLowerCase()}.png`}
      alt={`${team.name} flag`}
      width={32}
      height={22}
      className="rounded-sm shrink-0 object-cover"
    />
  );
}

function StatusBadge({ status }: { status: "SCHEDULED" | "LIVE" | "FINAL" }) {
  if (status === "LIVE") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        Live
      </span>
    );
  }
  if (status === "FINAL") {
    return (
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        FT
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
      Upcoming
    </span>
  );
}


function MatchCard({ match }: { match: PublicMatchRow }) {
  const stageLabel = STAGE_LABELS[match.stage] ?? match.stage;
  const groupSuffix = match.homeTeam.groupName ? ` · Group ${match.homeTeam.groupName}` : "";
  const matchNoLabel = match.fifaMatchNo != null ? `#${match.fifaMatchNo}` : "";
  const hasResult = match.status !== "SCHEDULED";

  return (
    <div className="border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors flex flex-col">
      {/* Meta strip */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-zinc-800/60">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          {matchNoLabel && (
            <span className="text-zinc-400 font-bold mr-2">{matchNoLabel}</span>
          )}
          {stageLabel}
          {groupSuffix}
        </span>
        <StatusBadge status={match.status} />
      </div>

      {/* Teams + VS / score */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4">
        {/* Home */}
        <div className="flex items-center gap-2.5 min-w-0">
          <TeamFlag team={match.homeTeam} />
          <span className="text-white font-black uppercase tracking-tight text-sm leading-tight truncate">
            {match.homeTeam.name}
          </span>
        </div>

        {/* Center: VS or score */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 min-w-[56px]">
          {hasResult ? (
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tabular-nums text-white">
                {match.homeScore ?? "—"}
              </span>
              <span className="text-zinc-600 font-black text-lg">:</span>
              <span className="text-2xl font-black tabular-nums text-white">
                {match.awayScore ?? "—"}
              </span>
            </div>
          ) : (
            <>
              <span className="text-lime-400 font-black text-base tracking-widest leading-none">
                VS
              </span>
              <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
                {formatBelgiumTime(match.kickoffAt)} Brussels
              </span>
            </>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-2.5 justify-end min-w-0">
          <span className="text-white font-black uppercase tracking-tight text-sm leading-tight truncate text-right">
            {match.awayTeam.name}
          </span>
          <TeamFlag team={match.awayTeam} />
        </div>
      </div>

      {/* Venue */}
      <div className="px-4 pb-3 -mt-1">
        <span className="text-zinc-600 text-[11px] font-mono block truncate">
          {match.venue}
        </span>
      </div>
    </div>
  );
}

export default function MatchSchedule({ matches }: { matches: PublicMatchRow[] }) {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = matches;

    switch (activeFilter) {
      case "group":
        result = result.filter((m) => m.stage === "GROUP");
        break;
      case "knockout":
        result = result.filter((m) => m.stage !== "GROUP");
        break;
      case "belgium":
        result = result.filter(
          (m) => m.homeTeam.name === "Belgium" || m.awayTeam.name === "Belgium"
        );
        break;
      case "upcoming":
        result = result.filter((m) => m.status === "SCHEDULED");
        break;
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (m) =>
          m.homeTeam.name.toLowerCase().includes(q) ||
          m.awayTeam.name.toLowerCase().includes(q) ||
          m.venue.toLowerCase().includes(q) ||
          (m.fifaMatchNo != null && String(m.fifaMatchNo).includes(q))
      );
    }

    return result;
  }, [matches, activeFilter, searchQuery]);

  const dateGroups = useMemo(() => {
    const map = new Map<string, PublicMatchRow[]>();
    for (const m of filtered) {
      const key = getBelgiumDateKey(m.kickoffAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative max-w-xs w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search team, venue, match #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-lime-400 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-widest border transition-colors ${
                activeFilter === key
                  ? "bg-lime-400 text-zinc-950 border-lime-400"
                  : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {dateGroups.length === 0 && (
        <div className="border border-zinc-800 p-16 text-center">
          <p className="text-zinc-500 text-sm uppercase tracking-widest">
            No matches found
          </p>
        </div>
      )}

      {/* Date-grouped match cards */}
      <div className="space-y-10">
        {dateGroups.map(([dateKey, dayMatches]) => (
          <div key={dateKey}>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-white font-black uppercase tracking-tight text-sm shrink-0">
                {formatBelgiumDateLong(dayMatches[0].kickoffAt)}
              </span>
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-zinc-600 text-[10px] font-mono shrink-0">
                {dayMatches.length} {dayMatches.length === 1 ? "match" : "matches"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dayMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
