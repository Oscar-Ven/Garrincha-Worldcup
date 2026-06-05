"use client";

import { useState } from "react";
import { type Locale, t } from "@/lib/translations";

type Row = { id: string; name: string; nationality: string; center: string; points: number };

const MEDAL = ["var(--gold)", "#666666", "#666666"];

function RankRow({ row, rank, highlight }: { row: Row; rank: number; highlight?: boolean }) {
  const medal = rank <= 3 ? MEDAL[rank - 1] : null;
  return (
    <div className="card rank-row" style={medal && highlight ? { borderColor: "#dddddd" } : undefined}>
      <span className="rank-num" style={{ color: medal ?? "var(--ink-faint)" }}>{rank}</span>
      <div className="rank-nick">
        <div className="rank-nick-name">{row.name}</div>
        <div className="rank-nick-meta">{row.center}</div>
      </div>
      <div className="rank-pts-wrap">
        <div className="rank-pts" style={{ color: medal ?? "var(--green)" }}>{row.points}</div>
        <div className="rank-pts-unit">pts</div>
      </div>
    </div>
  );
}

function PodiumBoard({ rows }: { rows: Row[]; locale?: Locale }) {
  const top = rows.slice(0, 3);
  const rest = rows.slice(3);
  const order = [top[1], top[0], top[2]].filter(Boolean) as Row[];
  const heights: Record<number, number> = { 1: 108, 2: 84, 3: 70 };

  return (
    <div>
      {top.length >= 3 && (
        <div className="podium-wrap">
          {order.map((p) => {
            const rank = rows.indexOf(p) + 1;
            const medal = MEDAL[rank - 1] ?? "var(--ink)";
            return (
              <div key={p.id} className="podium-player">
                <div className="podium-nick">{p.name}</div>
                <div className="podium-pts" style={{ color: medal }}>{p.points}</div>
                <div
                  className="podium-col"
                  style={{
                    height: heights[rank] ?? 70,
                    background: "#ffffff",
                    border: "1px solid #dddddd",
                  }}
                >
                  <span className="podium-rank" style={{ color: medal }}>{rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rest.map((p, i) => (
          <RankRow key={p.id} row={p} rank={i + 4} />
        ))}
      </div>
    </div>
  );
}

function EmptyBoard({ locale }: { locale: Locale }) {
  return (
    <div className="empty-state rise">
      <div className="empty-state-icon">📊</div>
      <h4 className="empty-state-title">{t(locale, "leaderboard.noPlayers")}</h4>
      <p className="empty-state-body">{t(locale, "leaderboard.copy")}</p>
    </div>
  );
}

export function LeaderboardTabs({
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

  const displayRows = tab === "center" && centerFilter !== "all"
    ? rows.filter((r) => r.center === centers.find((c) => c.id === centerFilter)?.name)
    : rows;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* tabs */}
      <div className="lb-tabs">
        <button className={`lb-tab${tab === "global" ? " active" : ""}`} onClick={() => setTab("global")}>
          {t(locale, "leaderboard.global")}
        </button>
        <button className={`lb-tab${tab === "center" ? " active" : ""}`} onClick={() => setTab("center")}>
          {t(locale, "leaderboard.centers")}
        </button>
      </div>

      {/* center filter chips */}
      {tab === "center" && (
        <div className="g-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
          <button className={`filter-chip${centerFilter === "all" ? " active" : ""}`} onClick={() => setCenterFilter("all")} style={centerFilter === "all" ? { background: "var(--green)", color: "#111111" } : undefined}>
            {t(locale, "leaderboard.centers")}
          </button>
          {centers.map((c) => (
            <button
              key={c.id}
              className={`filter-chip${centerFilter === c.id ? " active" : ""}`}
              onClick={() => setCenterFilter(c.id)}
              style={centerFilter === c.id ? { background: "var(--green)", color: "#111111" } : undefined}
            >
              {c.name.replace("GARRINCHA ", "")}
            </button>
          ))}
        </div>
      )}

      {displayRows.length === 0
        ? <EmptyBoard locale={locale} />
        : <PodiumBoard rows={displayRows} locale={locale} />
      }
    </div>
  );
}
