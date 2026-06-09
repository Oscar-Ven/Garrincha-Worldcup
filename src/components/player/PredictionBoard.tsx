"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock3, Lock, Save, Trophy } from "lucide-react";
import { formatBelgiumDateShort, formatBelgiumTime } from "@/lib/date";

type MatchItem = {
  id: string;
  fifaMatchNo: number | null;
  stage: string;
  venue: string;
  kickoffAt: string;
  status: string;
  homeTeamName: string;
  homeTeamFlag: string;
  awayTeamName: string;
  awayTeamFlag: string;
  homeScore: number | null;
  awayScore: number | null;
  wentToPenalties?: boolean;
  penaltyWinner?: string | null;
  prediction: {
    homeScore: number;
    awayScore: number;
    penaltyWinner?: string | null;
    homePenaltyScore?: number | null;
    awayPenaltyScore?: number | null;
    pointsAwarded: number;
    calculatedAt: string | null;
  } | null;
  isLocked: boolean;
};

type PredictionValues = {
  home: string;
  away: string;
  penaltyWinner: string | null;
  penaltyHome: string;
  penaltyAway: string;
};

type PredictionBoardProps = {
  matches: MatchItem[];
  mode: "predictions" | "matches";
};

type TabKey = "all" | "upcoming" | "locked" | "completed";

export default function PredictionBoard({ matches, mode }: PredictionBoardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>(mode === "predictions" ? "upcoming" : "all");
  const [values, setValues] = useState<Record<string, PredictionValues>>(
    Object.fromEntries(
      matches.map((match) => [
        match.id,
        {
          home: match.prediction ? String(match.prediction.homeScore) : "0",
          away: match.prediction ? String(match.prediction.awayScore) : "0",
          penaltyWinner: match.prediction?.penaltyWinner ?? null,
          penaltyHome: match.prediction?.homePenaltyScore != null ? String(match.prediction.homePenaltyScore) : "",
          penaltyAway: match.prediction?.awayPenaltyScore != null ? String(match.prediction.awayPenaltyScore) : "",
        },
      ]),
    ),
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [messageByMatch, setMessageByMatch] = useState<Record<string, { type: "success" | "error"; text: string }>>({});

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      if (activeTab === "upcoming") return match.status === "SCHEDULED" && !match.isLocked;
      if (activeTab === "locked") return match.status !== "FINAL" && match.isLocked;
      if (activeTab === "completed") return match.status === "FINAL";
      return true;
    });
  }, [activeTab, matches]);

  const groupedMatches = useMemo(() => {
    return filteredMatches.reduce<Record<string, MatchItem[]>>((groups, match) => {
      const key = `${formatBelgiumDateShort(match.kickoffAt)} · ${match.stage.replaceAll("_", " ")}`;
      groups[key] ??= [];
      groups[key].push(match);
      return groups;
    }, {});
  }, [filteredMatches]);

  async function handleSave(matchId: string) {
    const match = matches.find((m) => m.id === matchId);
    const current = values[matchId];
    const homeScore = Number.parseInt(current?.home ?? "", 10);
    const awayScore = Number.parseInt(current?.away ?? "", 10);

    if (Number.isNaN(homeScore) || Number.isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      setMessageByMatch((prev) => ({
        ...prev,
        [matchId]: { type: "error", text: "Enter valid non-negative scores." },
      }));
      return;
    }

    const isKnockout = match?.stage !== "GROUP";
    const isDraw = homeScore === awayScore;

    if (isKnockout && isDraw && !current.penaltyWinner) {
      setMessageByMatch((prev) => ({
        ...prev,
        [matchId]: { type: "error", text: "Select a penalty winner for this knockout draw." },
      }));
      return;
    }

    const penaltyWinner = isKnockout && isDraw ? (current.penaltyWinner ?? null) : null;
    const homePenaltyScore =
      penaltyWinner && current.penaltyHome !== "" && !Number.isNaN(Number.parseInt(current.penaltyHome, 10))
        ? Number.parseInt(current.penaltyHome, 10)
        : null;
    const awayPenaltyScore =
      penaltyWinner && current.penaltyAway !== "" && !Number.isNaN(Number.parseInt(current.penaltyAway, 10))
        ? Number.parseInt(current.penaltyAway, 10)
        : null;

    setSavingId(matchId);
    setMessageByMatch((prev) => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });

    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, homeScore, awayScore, penaltyWinner, homePenaltyScore, awayPenaltyScore }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Prediction could not be saved.");
      }

      setMessageByMatch((prev) => ({
        ...prev,
        [matchId]: { type: "success", text: "Prediction saved." },
      }));

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMessageByMatch((prev) => ({
        ...prev,
        [matchId]: {
          type: "error",
          text: error instanceof Error ? error.message : "Prediction could not be saved.",
        },
      }));
    } finally {
      setSavingId(null);
    }
  }

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "locked", label: "Locked / live" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key ? "bg-lime-400 text-zinc-950" : "bg-white/5 text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center text-sm text-zinc-400">
          No matches found for this view.
        </div>
      ) : (
        Object.entries(groupedMatches).map(([groupLabel, groupMatches]) => (
          <section key={groupLabel} className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{groupLabel}</div>
            <div className="space-y-3">
              {groupMatches.map((match) => {
                const current = values[match.id] ?? { home: "", away: "", penaltyWinner: null, penaltyHome: "", penaltyAway: "" };
                const readOnly = mode === "matches" || match.isLocked || match.status === "FINAL";
                const isKnockout = match.stage !== "GROUP";

                const homeNum = Number.parseInt(current.home, 10);
                const awayNum = Number.parseInt(current.away, 10);
                const isPredictedDraw = !Number.isNaN(homeNum) && !Number.isNaN(awayNum) && homeNum === awayNum;
                const showPenaltySection = !readOnly && isKnockout && isPredictedDraw;

                return (
                  <article key={match.id} className="rounded-[28px] border border-white/8 bg-white/[0.03] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)] sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Match {match.fifaMatchNo ?? "-"} · {match.stage.replaceAll("_", " ")}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                          <span>{formatBelgiumTime(match.kickoffAt)} Brussels</span>
                          <span className="text-zinc-700">•</span>
                          <span className="truncate">{match.venue}</span>
                        </div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        match.status === "FINAL"
                          ? "bg-lime-400/15 text-lime-300"
                          : match.isLocked
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-sky-500/10 text-sky-300"
                      }`}>
                        {match.status === "FINAL" ? "Scored" : match.isLocked ? "Locked" : "Open"}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="min-w-0 text-left">
                        <div className="truncate text-sm font-semibold text-white">{match.homeTeamName}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm font-semibold text-zinc-200">
                        {match.status === "FINAL" ? `${match.homeScore ?? "-"} : ${match.awayScore ?? "-"}` : "vs"}
                      </div>
                      <div className="min-w-0 text-right">
                        <div className="truncate text-sm font-semibold text-white">{match.awayTeamName}</div>
                      </div>
                    </div>

                    {/* Penalty result for completed knockout matches */}
                    {match.status === "FINAL" && match.wentToPenalties && match.penaltyWinner && (
                      <div className="mt-2 text-center text-[11px] text-zinc-500">
                        Penalties: {match.penaltyWinner === "home" ? match.homeTeamName : match.awayTeamName} won
                      </div>
                    )}

                    <div className="mt-4 rounded-[22px] border border-white/8 bg-black/20 p-3 space-y-3">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          disabled={readOnly}
                          value={current.home}
                          onChange={(event) =>
                            setValues((prev) => ({
                              ...prev,
                              [match.id]: { ...prev[match.id], home: event.target.value, penaltyWinner: null, penaltyHome: "", penaltyAway: "" },
                            }))
                          }
                          className="h-12 min-w-0 rounded-2xl border border-white/10 bg-zinc-950 px-3 text-center text-lg font-semibold text-white outline-none transition-colors focus:border-lime-400 disabled:cursor-not-allowed disabled:text-zinc-500"
                          placeholder="0"
                        />
                        <div className="text-sm font-semibold text-zinc-500">:</div>
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          disabled={readOnly}
                          value={current.away}
                          onChange={(event) =>
                            setValues((prev) => ({
                              ...prev,
                              [match.id]: { ...prev[match.id], away: event.target.value, penaltyWinner: null, penaltyHome: "", penaltyAway: "" },
                            }))
                          }
                          className="h-12 min-w-0 rounded-2xl border border-white/10 bg-zinc-950 px-3 text-center text-lg font-semibold text-white outline-none transition-colors focus:border-lime-400 disabled:cursor-not-allowed disabled:text-zinc-500"
                          placeholder="0"
                        />
                      </div>

                      {/* Knockout hint */}
                      {!readOnly && isKnockout && (
                        <p className="text-[11px] text-zinc-500 text-center">
                          Predict the score after 120 minutes. If you predict a draw, choose the penalty winner.
                        </p>
                      )}

                      {/* Penalty winner selector — shown when knockout + predicted draw */}
                      {showPenaltySection && (
                        <div className="space-y-2 border-t border-white/8 pt-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Penalty winner (required)</p>
                          <div className="flex gap-2">
                            {(["home", "away"] as const).map((side) => (
                              <button
                                key={side}
                                type="button"
                                onClick={() =>
                                  setValues((prev) => ({
                                    ...prev,
                                    [match.id]: {
                                      ...prev[match.id],
                                      penaltyWinner: prev[match.id]?.penaltyWinner === side ? null : side,
                                    },
                                  }))
                                }
                                className={`flex-1 rounded-2xl py-2 text-xs font-semibold transition-colors border ${
                                  current.penaltyWinner === side
                                    ? "bg-lime-400 text-zinc-950 border-lime-400"
                                    : "bg-zinc-950/70 text-zinc-300 border-white/10 hover:border-white/20"
                                }`}
                              >
                                {side === "home" ? match.homeTeamName : match.awayTeamName}
                              </button>
                            ))}
                          </div>

                          {/* Optional penalty score */}
                          {current.penaltyWinner && (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Penalty score (optional, +1 pt)</p>
                              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  inputMode="numeric"
                                  value={current.penaltyHome}
                                  onChange={(e) =>
                                    setValues((prev) => ({
                                      ...prev,
                                      [match.id]: { ...prev[match.id], penaltyHome: e.target.value },
                                    }))
                                  }
                                  className="h-10 min-w-0 rounded-2xl border border-white/10 bg-zinc-950 px-3 text-center text-base font-semibold text-white outline-none transition-colors focus:border-lime-400"
                                  placeholder="0"
                                />
                                <div className="text-sm font-semibold text-zinc-500">:</div>
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  inputMode="numeric"
                                  value={current.penaltyAway}
                                  onChange={(e) =>
                                    setValues((prev) => ({
                                      ...prev,
                                      [match.id]: { ...prev[match.id], penaltyAway: e.target.value },
                                    }))
                                  }
                                  className="h-10 min-w-0 rounded-2xl border border-white/10 bg-zinc-950 px-3 text-center text-base font-semibold text-white outline-none transition-colors focus:border-lime-400"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Read-only: show predicted penalty winner if applicable */}
                      {readOnly && current.penaltyWinner && (
                        <p className="text-[11px] text-zinc-500 text-center border-t border-white/8 pt-2">
                          Predicted penalties:{" "}
                          {current.penaltyWinner === "home" ? match.homeTeamName : match.awayTeamName} wins
                          {current.penaltyHome && current.penaltyAway
                            ? ` (${current.penaltyHome}–${current.penaltyAway})`
                            : ""}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
                      <div className="flex min-w-0 items-center gap-2">
                        <Clock3 className="h-4 w-4 shrink-0 text-zinc-500" />
                        <span className="min-w-0 truncate">Predictions lock 5 minutes before kickoff.</span>
                      </div>
                      {match.prediction ? (
                        <div className="flex items-center gap-2 text-lime-300">
                          <Trophy className="h-4 w-4" />
                          <span>{match.status === "FINAL" ? `${match.prediction.pointsAwarded} pts earned` : "Saved"}</span>
                        </div>
                      ) : match.isLocked ? (
                        <div className="flex items-center gap-2 text-amber-300">
                          <Lock className="h-4 w-4" />
                          <span>No prediction</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500">No prediction yet</span>
                      )}
                    </div>

                    {messageByMatch[match.id] && (
                      <div className={`mt-3 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs ${
                        messageByMatch[match.id].type === "success"
                          ? "bg-lime-400/10 text-lime-300"
                          : "bg-red-500/10 text-red-300"
                      }`}>
                        {messageByMatch[match.id].type === "success" ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0" />
                        )}
                        <span>{messageByMatch[match.id].text}</span>
                      </div>
                    )}

                    {mode === "predictions" && !readOnly && (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSave(match.id)}
                          disabled={savingId === match.id}
                          className="inline-flex items-center gap-2 rounded-2xl bg-lime-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-lime-300 disabled:opacity-60"
                        >
                          <Save className="h-4 w-4" />
                          <span>{savingId === match.id ? "Saving..." : match.prediction ? "Update prediction" : "Save prediction"}</span>
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
