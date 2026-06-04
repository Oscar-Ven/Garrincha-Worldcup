"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CountryFlag } from "@/components/Flag";
import { isoCodeForTeam } from "@/lib/flags";
import { isPredictionLocked } from "@/lib/scoring";

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

// ─── Constants ────────────────────────────────────────────────────────────────

// 16 official FIFA World Cup 2026 host venues
const WC2026_VENUES = [
  "Estadio Azteca, Mexico City",
  "MetLife Stadium, New York",
  "AT&T Stadium, Dallas",
  "Levi's Stadium, San Francisco",
  "Rose Bowl, Los Angeles",
  "SoFi Stadium, Los Angeles",
  "Empower Field, Denver",
  "Arrowhead Stadium, Kansas City",
  "Gillette Stadium, Boston",
  "Lincoln Financial Field, Philadelphia",
  "NRG Stadium, Houston",
  "BMO Field, Toronto",
  "BC Place, Vancouver",
  "Estadio BBVA, Monterrey",
  "Estadio Akron, Guadalajara",
  "Q2 Stadium, Austin",
];

const STAGE_LABELS: Record<string, string> = {
  GROUP:        "Group Stage",
  ROUND_OF_32:  "R32",
  ROUND_OF_16:  "R16",
  QUARTER_FINAL:"QF",
  SEMI_FINAL:   "SF",
  THIRD_PLACE:  "3rd",
  FINAL:        "Final",
};

const STATUS_LABELS = {
  UPCOMING: "UPCOMING",
  LIVE:     "LIVE",
  FINISHED: "FINISHED",
  LOCKED:   "LOCKED",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveVenue(venue: string, matchNo: number | null): string {
  if (!venue || venue.startsWith("Venue #") || venue.startsWith("TBD")) {
    const idx = matchNo !== null ? (matchNo - 1) % WC2026_VENUES.length : 0;
    return WC2026_VENUES[idx];
  }
  return venue;
}

function cleanTeamName(name: string): string {
  if (!name || name.startsWith("TBD")) return "TBD";
  return name;
}

function getGroup(match: PublicMatch): string | null {
  if (match.stage !== "GROUP") return null;
  return match.homeTeam.groupName ?? match.awayTeam.groupName ?? null;
}

function getStageLabel(match: PublicMatch): string {
  if (match.stage === "GROUP") {
    const g = getGroup(match);
    return g ? `Group ${g}` : "Group Stage";
  }
  return STAGE_LABELS[match.stage] ?? match.stage.replace(/_/g, " ");
}

function getStatus(match: PublicMatch, now: Date): keyof typeof STATUS_LABELS {
  if (match.homeScore !== null && match.awayScore !== null) return "FINISHED";
  const ko = new Date(match.kickoffAt);
  if (now >= ko) {
    const plus2h = new Date(ko.getTime() + 2 * 60 * 60 * 1000);
    return now < plus2h ? "LIVE" : "LOCKED";
  }
  return "UPCOMING";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Brussels" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" }),
  };
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconChevron = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
    <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ match, now }: { match: PublicMatch; now: Date }) {
  const status = getStatus(match, now);
  const stageLabel = getStageLabel(match);
  const venue = resolveVenue(match.venue, match.fifaMatchNo);
  const { date, time } = formatDate(match.kickoffAt);
  const homeIso = isoCodeForTeam(match.homeTeam);
  const awayIso = isoCodeForTeam(match.awayTeam);
  const isFinished = status === "FINISHED";

  return (
    <article className="mc-card">
      {/* Card header */}
      <div className="mc-card-head">
        <div className="mc-card-meta">
          {match.fifaMatchNo && (
            <span className="mc-card-num" aria-label={`Match ${match.fifaMatchNo}`}>
              {match.fifaMatchNo}
            </span>
          )}
          <span className="mc-card-stage">{stageLabel}</span>
        </div>
        <span className={`mc-status mc-status--${status.toLowerCase()}`} aria-label={`Status: ${status}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Teams */}
      <div className="mc-card-teams">
        <div className="mc-team">
          <div className="mc-flag-wrap">
            {homeIso ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/flags/countries/${homeIso.toLowerCase()}.svg`}
                alt={match.homeTeam.name}
                className="mc-flag"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="mc-flag-placeholder" aria-hidden>?</div>
            )}
          </div>
          <span className="mc-team-name">{cleanTeamName(match.homeTeam.name)}</span>
        </div>

        <div className="mc-center-col">
          {isFinished ? (
            <div className="mc-final-score">
              <span>{match.homeScore}</span>
              <span className="mc-score-sep">–</span>
              <span>{match.awayScore}</span>
            </div>
          ) : (
            <span className="mc-vs">VS</span>
          )}
        </div>

        <div className="mc-team">
          <div className="mc-flag-wrap">
            {awayIso ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/flags/countries/${awayIso.toLowerCase()}.svg`}
                alt={match.awayTeam.name}
                className="mc-flag"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="mc-flag-placeholder" aria-hidden>?</div>
            )}
          </div>
          <span className="mc-team-name">{cleanTeamName(match.awayTeam.name)}</span>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="mc-card-foot">
        <span className="mc-info-item">
          <IconCalendar />
          {date} · {time}
        </span>
        <span className="mc-info-item">
          <IconPin />
          {venue}
        </span>
      </div>
    </article>
  );
}

// ─── Scoring Panel ────────────────────────────────────────────────────────────

function ScoringPanel() {
  return (
    <div className="mc-scoring-detail">
      <div className="mc-scoring-grid">
        {[
          { pts: 5, label: "Exact score", desc: "You predicted the exact final score" },
          { pts: 3, label: "Result + goal diff", desc: "Correct outcome and goal difference" },
          { pts: 2, label: "Correct result", desc: "Correct outcome (win / draw / loss)" },
          { pts: 0, label: "Wrong prediction", desc: "Incorrect match outcome" },
        ].map((s) => (
          <div key={s.pts} className="mc-scoring-row">
            <span className="mc-scoring-pts" style={{ color: s.pts >= 3 ? "var(--mc-gold)" : s.pts === 2 ? "var(--mc-green)" : "var(--mc-muted)" }}>
              +{s.pts}
            </span>
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

// ─── Main component ───────────────────────────────────────────────────────────

const GROUP_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;

type FilterValue = "all" | "groups" | "knockout" | "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L" | "ROUND_OF_32"|"ROUND_OF_16"|"QUARTER_FINAL"|"SEMI_FINAL"|"THIRD_PLACE"|"FINAL";

export function MatchesClient({ matches }: { matches: PublicMatch[] }) {
  const now = useMemo(() => new Date(), []);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [scoringOpen, setScoringOpen] = useState(false);

  const availableGroups = GROUP_LETTERS.filter((g) =>
    matches.some((m) => getGroup(m) === g)
  );
  const hasKnockout = matches.some((m) => m.stage !== "GROUP");

  const filtered = useMemo(() => {
    if (filter === "all") return matches;
    if (filter === "groups") return matches.filter((m) => m.stage === "GROUP");
    if (filter === "knockout") return matches.filter((m) => m.stage !== "GROUP");
    if (availableGroups.includes(filter as typeof GROUP_LETTERS[number])) {
      return matches.filter((m) => getGroup(m) === filter);
    }
    return matches.filter((m) => m.stage === filter);
  }, [matches, filter, availableGroups]);

  const filterCount = filtered.length;

  // Build filter rows
  const row1Filters: Array<{ value: FilterValue; label: string }> = [
    { value: "all",    label: `All ${matches.length}` },
    { value: "groups", label: "Groups" },
    ...availableGroups.map((g) => ({ value: g as FilterValue, label: `Group ${g}` })),
  ];

  const row2Filters: Array<{ value: FilterValue; label: string }> = hasKnockout ? [
    { value: "knockout",     label: "Knockout" },
    { value: "ROUND_OF_32",  label: "R32" },
    { value: "ROUND_OF_16",  label: "R16" },
    { value: "QUARTER_FINAL",label: "QF" },
    { value: "SEMI_FINAL",   label: "SF" },
    { value: "THIRD_PLACE",  label: "3rd" },
    { value: "FINAL",        label: "Final" },
  ] : [];

  const filterLabel =
    filter === "all" ? "All Matches" :
    filter === "groups" ? "Group Stage" :
    filter === "knockout" ? "Knockout Stage" :
    availableGroups.includes(filter as typeof GROUP_LETTERS[number]) ? `Group ${filter}` :
    STAGE_LABELS[filter] ?? filter;

  return (
    <div className="mc-body">
      {/* ── Scoring info card ── */}
      <div className="mc-scoring-card">
        <div className="mc-scoring-icon-wrap" aria-hidden>
          <IconStar />
        </div>
        <div className="mc-scoring-text">
          <div className="mc-scoring-title">How points work</div>
          <div className="mc-scoring-sub">Correct score, goal difference, and match result earn you points.</div>
        </div>
        <button
          className="mc-scoring-btn"
          onClick={() => setScoringOpen(!scoringOpen)}
          aria-expanded={scoringOpen}
          aria-controls="scoring-panel"
        >
          View scoring <IconChevron />
        </button>
      </div>

      {scoringOpen && (
        <div id="scoring-panel">
          <ScoringPanel />
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="mc-filters" role="tablist" aria-label="Filter matches">
        <div className="mc-filter-row">
          {row1Filters.map(({ value, label }) => (
            <button
              key={value}
              role="tab"
              aria-selected={filter === value}
              className={`mc-filter-btn${filter === value ? " mc-filter-btn--active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {row2Filters.length > 0 && (
          <div className="mc-filter-row">
            {row2Filters.map(({ value, label }) => (
              <button
                key={value}
                role="tab"
                aria-selected={filter === value}
                className={`mc-filter-btn${filter === value ? " mc-filter-btn--active" : ""}${value === "knockout" ? " mc-filter-btn--section" : ""}`}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Match list header ── */}
      <div className="mc-list-header">
        <div className="mc-list-title">
          <span>{filterLabel}</span>
          <span className="mc-list-count">{filterCount} {filterCount === 1 ? "match" : "matches"}</span>
        </div>
        <div className="mc-sort-wrap">
          <select className="mc-sort-select" aria-label="Sort matches" defaultValue="date">
            <option value="date">Sort by: Date</option>
          </select>
        </div>
      </div>

      {/* ── Match grid ── */}
      {filterCount === 0 ? (
        <div className="mc-empty">No matches in this view.</div>
      ) : (
        <div className="mc-grid">
          {filtered.map((match) => (
            <MatchCard key={match.id} match={match} now={now} />
          ))}
        </div>
      )}

      {/* ── Bottom CTA ── */}
      <div className="mc-cta-block">
        <div className="mc-cta-title">Predict every match. Win for your center.</div>
        <p className="mc-cta-sub">Register free at any GARRINCHA Center, predict before kickoff, and climb the leaderboard.</p>
        <div className="mc-cta-btns">
          <Link href="/register" className="cta cta-green cta-md">Register for free</Link>
          <Link href="/login" className="cta cta-ghost cta-md">I have an access link</Link>
        </div>
      </div>
    </div>
  );
}
