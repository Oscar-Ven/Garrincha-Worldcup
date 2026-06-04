"use client";

import { useState } from "react";
import { TeamFlag } from "@/components/Flag";
import { PredictionForm } from "@/components/PredictionForm";
import { isPredictionLocked } from "@/lib/scoring";
import { t, type Locale } from "@/lib/translations";

export type FilterableMatch = {
  id: string;
  stage: string;
  fifaMatchNo: number | null;
  venue: string;
  kickoffAt: string; // ISO string — serialized from server Date
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { id: string; name: string; fifaCode: string | null; flagUrl: string | null; groupName: string | null };
  awayTeam: { id: string; name: string; fifaCode: string | null; flagUrl: string | null; groupName: string | null };
  predictions: Array<{ id: string; homeScore: number; awayScore: number; pointsAwarded: number }>;
};

const GROUP_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;

const KNOCKOUT_STAGES: Record<string, string> = {
  ROUND_OF_32: "R32",
  ROUND_OF_16: "R16",
  QUARTER_FINAL: "QF",
  SEMI_FINAL: "SF",
  THIRD_PLACE: "3rd",
  FINAL: "Final",
};

function getMatchGroup(match: FilterableMatch): string | null {
  if (match.stage !== "GROUP") return null;
  return match.homeTeam.groupName ?? match.awayTeam.groupName ?? null;
}

export function MatchFilter({
  matches,
  locale,
  nowISO,
  readOnly = false,
}: {
  matches: FilterableMatch[];
  locale: Locale;
  nowISO: string;
  /** When true, hides prediction forms — used for the public /matches schedule page */
  readOnly?: boolean;
}) {
  const [filter, setFilter] = useState<string>("all");
  const now = new Date(nowISO);

  const availableGroups = GROUP_LETTERS.filter((g) =>
    matches.some((m) => getMatchGroup(m) === g),
  );
  const availableKnockout = Object.keys(KNOCKOUT_STAGES).filter((s) =>
    matches.some((m) => m.stage === s),
  );

  const filtered =
    filter === "all"
      ? matches
      : availableGroups.includes(filter as typeof GROUP_LETTERS[number])
        ? matches.filter((m) => getMatchGroup(m) === filter)
        : matches.filter((m) => m.stage === filter);

  const totalFiltered = filtered.length;

  return (
    <div>
      <div className="match-filter-bar" role="tablist" aria-label="Filter matches">
        <button
          role="tab"
          aria-selected={filter === "all"}
          className={`filter-pill ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All <span className="filter-count">{matches.length}</span>
        </button>

        {availableGroups.length > 0 && (
          <>
            <span className="filter-divider" aria-hidden>Groups</span>
            {availableGroups.map((g) => {
              const count = matches.filter((m) => getMatchGroup(m) === g).length;
              return (
                <button
                  key={g}
                  role="tab"
                  aria-selected={filter === g}
                  className={`filter-pill ${filter === g ? "active" : ""}`}
                  onClick={() => setFilter(g)}
                >
                  {g}
                  <span className="filter-count">{count}</span>
                </button>
              );
            })}
          </>
        )}

        {availableKnockout.length > 0 && (
          <>
            <span className="filter-divider" aria-hidden>Knockout</span>
            {availableKnockout.map((s) => {
              const count = matches.filter((m) => m.stage === s).length;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={filter === s}
                  className={`filter-pill ${filter === s ? "active" : ""}`}
                  onClick={() => setFilter(s)}
                >
                  {KNOCKOUT_STAGES[s]}
                  <span className="filter-count">{count}</span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {totalFiltered === 0 ? (
        <div className="empty-state">{t(locale, "dashboard.empty")}</div>
      ) : null}

      <div className="match-list">
        {filtered.map((match) => {
          const prediction = match.predictions[0];
          const kickoffAt = new Date(match.kickoffAt);
          const locked = isPredictionLocked(kickoffAt, now);
          const completed = match.homeScore !== null && match.awayScore !== null;
          const statusLabel = completed
            ? t(locale, "match.completed")
            : locked
              ? t(locale, "match.locked")
              : t(locale, "match.upcoming");
          const statusClass = completed ? "green" : locked ? "locked" : "gold";
          const groupLabel = getMatchGroup(match);
          const stageLabel = match.stage === "GROUP"
            ? `Group ${groupLabel}`
            : (KNOCKOUT_STAGES[match.stage] ?? match.stage.replaceAll("_", " "));

          return (
            <article
              className={`campaign-match-card${locked && !completed ? " locked" : ""}${completed ? " finalized" : ""}`}
              key={match.id}
            >
              <div className="campaign-match-top">
                <span className={`badge ${statusClass}`}>{statusLabel}</span>
                <span className="badge dark">{stageLabel}</span>
                <span className="muted" style={{ fontSize: "0.8rem" }}>
                  {match.venue}
                </span>
              </div>
              <div className="campaign-match-main">
                <div className="campaign-team">
                  <TeamFlag team={match.homeTeam} size="lg" />
                  <strong>{match.homeTeam.name}</strong>
                </div>
                <div className="campaign-kickoff">
                  <strong>
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Europe/Brussels",
                    }).format(kickoffAt)}
                  </strong>
                  <span className="muted" style={{ fontSize: "0.76rem" }}>
                    {t(locale, "match.kickoff")} · Brussels
                  </span>
                </div>
                <div className="campaign-team">
                  <TeamFlag team={match.awayTeam} size="lg" />
                  <strong>{match.awayTeam.name}</strong>
                </div>
              </div>
              {/* Score display (always shown when completed) */}
              {completed && (
                <div className="campaign-match-score">
                  <span className="match-score-value">{match.homeScore}</span>
                  <span className="match-score-sep">–</span>
                  <span className="match-score-value">{match.awayScore}</span>
                </div>
              )}

              {/* Prediction area — hidden in readOnly mode */}
              {!readOnly && (
                <div className="campaign-prediction-area">
                  <span className="muted">
                    {prediction ? t(locale, "match.yourPrediction") : t(locale, "match.enterPrediction")}
                  </span>
                  <PredictionForm
                    matchId={match.id}
                    locked={locked}
                    homeScore={prediction?.homeScore}
                    awayScore={prediction?.awayScore}
                    locale={locale}
                  />
                  <div className="campaign-match-footer">
                    {completed ? (
                      <span className="badge green">
                        {t(locale, "match.finalScore")}: {match.homeScore} – {match.awayScore}
                      </span>
                    ) : null}
                    {locked && !completed ? (
                      <span className="badge locked">{t(locale, "match.predictionLocked")}</span>
                    ) : null}
                    {prediction ? (
                      <span className="badge points">
                        {prediction.pointsAwarded} {t(locale, "match.pointsEarned")}
                      </span>
                    ) : null}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
