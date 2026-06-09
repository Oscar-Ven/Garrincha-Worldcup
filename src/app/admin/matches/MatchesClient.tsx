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
  scoreSource: string | null;
  scoreSyncStatus: string | null;
  lastScoreSyncAt: string | null;
  pendingHomeScore: number | null;
  pendingAwayScore: number | null;
}

interface Props {
  currentUserRole: string;
  initialMatches: SerializedMatch[];
}

const STAGE_LABELS: Record<string, string> = {
  GROUP: "Group Stage",
  ROUND_OF_32: "Round of 32",
  ROUND_OF_16: "Round of 16",
  QUARTER_FINAL: "Quarter-Final",
  SEMI_FINAL: "Semi-Final",
  THIRD_PLACE: "Third Place",
  FINAL: "Final",
};

export default function MatchesClient({ currentUserRole, initialMatches }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "scheduled" | "finalized">("all");
  const [search, setSearch] = useState("");

  const isOwner = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<SerializedMatch | null>(null);
  const [scores, setScores] = useState({ home: "", away: "" });

  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

      setSuccess(`Match #${selectedMatch.fifaMatchNo} finalized. Points awarded to predictors.`);
      setScoreDialogOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record score.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncMatches() {
    if (!confirm("Sync fixture metadata, kickoff times, and team statuses from external APIs?")) return;

    setSyncLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/sync-matches", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Match sync process failed.");
      }

      const parts = [`${data.synced ?? 0} auto-applied`];
      if ((data.pending_review ?? 0) > 0) parts.push(`${data.pending_review} pending review`);
      setSuccess(`Sync complete. ${parts.join(", ")}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failure.");
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleApproveScore(match: SerializedMatch) {
    if (
      !confirm(
        `Approve ${match.pendingHomeScore}–${match.pendingAwayScore} for ${match.homeTeamName} vs ${match.awayTeamName}? This will finalize the match and award points.`,
      )
    )
      return;

    setApprovingId(match.id);
    setApproveError(null);
    setSuccess(null);

    const approvedScore = `${match.pendingHomeScore}–${match.pendingAwayScore}`;

    try {
      const res = await fetch(`/api/admin/matches/${match.id}/approve-score`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to approve score.");
      }
      setSuccess(`Match #${match.fifaMatchNo} approved (${approvedScore}). Points awarded.`);
      router.refresh();
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : "Failed to approve score.");
    } finally {
      setApprovingId(null);
    }
  }

  function openScoreDialog(match: SerializedMatch) {
    setSelectedMatch(match);
    setScores({
      home: match.homeScore !== null ? match.homeScore.toString() : "",
      away: match.awayScore !== null ? match.awayScore.toString() : "",
    });
    setError(null);
    setApproveError(null);
    setSuccess(null);
    setScoreDialogOpen(true);
  }

  const scheduledCount = initialMatches.filter((m) => m.status === "SCHEDULED").length;
  const finalCount = initialMatches.filter((m) => m.status === "FINAL").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matches & Results</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isOwner
              ? "Enter official final scores, trigger point recalculations, or sync fixtures."
              : "View the FIFA World Cup 2026 match schedule and lock status."}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleSyncMatches}
            disabled={syncLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {syncLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-green-600" />
            ) : (
              <RefreshCw className="w-4 h-4 text-green-600" />
            )}
            <span>API Sync</span>
          </button>
        )}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex gap-1">
          {[
            { key: "all" as const, label: `All (${initialMatches.length})` },
            { key: "scheduled" as const, label: `Upcoming (${scheduledCount})` },
            { key: "finalized" as const, label: `Completed (${finalCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === key
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search team, stage, venue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
          />
        </div>
      </div>

      {/* Global alerts */}
      {success && (
        <div className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 text-green-700 text-sm rounded-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {approveError && (
        <div role="alert" className="flex items-start gap-3 p-3 border border-red-200 bg-red-50 text-red-700 text-sm rounded-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{approveError}</span>
        </div>
      )}
      {error && !scoreDialogOpen && (
        <div role="alert" className="flex items-start gap-3 p-3 border border-red-200 bg-red-50 text-red-700 text-sm rounded-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Match cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredMatches.length === 0 ? (
          <div className="md:col-span-2 text-center py-16 text-gray-400 border border-dashed border-gray-200 bg-white">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40 text-green-600" />
            <p className="text-sm font-medium">No matches match the selected filter.</p>
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isCompleted = match.status === "FINAL";
            const isLive = match.status === "LIVE";
            const kickoffDate = new Date(match.kickoffAt);
            const stageLabel = STAGE_LABELS[match.stage] ?? match.stage;

            return (
              <div
                key={match.id}
                className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Top meta */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">
                    <span className="text-gray-700 font-semibold">#{match.fifaMatchNo}</span>
                    {" · "}
                    {stageLabel}
                  </span>
                  <div className="flex items-center gap-1">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Live
                      </span>
                    ) : isCompleted ? (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        Final
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Upcoming
                      </span>
                    )}
                    {match.scoreSyncStatus === "pending_review" && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Review
                      </span>
                    )}
                    {isCompleted && match.scoreSyncStatus === "admin_approved" && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Admin
                      </span>
                    )}
                    {isCompleted && match.scoreSyncStatus !== "admin_approved" && match.scoreSource === "api-football" && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        API
                      </span>
                    )}
                    {isCompleted && match.scoreSource === "manual" && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                        Manual
                      </span>
                    )}
                  </div>
                </div>

                {/* Teams + score */}
                <div className="flex items-center justify-between gap-4 px-4 py-4">
                  <span className="font-bold text-gray-900 text-sm truncate flex-1 uppercase">
                    {match.homeTeamName}
                  </span>

                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 font-mono font-bold text-sm shrink-0">
                    {isCompleted || isLive ? (
                      <>
                        <span className="text-gray-900">{match.homeScore}</span>
                        <span className="text-gray-400">:</span>
                        <span className="text-gray-900">{match.awayScore}</span>
                      </>
                    ) : (
                      <span className="text-gray-400 tracking-widest text-xs">VS</span>
                    )}
                  </div>

                  <span className="font-bold text-gray-900 text-sm truncate flex-1 uppercase text-right">
                    {match.awayTeamName}
                  </span>
                </div>

                {/* Footer: venue + action */}
                <div className="flex items-center justify-between gap-4 px-4 pb-4 pt-1">
                  <div className="text-xs text-gray-500 flex flex-col gap-0.5 min-w-0">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                      {kickoffDate.toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">{match.venue}</span>
                    </span>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-2 shrink-0">
                      {match.scoreSyncStatus === "pending_review" &&
                        match.pendingHomeScore !== null &&
                        match.pendingAwayScore !== null && (
                          <button
                            onClick={() => handleApproveScore(match)}
                            disabled={approvingId === match.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 font-semibold text-xs transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve {match.pendingHomeScore}–{match.pendingAwayScore}
                          </button>
                        )}
                      <button
                        onClick={() => openScoreDialog(match)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-xs transition-colors whitespace-nowrap"
                      >
                        <Trophy className="w-3.5 h-3.5 text-green-600" />
                        {isCompleted ? "Edit score" : "Enter score"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Score entry modal */}
      {scoreDialogOpen && selectedMatch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in">
          <div className="bg-white border border-gray-200 shadow-xl max-w-sm w-full p-6 space-y-5 relative">
            <button
              onClick={() => setScoreDialogOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Enter Score — Match #{selectedMatch.fifaMatchNo}
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                {STAGE_LABELS[selectedMatch.stage] ?? selectedMatch.stage}
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-sm leading-relaxed">
              Submitting this score immediately calculates points for all locked predictions. This action is permanent.
            </div>

            <form onSubmit={handleSetScore} className="space-y-5">
              <div className="flex items-end justify-between gap-4">
                {/* Home */}
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700 uppercase text-center truncate w-full">
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
                    className="w-16 h-16 bg-white border-2 border-gray-300 hover:border-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 text-center text-3xl font-bold text-gray-900 transition-colors"
                  />
                </div>

                <span className="text-2xl font-bold text-gray-300 pb-2">:</span>

                {/* Away */}
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700 uppercase text-center truncate w-full">
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
                    className="w-16 h-16 bg-white border-2 border-gray-300 hover:border-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 text-center text-3xl font-bold text-gray-900 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2.5 p-3 border border-red-200 bg-red-50 text-red-700 text-sm rounded-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Score & Recalculate</span>
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
