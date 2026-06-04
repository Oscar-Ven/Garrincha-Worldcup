"use client";

import Link from "next/link";
import { useState } from "react";
import { type Locale, t } from "@/lib/translations";

type Row = { id: string; name: string; nationality: string; center: string; points: number };

const MEDAL_COLOR = ["var(--gold)", "#C8CDD4", "#CD8B5B"];
const MEDAL_BG    = ["rgba(245,194,66,0.12)", "rgba(200,205,212,0.08)", "rgba(205,139,91,0.08)"];

function RankRow({ row, rank }: { row: Row; rank: number }) {
  const medal = rank <= 3 ? MEDAL_COLOR[rank - 1] : null;
  const bg    = rank <= 3 ? MEDAL_BG[rank - 1] : undefined;

  return (
    <div
      className="card rank-row"
      style={bg ? { background: `linear-gradient(100deg,${bg},transparent)`, borderColor: `${medal}40` } : undefined}
    >
      <span className="rank-num" style={{ color: medal ?? "var(--ink-faint)" }}>
        {rank <= 3 ? ["🥇","🥈","🥉"][rank-1] : rank}
      </span>
      <div className="rank-nick" style={{ flex: 1, minWidth: 0 }}>
        <div className="rank-nick-name">{row.name}</div>
        <div className="rank-nick-meta">{row.center}</div>
      </div>
      <div className="rank-pts-wrap" style={{ textAlign: "right" }}>
        <div className="rank-pts" style={{ color: medal ?? "var(--green)" }}>{row.points}</div>
        <div className="rank-pts-unit">pts</div>
      </div>
    </div>
  );
}

function PodiumView({ rows }: { rows: Row[] }) {
  const top  = rows.slice(0, 3);
  const rest = rows.slice(3);
  // Order: 2nd, 1st, 3rd for visual podium
  const order = [top[1], top[0], top[2]].filter(Boolean) as Row[];
  const heights: Record<number, number> = { 1: 110, 2: 86, 3: 68 };

  return (
    <div>
      {/* Podium top 3 */}
      {top.length >= 3 && (
        <div className="podium-wrap">
          {order.map((p) => {
            const rank  = rows.indexOf(p) + 1;
            const color = MEDAL_COLOR[rank - 1] ?? "var(--ink)";
            return (
              <div key={p.id} className="podium-player">
                <div className="podium-nick">{p.name}</div>
                <div className="podium-pts" style={{ color }}>{p.points} pts</div>
                <div
                  className="podium-col"
                  style={{
                    height: heights[rank] ?? 68,
                    background: `linear-gradient(180deg,${color}30,${color}08)`,
                    border: `1px solid ${color}55`,
                  }}
                >
                  <span className="podium-rank" style={{ color }}>
                    {["🥇","🥈","🥉"][rank-1]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of the leaderboard */}
      {(top.length < 3 ? rows : rest).map((p, i) => (
        <RankRow key={p.id} row={p} rank={top.length < 3 ? i + 1 : i + 4} />
      ))}
    </div>
  );
}

export function LeaderboardClient({
  rows,
  centers,
  locale,
}: {
  rows: Row[];
  centers: { id: string; name: string }[];
  locale: Locale;
}) {
  const [tab, setTab] = useState<"global" | "center">("global");
  const [centerFilter, setCenterFilter] = useState<string>("all");

  const displayRows =
    tab === "center" && centerFilter !== "all"
      ? rows.filter((r) => {
          const centerName = centers.find((c) => c.id === centerFilter)?.name;
          return centerName ? r.center === centerName : false;
        })
      : rows;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Tabs ── */}
      <div className="lb-tabs">
        <button
          className={`lb-tab${tab === "global" ? " active" : ""}`}
          onClick={() => setTab("global")}
        >
          {t(locale, "leaderboard.global")}
        </button>
        <button
          className={`lb-tab${tab === "center" ? " active" : ""}`}
          onClick={() => setTab("center")}
        >
          {t(locale, "leaderboard.centers")}
        </button>
      </div>

      {/* ── Center filter chips ── */}
      {tab === "center" && (
        <div className="g-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
          <button
            className={`filter-chip${centerFilter === "all" ? " active" : ""}`}
            onClick={() => setCenterFilter("all")}
            style={centerFilter === "all" ? { background: "var(--green)", color: "#06210F" } : undefined}
          >
            All centers
          </button>
          {centers.map((c) => (
            <button
              key={c.id}
              className={`filter-chip${centerFilter === c.id ? " active" : ""}`}
              onClick={() => setCenterFilter(c.id)}
              style={centerFilter === c.id ? { background: "var(--green)", color: "#06210F" } : undefined}
            >
              {c.name.replace("GARRINCHA ", "")}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {displayRows.length === 0 ? (
        <div className="lb-empty" style={{ padding: "40px 20px" }}>
          <div className="lb-empty-icon">📊</div>
          <h3 className="disp" style={{ fontSize: 24, color: "var(--ink)", margin: "0 0 8px" }}>
            {t(locale, "leaderboard.noPlayers")}
          </h3>
          <p style={{ fontSize: 14, color: "var(--ink-dim)", margin: "0 0 20px", maxWidth: 320, lineHeight: 1.5 }}>
            {tab === "center"
              ? "No players in this center yet."
              : t(locale, "leaderboard.copy")}
          </p>
          <Link href="/register" className="cta cta-green cta-sm btn-auto">
            {t(locale, "cta_register")}
          </Link>
        </div>
      ) : (
        <PodiumView rows={displayRows} />
      )}

      {/* ── CTA strip ── */}
      {displayRows.length > 0 && (
        <div style={{ textAlign: "center", padding: "20px 0 8px", borderTop: "1px solid var(--line)", marginTop: 8 }}>
          <p style={{ fontSize: 14, color: "var(--ink-dim)", margin: "0 0 14px" }}>
            Want to climb the leaderboard?
          </p>
          <Link href="/register" className="cta cta-green cta-md btn-auto" style={{ display: "inline-flex" }}>
            {t(locale, "cta_register")}
          </Link>
        </div>
      )}
    </div>
  );
}
