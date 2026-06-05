"use client";

import { useState } from "react";
import { CountryFlag } from "@/components/Flag";
import { PredictionForm } from "@/components/PredictionForm";
import { isoCodeForTeam } from "@/lib/flags";
import { isPredictionLocked } from "@/lib/scoring";
import { t, type Locale } from "@/lib/translations";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FilterableMatch = {
  id: string;
  stage: string;
  fifaMatchNo: number | null;
  venue: string;
  kickoffAt: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { id: string; name: string; fifaCode: string | null; flagUrl: string | null; groupName: string | null };
  awayTeam: { id: string; name: string; fifaCode: string | null; flagUrl: string | null; groupName: string | null };
  predictions: Array<{ id: string; homeScore: number; awayScore: number; pointsAwarded: number }>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUP_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;

const KNOCKOUT_STAGES: Record<string, string> = {
  ROUND_OF_32:   "R32",
  ROUND_OF_16:   "R16",
  QUARTER_FINAL: "QF",
  SEMI_FINAL:    "SF",
  THIRD_PLACE:   "3rd",
  FINAL:         "Final",
};

const STAGE_LABELS: Record<string, string> = {
  GROUP:         "Group Stage",
  ROUND_OF_32:   "Round of 32",
  ROUND_OF_16:   "Round of 16",
  QUARTER_FINAL: "Quarter-final",
  SEMI_FINAL:    "Semi-final",
  THIRD_PLACE:   "3rd Place",
  FINAL:         "Final",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGroup(m: FilterableMatch): string | null {
  if (m.stage !== "GROUP") return null;
  return m.homeTeam.groupName ?? m.awayTeam.groupName ?? null;
}

function getStageLabel(m: FilterableMatch): string {
  if (m.stage === "GROUP") {
    const g = getGroup(m);
    return g ? `Group ${g}` : "Group Stage";
  }
  return STAGE_LABELS[m.stage] ?? m.stage.replace(/_/g, " ");
}

function getStatus(m: FilterableMatch, now: Date): "upcoming" | "live" | "finished" | "locked" {
  const ko = new Date(m.kickoffAt);
  if (m.homeScore !== null && m.awayScore !== null) return "finished";
  if (isPredictionLocked(ko, now)) {
    const fiveMin = 5 * 60 * 1000;
    const ninetyMin = 95 * 60 * 1000;
    const diff = now.getTime() - ko.getTime();
    if (diff > fiveMin && diff < ninetyMin) return "live";
    return "locked";
  }
  return "upcoming";
}

function fmtKickoff(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit",
      timeZone: "Europe/Brussels",
    }).format(d);
  } catch { return iso.slice(0, 10); }
}

// ─── Flag cell ────────────────────────────────────────────────────────────────

function MatchFlag({ team, align }: {
  team: FilterableMatch["homeTeam"];
  align: "left" | "right";
}) {
  const iso = isoCodeForTeam(team);
  const isTbd = !team.name || team.name === "TBD" || team.name.startsWith("TBD");
  const code = team.fifaCode ?? (team.name ? team.name.slice(0, 3).toUpperCase() : "TBD");

  return (
    <div className={`mc-team mc-team--${align}`}>
      <div className="mc-flag-wrap">
        {iso && !isTbd ? (
          <CountryFlag isoCode={iso} label={team.name} size="md" />
        ) : (
          <div className="mc-flag-placeholder" aria-hidden>?</div>
        )}
      </div>
      <span className="mc-team-name">{isTbd ? "TBD" : (team.fifaCode ?? code)}</span>
    </div>
  );
}

// ─── Scoring panel ────────────────────────────────────────────────────────────

function ScoringPanel({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div className="mc-scoring-detail">
      <div className="mc-scoring-grid">
        {[
          { pts: 5, label: "Exact score",       desc: "You predicted the exact final score", color: "var(--mc-gold)" },
          { pts: 3, label: "Result + goal diff", desc: "Correct outcome and goal difference",  color: "var(--mc-gold)" },
          { pts: 2, label: "Correct result",     desc: "Correct outcome (win/draw/loss)",       color: "var(--mc-green)" },
          { pts: 0, label: "Wrong prediction",   desc: "Incorrect match outcome",              color: "var(--mc-faint)" },
        ].map((s) => (
          <div key={s.pts} className="mc-scoring-row">
            <span className="mc-scoring-pts" style={{ color: s.color }}>+{s.pts}</span>
            <div>
              <div className="mc-scoring-row-label">{s.label}</div>
              <div className="mc-scoring-row-desc">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Single match card ────────────────────────────────────────────────────────

function MatchCard({
  match,
  now,
  readOnly,
  locale,
}: {
  match: FilterableMatch;
  now: Date;
  readOnly: boolean;
  locale: Locale;
}) {
  const status = getStatus(match, now);
  const prediction = match.predictions[0];
  const stageLabel = getStageLabel(match);
  const locked = isPredictionLocked(new Date(match.kickoffAt), now);
  const completed = match.homeScore !== null && match.awayScore !== null;

  const statusLabel = {
    upcoming: "UPCOMING",
    live:     "LIVE",
    finished: "FINISHED",
    locked:   "LOCKED",
  }[status];

  return (
    <article className="mc-card">
      {/* Card header */}
      <div className="mc-card-head">
        <div className="mc-card-meta">
          {match.fifaMatchNo && (
            <span className="mc-card-num">#{match.fifaMatchNo}</span>
          )}
          <span className="mc-card-stage">{stageLabel}</span>
        </div>
        <span className={`mc-status mc-status--${status}`}>{statusLabel}</span>
      </div>

      {/* Teams row */}
      <div className="mc-card-teams">
        <MatchFlag team={match.homeTeam} align="left" />

        <div className="mc-card-center">
          {completed ? (
            <div className="mc-final-score">
              <span className="mc-final-num">{match.homeScore}</span>
              <span className="mc-score-sep">–</span>
              <span className="mc-final-num">{match.awayScore}</span>
            </div>
          ) : (
            <div className="mc-kickoff">
              <div className="mc-kickoff-time">{fmtKickoff(match.kickoffAt)}</div>
              <div className="mc-kickoff-tz">Brussels</div>
            </div>
          )}
        </div>

        <MatchFlag team={match.awayTeam} align="right" />
      </div>

      {/* Venue */}
      <div className="mc-card-venue">{match.venue}</div>

      {/* Prediction form — hidden in readOnly mode */}
      {!readOnly && (
        <div className="mc-prediction-wrap">
          {prediction && (
            <div className="mc-your-pred">
              Your prediction:&nbsp;
              <strong style={{ color: prediction.pointsAwarded >= 2 ? "var(--mc-green)" : "var(--mc-faint)" }}>
                {prediction.homeScore} – {prediction.awayScore}
              </strong>
              {completed && (
                <span className="mc-pred-pts" style={{ color: prediction.pointsAwarded >= 2 ? "var(--mc-green)" : "var(--mc-faint)" }}>
                  &nbsp;· +{prediction.pointsAwarded} pts
                </span>
              )}
            </div>
          )}
          <PredictionForm
            matchId={match.id}
            locked={locked}
            homeScore={prediction?.homeScore}
            awayScore={prediction?.awayScore}
            locale={locale}
          />
        </div>
      )}
    </article>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function MatchFilter({
  matches,
  locale,
  nowISO,
  readOnly = false,
}: {
  matches: FilterableMatch[];
  locale: Locale;
  nowISO: string;
  readOnly?: boolean;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [scoringOpen, setScoringOpen] = useState(false);
  const now = new Date(nowISO);

  const availableGroups = GROUP_LETTERS.filter((g) =>
    matches.some((m) => getGroup(m) === g),
  );
  const availableKnockout = Object.keys(KNOCKOUT_STAGES).filter((s) =>
    matches.some((m) => m.stage === s),
  );

  const filtered = filter === "all"
    ? matches
    : availableGroups.includes(filter as typeof GROUP_LETTERS[number])
      ? matches.filter((m) => getGroup(m) === filter)
      : matches.filter((m) => m.stage === filter);

  return (
    <div>
      {/* ── Scoring info ── */}
      {!readOnly && (
        <div className="mc-scoring-card">
          <div className="mc-scoring-icon-wrap" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div className="mc-scoring-text">
            <div className="mc-scoring-title">Scoring system</div>
            <div className="mc-scoring-sub">Exact score = 5 pts · Result + diff = 3 pts · Result = 2 pts</div>
          </div>
          <button
            className="mc-scoring-btn"
            onClick={() => setScoringOpen(!scoringOpen)}
            aria-expanded={scoringOpen}
          >
            View <svg width="12" height="12" viewBox="0 0 16 16" style={{ transform: scoringOpen ? "rotate(180deg)" : undefined }}>
              <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
      {scoringOpen && <ScoringPanel open={scoringOpen} />}

      {/* ── Filter tabs ── */}
      <div className="mc-filters" role="tablist" aria-label="Filter matches">
        <div className="mc-filter-row">
          <button
            role="tab"
            aria-selected={filter === "all"}
            className={`mc-filter-btn${filter === "all" ? " mc-filter-btn--active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All <span style={{ opacity: 0.6, fontSize: 11 }}>{matches.length}</span>
          </button>

          {availableGroups.map((g) => (
            <button
              key={g}
              role="tab"
              aria-selected={filter === g}
              className={`mc-filter-btn${filter === g ? " mc-filter-btn--active" : ""}`}
              onClick={() => setFilter(g)}
            >
              Grp {g}
            </button>
          ))}

          {availableKnockout.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={filter === s}
              className={`mc-filter-btn${filter === s ? " mc-filter-btn--active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {KNOCKOUT_STAGES[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Match grid ── */}
      {filtered.length === 0 ? (
        <div className="mc-empty">{t(locale, "dashboard.empty")}</div>
      ) : (
        <div className="mc-grid">
          {filtered.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              now={now}
              readOnly={readOnly}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
