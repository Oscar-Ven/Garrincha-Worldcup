"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Search,
  RefreshCw,
  Trophy,
  X,
  AlertCircle,
  Loader2,
  CheckCircle,
  Save,
  MapPin,
  Clock,
} from "lucide-react";

interface SerializedMatch {
  id: string;
  fifaMatchNo: number;
  stage: string;
  venue: string;
  kickoffAt: string;
  status: string;
  homeTeamName: string;
  homeTeamFifa: string;
  homeTeamFlag: string;
  awayTeamName: string;
  awayTeamFifa: string;
  awayTeamFlag: string;
  homeScore: number | null;
  awayScore: number | null;
  finalizedAt: string | null;
}

interface Props {
  currentUserRole: string;
  initialMatches: SerializedMatch[];
}

export default function MatchesClient({ currentUserRole, initialMatches }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "scheduled" | "finalized">("all");
  const [search, setSearch] = useState("");

  const isOwner = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  // Score dialog state
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<SerializedMatch | null>(null);

  // Score form values
  const [scores, setScores] = useState({ home: "", away: "" });

  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter matches list
  const filteredMatches = initialMatches.filter((match) => {
    const tabMatch =
      activeTab === "all"
        ? true
        : activeTab === "scheduled"
          ? match.status === "SCHEDULED"
          : match.status === "FINAL" || match.status === "LIVE";

    if (!tabMatch) return false;

    const term = search.toLowerCase();
    return (
      match.homeTeamName.toLowerCase().includes(term) ||
      match.awayTeamName.toLowerCase().includes(term) ||
      match.stage.toLowerCase().includes(term) ||
      match.venue.toLowerCase().includes(term)
    );
  });

  // Handle Score Submission
  async function handleSetScore(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const homeNum = parseInt(scores.home, 10);
    const awayNum = parseInt(scores.away, 10);

    if (isNaN(homeNum) || isNaN(awayNum) || homeNum < 0 || homeNum > 30 || awayNum < 0 || awayNum > 30) {
      setError("Please provide a valid score between 0 and 30.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/matches/${selectedMatch.id}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeScore: homeNum, awayScore: awayNum }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to finalize match score.");
      }

      setSuccess(`Match #${selectedMatch.fifaMatchNo} finalized successfully! Points awarded to predictors.`);
      setScoreDialogOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record score.");
    } finally {
      setLoading(false);
    }
  }

  // Handle API Fetch Sync Matches
  async function handleSyncMatches() {
    if (!confirm("Are you sure you want to sync fixture metadata, kickoff times, and team statuses from external APIs?")) return;

    setSyncLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/sync-matches");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Match sync process failed.");
      }

      setSuccess(`Sync completed successfully. ${data.synced ?? 0} matches updated from external API provider.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failure.");
    } finally {
      setSyncLoading(false);
    }
  }

  // Edit action trigger
  function openScoreDialog(match: SerializedMatch) {
    setSelectedMatch(match);
    setScores({
      home: match.homeScore !== null ? match.homeScore.toString() : "",
      away: match.awayScore !== null ? match.awayScore.toString() : "",
    });
    setError(null);
    setSuccess(null);
    setScoreDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Matches & Results Manager
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isOwner
              ? "Key in official campaign final scores, trigger point recalculations, or synchronize fixtures."
              : "View the official FIFA World Cup 2026 match schedule and locks."}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleSyncMatches}
            disabled={syncLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold uppercase tracking-wider text-xs transition-colors disabled:opacity-50"
          >
            {syncLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-lime-400" />
            ) : (
              <RefreshCw className="w-4 h-4 text-lime-400" />
            )}
            <span>API Synchronize</span>
          </button>
        )}
      </div>

      {/* Tabs / Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "all"
                ? "border-lime-400 text-lime-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            All Fixtures ({initialMatches.length})
          </button>

          <button
            onClick={() => setActiveTab("scheduled")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "scheduled"
                ? "border-lime-400 text-lime-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Upcoming ({initialMatches.filter((m) => m.status === "SCHEDULED").length})
          </button>

          <button
            onClick={() => setActiveTab("finalized")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "finalized"
                ? "border-lime-400 text-lime-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Completed ({initialMatches.filter((m) => m.status === "FINAL").length})
          </button>
        </div>

        <div className="relative w-full max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by team or stage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-lime-400 transition-colors"
          />
        </div>
      </div>

      {/* Success alert */}
      {success && (
        <div className="flex items-center gap-3 p-4 border border-lime-400/30 bg-lime-400/10 text-lime-400 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Matches Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMatches.length === 0 ? (
          <div className="md:col-span-2 text-center py-16 text-zinc-500 border border-dashed border-zinc-800">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30 text-lime-400" />
            <p className="text-xs uppercase font-bold">No matches fit the selected state.</p>
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isCompleted = match.status === "FINAL";
            const kickoffDate = new Date(match.kickoffAt);

            return (
              <div
                key={match.id}
                className={`border bg-zinc-900/10 p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all ${
                  isCompleted ? "border-zinc-850" : "border-zinc-800"
                }`}
              >
                {/* Upper context */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-900 px-2 py-0.5 border border-zinc-800">
                    Match #{match.fifaMatchNo} · {match.stage}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-none font-bold uppercase tracking-wider text-[9px] ${
                      isCompleted
                        ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        : "bg-lime-400/10 text-lime-400 border border-lime-400/20"
                    }`}
                  >
                    {isCompleted ? "Completed" : "Scheduled"}
                  </span>
                </div>

                {/* Scoreboard layout */}
                <div className="flex items-center justify-between gap-4 py-3 border-y border-zinc-900 my-2">
                  {/* Home */}
                  <div className="flex-1 flex items-center gap-3">
                    <span className="font-bold text-white text-sm truncate select-none uppercase">
                      {match.homeTeamName}
                    </span>
                  </div>

                  {/* Score display block */}
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950 border border-zinc-800 text-sm font-black select-none">
                    {isCompleted ? (
                      <>
                        <span className="text-white font-black">{match.homeScore}</span>
                        <span className="text-zinc-650">:</span>
                        <span className="text-white font-black">{match.awayScore}</span>
                      </>
                    ) : (
                      <span className="text-zinc-500 tracking-widest text-[11px] font-bold">VS</span>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex-1 flex items-center justify-end gap-3">
                    <span className="font-bold text-white text-sm truncate select-none uppercase text-right">
                      {match.awayTeamName}
                    </span>
                  </div>
                </div>

                {/* Lower info / edit triggers */}
                <div className="mt-4 flex items-center justify-between gap-4 pt-1">
                  <div className="text-[10px] text-zinc-500 flex flex-col gap-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-650" />
                      {kickoffDate.toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-650" />
                      {match.venue}
                    </span>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => openScoreDialog(match)}
                      className="px-3 py-1.5 border border-zinc-755 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold uppercase tracking-wider text-[10px] inline-flex items-center gap-1.5"
                    >
                      <Trophy className="w-3 h-3 text-lime-400" />
                      <span>{isCompleted ? "Amend Score" : "Key Score"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── ENTER / KEY SCORE MODAL ── */}
      {scoreDialogOpen && selectedMatch && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in select-none">
          <div className="bg-zinc-900 border border-zinc-800 max-w-sm w-full p-6 space-y-6 relative">
            <button
              onClick={() => setScoreDialogOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-sm border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-lime-400" />
              Key Score Detail // Match #{selectedMatch.fifaMatchNo}
            </h2>

            <div className="p-3 bg-zinc-950 text-center text-xs border border-zinc-805 uppercase font-bold text-zinc-400">
              {selectedMatch.stage}
            </div>

            <form onSubmit={handleSetScore} className="space-y-6">
              <div className="flex items-center justify-between gap-6 py-2">
                {/* Home input */}
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-black text-white uppercase text-center truncate w-24">
                    {selectedMatch.homeTeamName}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    required
                    placeholder="0"
                    value={scores.home}
                    onChange={(e) => setScores({ ...scores, home: e.target.value })}
                    className="w-16 h-16 bg-zinc-950 border-2 border-zinc-805 hover:border-zinc-700 focus:outline-none focus:border-lime-400 text-center text-3xl font-black text-white"
                  />
                </div>

                <span className="text-3xl font-black text-zinc-700">:</span>

                {/* Away input */}
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-black text-white uppercase text-center truncate w-24">
                    {selectedMatch.awayTeamName}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    required
                    placeholder="0"
                    value={scores.away}
                    onChange={(e) => setScores({ ...scores, away: e.target.value })}
                    className="w-16 h-16 bg-zinc-950 border-2 border-zinc-850 hover:border-zinc-700 focus:outline-none focus:border-lime-400 text-center text-3xl font-black text-white"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-2.5 border border-red-900/50 bg-red-900/10 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <span className="text-[10px] text-zinc-550 leading-relaxed block border-t border-zinc-840 pt-4">
                Submitting this form immediately updates match coordinates, commits score values, locks edits, and runs point adjustments for all locked predictions.
              </span>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 py-3 bg-lime-400 hover:bg-lime-300 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-black uppercase tracking-wider text-xs transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin font-black" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Commit Scores & Recalculate</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
