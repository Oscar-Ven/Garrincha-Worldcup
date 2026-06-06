"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock3, Lock, Save, Trophy } from "lucide-react";

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
  prediction: {
    homeScore: number;
    awayScore: number;
    pointsAwarded: number;
    calculatedAt: string | null;
  } | null;
  isLocked: boolean;
};

type PredictionBoardProps = {
  locale: string;
  matches: MatchItem[];
  mode: "predictions" | "matches";
};

type TabKey = "all" | "upcoming" | "locked" | "completed";

function formatDateLabel(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatTimeLabel(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PredictionBoard({ locale, matches, mode }: PredictionBoardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>(mode === "predictions" ? "upcoming" : "all");
  const [values, setValues] = useState<Record<string, { home: string; away: string }>>(
    Object.fromEntries(
      matches.map((match) => [
        match.id,
        {
          home: match.prediction ? String(match.prediction.homeScore) : "",
          away: match.prediction ? String(match.prediction.awayScore) : "",
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
      const key = `${formatDateLabel(match.kickoffAt, locale)} · ${match.stage.replaceAll("_", " ")}`;
      groups[key] ??= [];
      groups[key].push(match);
      return groups;
    }, {});
  }, [filteredMatches, locale]);

  async function handleSave(matchId: string) {
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
        body: JSON.stringify({ matchId, homeScore, awayScore }),
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
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
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
                const current = values[match.id] ?? { home: "", away: "" };
                const readOnly = mode === "matches" || match.isLocked || match.status === "FINAL";

                return (
                  <article key={match.id} className="rounded-[28px] border border-white/8 bg-white/[0.03] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)] sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Match {match.fifaMatchNo ?? "-"} · {match.stage.replaceAll("_", " ")}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                          <span>{formatTimeLabel(match.kickoffAt, locale)}</span>
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

                    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[22px] border border-white/8 bg-black/20 p-3">
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        disabled={readOnly}
                        value={current.home}
                        onChange={(event) =>
                          setValues((prev) => ({
                            ...prev,
                            [match.id]: { ...prev[match.id], home: event.target.value, away: prev[match.id]?.away ?? "" },
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
                            [match.id]: { home: prev[match.id]?.home ?? "", away: event.target.value },
                          }))
                        }
                        className="h-12 min-w-0 rounded-2xl border border-white/10 bg-zinc-950 px-3 text-center text-lg font-semibold text-white outline-none transition-colors focus:border-lime-400 disabled:cursor-not-allowed disabled:text-zinc-500"
                        placeholder="0"
                      />
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