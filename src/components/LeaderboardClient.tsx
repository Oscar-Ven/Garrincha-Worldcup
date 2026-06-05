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

type FilterValue = "global" | "my-center" | "country" | "friends";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getInitialColor(id: string): string {
  const colors = [
    "#5FE090","#F5C242","#46C878","#6FB3FF","#E0A92E",
    "#5FE090","#F5C242","#46C878","#6FB3FF","#E0A92E",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function accuracy(predictionCount: number): string {
  if (predictionCount === 0) return "0%";
  // Rough accuracy proxy — predictions made vs total
  return Math.round((predictionCount / TOTAL_MATCHES) * 100) + "%";
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function ShieldIcon({ color }: { color: string }) {
  return (
    <svg width="32" height="36" viewBox="0 0 32 36" fill="none" aria-hidden>
      <path
        d="M16 2L3 7V18C3 25.18 8.68 31.9 16 34C23.32 31.9 29 25.18 29 18V7L16 2Z"
        fill={color}
        fillOpacity="0.15"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M16 8L9 11V18C9 22.42 12.13 26.55 16 28C19.87 26.55 23 22.42 23 18V11L16 8Z"
        fill={color}
        fillOpacity="0.25"
      />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9H3a1 1 0 01-1-1V5a1 1 0 011-1h3"/><path d="M18 9h3a1 1 0 001-1V5a1 1 0 00-1-1h-3"/>
      <path d="M6 2h12v10a6 6 0 01-12 0V2z"/><path d="M12 18v4"/><path d="M8 22h8"/>
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Podium positions ─────────────────────────────────────────────────────────

const PODIUM_CONFIG = [
  { rank: 1, label: "1st", shieldColor: "#F5C242", rankColor: "#F5C242", rankBg: "rgba(245,194,66,0.14)", rankBorder: "rgba(245,194,66,0.28)", height: "podium-card--first" },
  { rank: 2, label: "2nd", shieldColor: "#B8C1B1", rankColor: "#F1F5EE", rankBg: "rgba(255,255,255,0.06)", rankBorder: "rgba(255,255,255,0.16)", height: "podium-card--second" },
  { rank: 3, label: "3rd", shieldColor: "#E0A92E", rankColor: "#F5C242", rankBg: "rgba(245,194,66,0.10)", rankBorder: "rgba(245,194,66,0.22)", height: "podium-card--third" },
] as const;

// ─── Player avatar ────────────────────────────────────────────────────────────

function PlayerAvatar({ name, id, size = "md" }: { name: string; id: string; size?: "sm" | "md" | "lg" }) {
  const color = getInitialColor(id);
  const sizeClass = size === "lg" ? "lb-avatar--lg" : size === "sm" ? "lb-avatar--sm" : "";
  return (
    <span
      className={`lb-avatar ${sizeClass}`}
      style={{
        background: `${color}18`,
        border: `1.5px solid ${color}40`,
        color,
      }}
    >
      {initials(name)}
    </span>
  );
}

// ─── Podium card ─────────────────────────────────────────────────────────────

function PodiumCard({ row, config }: { row: LbRow; config: typeof PODIUM_CONFIG[number] }) {
  const iso = isoCodeForNationality(row.nationality);
  const centerShort = row.center.replace(/^GARRINCHA\s+/i, "");

  return (
    <div className={`podium-card ${config.height}`}>
      <div className="podium-card-shield">
        <ShieldIcon color={config.shieldColor} />
        <span className="podium-card-rank-num" style={{ color: config.shieldColor }}>
          {config.rank}
        </span>
      </div>

      <PlayerAvatar name={row.name} id={row.id} size="lg" />

      <div className="podium-card-info">
        <span className="podium-card-name">{row.name}</span>
        <span className="podium-card-center">{centerShort}</span>
        {iso && (
          <span className="podium-card-nat">
            <CountryFlag isoCode={iso} label={row.nationality} size="sm" />
            <span>{row.nationality}</span>
          </span>
        )}
      </div>

      <div
        className="podium-card-pts"
        style={{ background: config.rankBg, border: `1px solid ${config.rankBorder}`, color: config.rankColor }}
      >
        <TrophyIcon />
        <span>{row.points.toLocaleString()}</span>
        <span className="podium-card-pts-label">pts</span>
      </div>
    </div>
  );
}

// ─── Scoring section ──────────────────────────────────────────────────────────

function ScoringSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lb-scoring-section">
      <button
        className="lb-scoring-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="lb-scoring-detail"
      >
        <span className="lb-scoring-toggle-icon">
          <StarIcon />
        </span>
        <span className="lb-scoring-toggle-text">About the scoring</span>
        <span className={`lb-scoring-toggle-chevron${open ? " open" : ""}`}>
          <ChevronDown />
        </span>
      </button>

      {open && (
        <div id="lb-scoring-detail" className="lb-scoring-detail">
          <p className="lb-scoring-intro">
            Points are awarded after each match based on how well your prediction matched the result.
          </p>
          <div className="lb-scoring-grid">
            {[
              { pts: 5, label: "Exact score",         desc: "You predicted the exact final score",    accent: "#F5C242" },
              { pts: 3, label: "Correct result + goal difference", desc: "Correct outcome and goal difference", accent: "#5FE090" },
              { pts: 2, label: "Correct result",       desc: "Correct outcome (win / draw / loss)",    accent: "#46C878" },
              { pts: 0, label: "Wrong prediction",     desc: "Incorrect match outcome",                accent: "rgba(241,245,238,0.42)" },
            ].map((s) => (
              <div key={s.pts} className="lb-scoring-row">
                <span className="lb-scoring-pts" style={{ color: s.accent }}>+{s.pts}</span>
                <div>
                  <div className="lb-scoring-row-label">{s.label}</div>
                  <div className="lb-scoring-row-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="lb-empty">
      <div className="lb-empty-icon">
        <TrophyIcon />
      </div>
      <h3 className="lb-empty-title">Tournament not started yet</h3>
      <p className="lb-empty-sub">
        The FIFA World Cup 2026 kicks off on June 11. Register now, predict every match,
        and climb the leaderboard for your GARRINCHA Center.
      </p>
      <Link href="/register" className="cta cta-green cta-md">
        Register for free
      </Link>
    </div>
  );
}

// ─── Desktop rank table row ───────────────────────────────────────────────────

function RankRow({ row, rank }: { row: LbRow; rank: number }) {
  const iso = isoCodeForNationality(row.nationality);
  const centerShort = row.center.replace(/^GARRINCHA\s+/i, "");
  const isTop3 = rank <= 3;

  const medalColors: Record<number, string> = {
    1: "#F5C242",
    2: "#B8C1B1",
    3: "#E0A92E",
  };
  const rankColor = medalColors[rank];

  return (
    <tr className={`rank-row${isTop3 ? " rank-row--medal" : ""}`}>
      <td className="rank-cell rank-cell--num">
        <span
          className="rank-num"
          style={rankColor ? { color: rankColor, fontWeight: 700 } : undefined}
        >
          {rank}
        </span>
      </td>
      <td className="rank-cell rank-cell--player">
        <div className="rank-player">
          <PlayerAvatar name={row.name} id={row.id} size="sm" />
          <div className="rank-player-text">
            <span className="rank-player-name">{row.name}</span>
            <span className="rank-player-meta">
              {iso && <CountryFlag isoCode={iso} label={row.nationality} size="sm" />}
              <span>{row.nationality}</span>
              {centerShort && (
                <>
                  <span className="rank-meta-sep">·</span>
                  <span>{centerShort}</span>
                </>
              )}
            </span>
          </div>
        </div>
      </td>
      <td className="rank-cell rank-cell--pts">
        <span className="rank-pts" style={rankColor ? { color: rankColor } : undefined}>
          {row.points.toLocaleString()}
        </span>
      </td>
      <td className="rank-cell rank-cell--matches">
        <span className="rank-matches">{row.predictionCount} / {TOTAL_MATCHES}</span>
      </td>
      <td className="rank-cell rank-cell--accuracy">
        <span className="rank-accuracy">{accuracy(row.predictionCount)}</span>
      </td>
    </tr>
  );
}

// ─── Mobile rank card ─────────────────────────────────────────────────────────

function MobileRankCard({ row, rank }: { row: LbRow; rank: number }) {
  const iso = isoCodeForNationality(row.nationality);
  const centerShort = row.center.replace(/^GARRINCHA\s+/i, "");
  const isTop3 = rank <= 3;

  const medalColors: Record<number, string> = {
    1: "#F5C242",
    2: "#B8C1B1",
    3: "#E0A92E",
  };
  const rankColor = medalColors[rank];

  return (
    <div className={`rank-card${isTop3 ? " rank-card--medal" : ""}`}
      style={rankColor ? { borderLeftColor: rankColor } : undefined}>
      <span
        className="rank-card-num"
        style={rankColor ? { color: rankColor } : undefined}
      >
        {rank}
      </span>
      <PlayerAvatar name={row.name} id={row.id} size="sm" />
      <div className="rank-card-info">
        <span className="rank-player-name">{row.name}</span>
        <span className="rank-player-meta">
          {iso && <CountryFlag isoCode={iso} label={row.nationality} size="sm" />}
          <span>{row.nationality}</span>
          {centerShort && (
            <>
              <span className="rank-meta-sep">·</span>
              <span>{centerShort}</span>
            </>
          )}
        </span>
      </div>
      <div className="rank-card-right">
        <span className="rank-pts" style={rankColor ? { color: rankColor } : undefined}>
          {row.points.toLocaleString()}
        </span>
        <span className="rank-card-pts-label">pts</span>
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
  const [filter, setFilter] = useState<FilterValue>("global");
  const [natFilter, setNatFilter] = useState<string>("all");

  // Available nationalities (for country filter)
  const nationalities = Array.from(new Set(rows.map((r) => r.nationality).filter(Boolean))).sort();

  // Filtered rows
  const filteredRows =
    filter === "country" && natFilter !== "all"
      ? rows.filter((r) => r.nationality === natFilter)
      : rows;

  const top3 = filteredRows.slice(0, 3);
  const rest = filteredRows.slice(3);

  // Tabs config
  const TABS: { value: FilterValue; label: string; enabled: boolean }[] = [
    { value: "global",    label: "Centers",   enabled: true  },
    { value: "my-center", label: "My Center", enabled: false },
    { value: "country",   label: "Country",   enabled: true  },
    { value: "friends",   label: "Friends",   enabled: false },
  ];

  return (
    <div className="lb-client">

      {/* ── Filter tabs ─────────────────────────────────────────────────────── */}
      <div className="lb-tabs" role="tablist" aria-label="Leaderboard filters">
        {TABS.map(({ value, label, enabled }) => (
          <button
            key={value}
            role="tab"
            aria-selected={filter === value && enabled}
            aria-disabled={!enabled}
            className={[
              "lb-tab",
              filter === value && enabled ? "lb-tab--active" : "",
              !enabled ? "lb-tab--disabled" : "",
            ].join(" ").trim()}
            onClick={() => enabled && setFilter(value)}
            tabIndex={enabled ? 0 : -1}
            title={!enabled ? "Coming soon" : undefined}
          >
            {label}
            {!enabled && <span className="lb-tab-soon">soon</span>}
          </button>
        ))}
      </div>

      {/* Country sub-filter */}
      {filter === "country" && (
        <div className="lb-nat-filter" role="group" aria-label="Filter by country">
          <button
            className={`lb-nat-btn${natFilter === "all" ? " lb-nat-btn--active" : ""}`}
            onClick={() => setNatFilter("all")}
          >
            All
          </button>
          {nationalities.map((nat) => (
            <button
              key={nat}
              className={`lb-nat-btn${natFilter === nat ? " lb-nat-btn--active" : ""}`}
              onClick={() => setNatFilter(nat)}
            >
              {nat}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {filteredRows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Podium — top 3 ──────────────────────────────────────────────── */}
          {top3.length >= 3 && (
            <div className="podium">
              {/* Order: 2nd | 1st | 3rd */}
              <PodiumCard row={top3[1]} config={PODIUM_CONFIG[1]} />
              <PodiumCard row={top3[0]} config={PODIUM_CONFIG[0]} />
              <PodiumCard row={top3[2]} config={PODIUM_CONFIG[2]} />
            </div>
          )}

          {/* Participant count */}
          <div className="lb-meta-bar">
            <span className="lb-meta-count">{total.toLocaleString()} participants</span>
            <span className="lb-meta-sort">Sorted by points</span>
          </div>

          {/* ── Desktop table ────────────────────────────────────────────────── */}
          <div className="rank-table-wrap">
            <table className="rank-table" aria-label="Leaderboard rankings">
              <thead>
                <tr className="rank-thead-row">
                  <th className="rank-th rank-th--num">#</th>
                  <th className="rank-th rank-th--player">Name</th>
                  <th className="rank-th rank-th--pts">Points</th>
                  <th className="rank-th rank-th--matches">Matches</th>
                  <th className="rank-th rank-th--accuracy">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {/* Top 3 always shown in table too */}
                {top3.map((row, i) => (
                  <RankRow key={row.id} row={row} rank={i + 1} />
                ))}
                {rest.length > 0 && (
                  <tr className="rank-divider-row" aria-hidden>
                    <td colSpan={5}><div className="rank-divider" /></td>
                  </tr>
                )}
                {rest.map((row, i) => (
                  <RankRow key={row.id} row={row} rank={i + 4} />
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ─────────────────────────────────────────────────── */}
          <div className="rank-cards">
            {filteredRows.map((row, i) => (
              <MobileRankCard key={row.id} row={row} rank={i + 1} />
            ))}
          </div>
        </>
      )}

      {/* ── About scoring ───────────────────────────────────────────────────── */}
      <ScoringSection />

      {/* ── Register CTA ────────────────────────────────────────────────────── */}
      <div className="lb-cta-section">
        <div className="lb-cta-inner">
          <div className="lb-cta-icon" aria-hidden>
            <TrophyIcon />
          </div>
          <div className="lb-cta-text">
            <h3 className="lb-cta-title">Not on the leaderboard yet?</h3>
            <p className="lb-cta-sub">
              Register free, predict every match, and compete for the top spot
              at your GARRINCHA Center.
            </p>
          </div>
          <Link href="/register" className="cta cta-green cta-md lb-cta-btn">
            Register for free
          </Link>
        </div>
      </div>

    </div>
  );
}
