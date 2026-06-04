"use client";

import { useState } from "react";
import Link from "next/link";
import { CountryFlag } from "@/components/Flag";
import { isoCodeForNationality } from "@/lib/flags";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LbRow = {
  id: string;
  name: string;
  nationality: string;
  center: string;
  points: number;
  predictionCount: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_MATCHES = 104;

type FilterValue = "overall" | "nationality";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getInitialColor(id: string): string {
  const colors = [
    "#5FE090","#F5C242","#6FB3FF","#FF8C66","#C792EA","#4ED9C0",
    "#FF9F1C","#78D97C","#FF5A4D","#63b3ed",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

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

// ─── Rank badge ───────────────────────────────────────────────────────────────

const RANK_STYLES: Record<number, { bg: string; color: string; border: string }> = {
  1: { bg: "rgba(245,194,66,0.2)",  color: "#F5C242", border: "1px solid rgba(245,194,66,0.5)" },
  2: { bg: "rgba(200,200,210,0.14)", color: "#C8CDD4", border: "1px solid rgba(200,200,210,0.4)" },
  3: { bg: "rgba(205,139,91,0.16)", color: "#CD8B5B", border: "1px solid rgba(205,139,91,0.4)" },
};

function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank];
  return (
    <span
      className="lb-rank-badge"
      style={style ? { background: style.bg, color: style.color, border: style.border } : undefined}
    >
      {rank}
    </span>
  );
}

// ─── Player avatar ────────────────────────────────────────────────────────────

function PlayerAvatar({ name, id }: { name: string; id: string }) {
  const color = getInitialColor(id);
  return (
    <span className="lb-avatar" style={{ background: `${color}22`, border: `1.5px solid ${color}55`, color }}>
      {initials(name)}
    </span>
  );
}

// ─── Scoring panel ────────────────────────────────────────────────────────────

function ScoringPanel() {
  return (
    <div className="mc-scoring-detail">
      <div className="mc-scoring-grid">
        {[
          { pts: 5, label: "Exact score",        desc: "You predicted the exact final score", color: "var(--mc-gold)" },
          { pts: 3, label: "Result + goal diff",  desc: "Correct outcome and goal difference", color: "var(--mc-gold)" },
          { pts: 2, label: "Correct result",      desc: "Correct outcome (win/draw/loss)",     color: "var(--mc-green)" },
          { pts: 0, label: "Wrong prediction",    desc: "Incorrect match outcome",             color: "var(--mc-faint)" },
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="lb-empty-state">
      <div className="lb-empty-icon">🏆</div>
      <h3 className="lb-empty-title">Tournament not started yet</h3>
      <p className="lb-empty-sub">
        The FIFA World Cup 2026 kicks off on June 11. Register now, predict every match, and climb the leaderboard.
      </p>
      <div className="lb-empty-scoring">
        {[
          { pts: 5, label: "Exact score" },
          { pts: 3, label: "Correct result + goal diff" },
          { pts: 2, label: "Correct result" },
          { pts: 0, label: "Wrong prediction" },
        ].map((s) => (
          <div key={s.pts} className="lb-empty-score-item">
            <span className="lb-empty-score-pts" style={{ color: s.pts >= 3 ? "var(--mc-gold)" : s.pts === 2 ? "var(--mc-green)" : "var(--mc-faint)" }}>
              +{s.pts}
            </span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <Link href="/register" className="cta cta-green cta-md" style={{ display: "inline-flex", marginTop: 20 }}>
        Register for free
      </Link>
    </div>
  );
}

// ─── Leaderboard table row (desktop) ─────────────────────────────────────────

function TableRow({ row, rank, isTop3 }: { row: LbRow; rank: number; isTop3: boolean }) {
  const rankStyle = RANK_STYLES[rank];
  const iso = isoCodeForNationality(row.nationality);

  return (
    <tr className={`lb-tr${isTop3 ? " lb-tr--top3" : ""}`}
      style={rankStyle ? { borderLeft: `3px solid ${rankStyle.color}` } : undefined}>
      <td className="lb-td lb-td-rank">
        <RankBadge rank={rank} />
      </td>
      <td className="lb-td lb-td-player">
        <div className="lb-player">
          <PlayerAvatar name={row.name} id={row.id} />
          <div className="lb-player-info">
            <span className="lb-player-name">{row.name}</span>
            <span className="lb-player-nat">
              {iso && (
                <CountryFlag isoCode={iso} label={row.nationality} size="sm" />
              )}
              <span>{row.nationality}</span>
            </span>
          </div>
        </div>
      </td>
      <td className="lb-td lb-td-center">
        <span className="lb-center">{row.center.replace("GARRINCHA ", "")}</span>
      </td>
      <td className="lb-td lb-td-preds">
        <span className="lb-preds">{row.predictionCount} / {TOTAL_MATCHES}</span>
      </td>
      <td className="lb-td lb-td-pts">
        <span className="lb-pts" style={{ color: rank <= 3 ? (rankStyle?.color ?? "var(--mc-gold)") : "var(--mc-gold)" }}>
          {row.points.toLocaleString()}
        </span>
      </td>
      <td className="lb-td lb-td-change">
        <span className="lb-change lb-change--neutral">—</span>
      </td>
    </tr>
  );
}

// ─── Mobile leaderboard card ──────────────────────────────────────────────────

function MobileCard({ row, rank }: { row: LbRow; rank: number }) {
  const rankStyle = RANK_STYLES[rank];
  const iso = isoCodeForNationality(row.nationality);

  return (
    <div className={`lb-mobile-card${rank <= 3 ? " lb-mobile-card--top3" : ""}`}
      style={rankStyle ? { borderLeft: `3px solid ${rankStyle.color}` } : undefined}>
      <RankBadge rank={rank} />
      <PlayerAvatar name={row.name} id={row.id} />
      <div className="lb-mobile-info">
        <span className="lb-player-name">{row.name}</span>
        <span className="lb-player-nat">
          {iso && <CountryFlag isoCode={iso} label={row.nationality} size="sm" />}
          <span>{row.nationality}</span>
        </span>
      </div>
      <div className="lb-mobile-pts">
        <span className="lb-pts" style={{ color: rank <= 3 ? (rankStyle?.color ?? "var(--mc-gold)") : "var(--mc-gold)" }}>
          {row.points.toLocaleString()}
        </span>
        <span className="lb-change lb-change--neutral">—</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeaderboardClient({
  rows,
  total,
}: {
  rows: LbRow[];
  total: number;
}) {
  const [filter, setFilter] = useState<FilterValue>("overall");
  const [scoringOpen, setScoringOpen] = useState(false);
  const [natFilter, setNatFilter] = useState<string>("all");

  // Available nationalities
  const nationalities = Array.from(new Set(rows.map((r) => r.nationality).filter(Boolean))).sort();

  // Filtered rows
  const filteredRows =
    filter === "nationality" && natFilter !== "all"
      ? rows.filter((r) => r.nationality === natFilter)
      : rows;

  const FILTER_TABS = [
    { value: "overall" as const,     label: "Overall",     available: true },
    { value: "nationality" as const, label: "Nationality",  available: true },
  ];

  // Disabled (UI-only, no backend yet)
  const DISABLED_TABS = ["My Center", "Friends", "Groups", "Knockout", "Exact Scores", "This Week"];

  return (
    <div className="lb-body">
      {/* ── Scoring info card ── */}
      <div className="mc-scoring-card">
        <div className="mc-scoring-icon-wrap" aria-hidden>
          <IconStar />
        </div>
        <div className="mc-scoring-text">
          <div className="mc-scoring-title">Scoring system</div>
          <div className="mc-scoring-sub">Exact score, goal difference, and match result determine your ranking.</div>
        </div>
        <button
          className="mc-scoring-btn"
          onClick={() => setScoringOpen(!scoringOpen)}
          aria-expanded={scoringOpen}
          aria-controls="lb-scoring-panel"
        >
          View scoring <IconChevron />
        </button>
      </div>

      {scoringOpen && (
        <div id="lb-scoring-panel">
          <ScoringPanel />
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="mc-filters" role="tablist" aria-label="Leaderboard filters">
        <div className="mc-filter-row">
          {FILTER_TABS.map(({ value, label }) => (
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
          {DISABLED_TABS.map((label) => (
            <button
              key={label}
              role="tab"
              aria-selected={false}
              aria-disabled="true"
              className="mc-filter-btn mc-filter-btn--disabled"
              title="Coming soon"
              tabIndex={-1}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Nationality sub-filter */}
        {filter === "nationality" && (
          <div className="mc-filter-row lb-nat-filter">
            <button
              className={`mc-filter-btn${natFilter === "all" ? " mc-filter-btn--active" : ""}`}
              onClick={() => setNatFilter("all")}
            >
              All
            </button>
            {nationalities.map((nat) => (
              <button
                key={nat}
                className={`mc-filter-btn${natFilter === nat ? " mc-filter-btn--active" : ""}`}
                onClick={() => setNatFilter(nat)}
              >
                {nat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Leaderboard header ── */}
      <div className="lb-list-header">
        <div className="lb-list-title">
          <span>Leaderboard</span>
          <span className="lb-participant-count">{total.toLocaleString()} participants</span>
        </div>
        <div className="lb-sort-wrap">
          <select className="mc-sort-select" aria-label="Sort leaderboard" defaultValue="points">
            <option value="points">Sort by: Points</option>
          </select>
        </div>
      </div>

      {/* ── Content ── */}
      {filteredRows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Desktop table */}
          <div className="lb-table-wrap">
            <table className="lb-table" aria-label="Leaderboard">
              <thead>
                <tr className="lb-thead-row">
                  <th className="lb-th lb-th-rank">#</th>
                  <th className="lb-th lb-th-player">Player</th>
                  <th className="lb-th lb-th-center">Center</th>
                  <th className="lb-th lb-th-preds">Predictions</th>
                  <th className="lb-th lb-th-pts">Points</th>
                  <th className="lb-th lb-th-change">Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => (
                  <TableRow key={row.id} row={row} rank={i + 1} isTop3={i < 3} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lb-mobile-list">
            {filteredRows.map((row, i) => (
              <MobileCard key={row.id} row={row} rank={i + 1} />
            ))}
          </div>
        </>
      )}

      {/* ── CTA ── */}
      {filteredRows.length > 0 && (
        <div className="mc-cta-block">
          <div className="mc-cta-title">Join the competition.</div>
          <p className="mc-cta-sub">Register free, predict every match, and climb the leaderboard for your GARRINCHA Center.</p>
          <div className="mc-cta-btns">
            <Link href="/register" className="cta cta-green cta-md">Register for free</Link>
          </div>
        </div>
      )}
    </div>
  );
}
