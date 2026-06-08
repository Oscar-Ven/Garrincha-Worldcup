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

  const allRows = createLeaderboardRows(rawPlayers);

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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Trophy className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Leaderboards</h1>
          </div>
          <p className="text-sm text-gray-500">
            {isOwner
              ? "Global campaign standings or filter by center location."
              : "Regional competitor performance summary."}
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Center
            </label>
            {isOwner ? (
              <select
                value={selectedCenter}
                onChange={(e) => handleCenterChange(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              >
                <option value="global">Global</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.replace("GARRINCHA ", "")}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-green-600" />
                <span>{centers.find((c) => c.id === managerCenterId)?.name.replace("GARRINCHA ", "") ?? "Your Center"}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Nationality
            </label>
            <select
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            >
              <option value="">All nationalities</option>
              {nationalities.map((nat) => (
                <option key={nat} value={nat}>{nat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search players…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
            />
          </div>
          <span className="text-sm text-gray-500 hidden sm:block">
            {filteredRows.length} competitors
          </span>
        </div>

        {filteredRows.length === 0 ? (
          <div className="text-center py-16 text-gray-400 border-t border-gray-100">
            <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No matching competitors.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 w-12 text-center">Rank</th>
                  <th className="px-6 py-3">Player</th>
                  <th className="px-6 py-3 text-center">Center</th>
                  <th className="px-6 py-3 text-center">Nationality</th>
                  <th className="px-6 py-3 text-center">Predictions</th>
                  <th className="px-6 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-center font-mono font-bold text-gray-500">
                      <span className={i === 0 ? "text-green-600 font-black text-base" : ""}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {row.center.replace("GARRINCHA ", "")}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      <span className="flex items-center justify-center gap-1">
                        <Flag className="w-3 h-3 text-gray-400 shrink-0" />
                        <span>{row.nationality}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 font-medium">
                      {row.predictionCount}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-700 font-mono">
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
