"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Search,
  Building,
  Flag,
  User,
  ShieldAlert,
} from "lucide-react";
import { createLeaderboardRows, LeaderboardInputUser } from "@/lib/product-logic";

interface Center {
  id: string;
  name: string;
  city: string;
}

interface Props {
  currentUserRole: string;
  managerCenterId: string;
  initialCenterSelection: string;
  centers: Center[];
  rawPlayers: LeaderboardInputUser[];
}

export default function LeaderboardsClient({
  currentUserRole,
  managerCenterId,
  initialCenterSelection,
  centers,
  rawPlayers,
}: Props) {
  const router = useRouter();
  const [selectedCenter, setSelectedCenter] = useState(initialCenterSelection);
  const [searchQuery, setSearchQuery] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("");

  const isOwner = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  // Build the complete leaderboard rows using the utility function. It totals up predict points + bonus logs.
  const allRows = createLeaderboardRows(rawPlayers);

  // Apply filters in the frontend
  const filteredRows = allRows.filter((row) => {
    const term = searchQuery.toLowerCase();
    const searchMatch =
      row.name.toLowerCase().includes(term) ||
      row.center.toLowerCase().includes(term) ||
      row.nationality.toLowerCase().includes(term);

    const nationalMatch = nationalityFilter
      ? row.nationality.toLowerCase() === nationalityFilter.toLowerCase()
      : true;

    return searchMatch && nationalMatch;
  });

  // Extract unique national tags/nationalities for quick selection select box
  const nationalities = Array.from(new Set(allRows.map((r) => r.nationality).filter(Boolean)));

  function handleCenterChange(centerId: string) {
    setSelectedCenter(centerId);
    setSearchQuery("");
    setNationalityFilter("");
    if (centerId === "global") {
      router.push("/admin/leaderboards");
    } else {
      router.push(`/admin/leaderboards?centerId=${centerId}`);
    }
  }

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-lime-400" />
            Competitive Leaderboards
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {isOwner
              ? "Inspect the entire campaign competitive landscape or slice standings by center location."
              : "Regional GARRINCHA competitors performance summary standings."}
          </p>
        </div>

        {/* Filters dropdown (Only Owner can toggle centers) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-zinc-500 mb-1 tracking-wider">
              Sports Center filter
            </span>
            {isOwner ? (
              <select
                value={selectedCenter}
                onChange={(e) => handleCenterChange(e.target.value)}
                className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-white text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-lime-400"
              >
                <option value="global">GLOBAL BILLBOARD</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.replace("GARRINCHA ", "")}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none">
                <Building className="w-3.5 h-3.5 text-lime-400" />
                <span>{centers.find((c) => c.id === managerCenterId)?.name.replace("GARRINCHA ", "") ?? "Your Center"}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-zinc-500 mb-1 tracking-wider">
              Competitor Nationality
            </span>
            <select
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-white text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-lime-400"
            >
              <option value="">All Nationalities</option>
              {nationalities.map((nat) => (
                <option key={nat} value={nat}>
                  {nat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main search and content area */}
      <div className="bg-zinc-900/40 border border-zinc-800 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="relative w-full max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search scoreboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-lime-400 transition-colors"
            />
          </div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider select-none hidden sm:block">
            {filteredRows.length} competers found
          </span>
        </div>

        {/* Data box */}
        {filteredRows.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800">
            <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30 text-lime-400" />
            <p className="text-xs uppercase font-bold tracking-wider">No matching competitors on the board.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950/20">
                  <th className="px-4 py-3 w-12 text-center">Rank</th>
                  <th className="px-6 py-3">Player nickname</th>
                  <th className="px-6 py-3 text-center">Home Garrincha Center</th>
                  <th className="px-6 py-3 text-center">Nationality</th>
                  <th className="px-6 py-3 text-center w-28">Predictions</th>
                  <th className="px-6 py-3 text-right w-24">Global Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredRows.map((row, i) => (
                  <tr key={row.id} className="hover:bg-zinc-900/25 transition-colors">
                    <td className="px-4 py-4 text-center font-mono font-black italic text-zinc-400">
                      <span className={`${i === 0 ? "text-lime-400 text-sm [text-shadow:_0_0_8px_rgba(163,230,53,0.2)]" : ""}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white uppercase flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-zinc-400 font-semibold uppercase">
                      {row.center.replace("GARRINCHA ", "")}
                    </td>
                    <td className="px-6 py-4 text-center text-zinc-400 font-bold uppercase tracking-wide flex items-center justify-center gap-1">
                      <Flag className="w-3 h-3 text-zinc-600 shrink-0" />
                      <span>{row.nationality}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-zinc-400">
                      {row.predictionCount}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-lime-400 font-mono text-sm tracking-wider">
                      {row.points} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}