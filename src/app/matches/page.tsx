import Link from "next/link";
import Image from "next/image";
import { getAllMatches } from "@/lib/matches";
import { hasDatabaseConfig } from "@/lib/app-mode";
import { demoAllMatches } from "@/lib/ui-demo-data";
import { MatchesClient, type PublicMatch } from "@/components/MatchesClient";

export const metadata = {
  title: "World Cup 2026 Matches — GARRINCHA",
  description: "Full FIFA World Cup 2026 match schedule. Group stage, Round of 32, knockout rounds. Predict scores and climb the leaderboard.",
};

// ─── Tournament stat icons (inline SVG — no extra deps) ───────────────────────

function StatIcon({ type }: { type: "stadium" | "groups" | "nations" | "calendar" }) {
  const icons = {
    stadium: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 5v6a9 3 0 01-18 0V5"/><path d="M3 11v3a9 3 0 0018 0v-3"/>
      </svg>
    ),
    groups: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    nations: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
    calendar: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  };
  return icons[type];
}

export default async function MatchesPage() {
  const hasDb = hasDatabaseConfig();

  const rawMatches = hasDb
    ? await getAllMatches().catch(() => demoAllMatches)
    : demoAllMatches;

  const matches: PublicMatch[] = rawMatches.map((m) => ({
    id: m.id,
    stage: m.stage,
    fifaMatchNo: m.fifaMatchNo ?? null,
    venue: m.venue ?? "",
    kickoffAt: m.kickoffAt instanceof Date ? m.kickoffAt.toISOString() : String(m.kickoffAt),
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    homeTeam: {
      id: m.homeTeam.id,
      name: m.homeTeam.name ?? "TBD",
      fifaCode: m.homeTeam.fifaCode ?? null,
      flagUrl: m.homeTeam.flagUrl ?? null,
      groupName: m.homeTeam.groupName ?? null,
    },
    awayTeam: {
      id: m.awayTeam.id,
      name: m.awayTeam.name ?? "TBD",
      fifaCode: m.awayTeam.fifaCode ?? null,
      flagUrl: m.awayTeam.flagUrl ?? null,
      groupName: m.awayTeam.groupName ?? null,
    },
  }));

  const totalMatches = matches.length;
  const groupMatches = matches.filter((m) => m.stage === "GROUP").length;
  const knockoutMatches = totalMatches - groupMatches;

  const stats = [
    { icon: "stadium"  as const, value: String(totalMatches), label: "Total matches" },
    { icon: "groups"   as const, value: "12",                  label: "Groups" },
    { icon: "nations"  as const, value: "48",                  label: "Nations" },
    { icon: "calendar" as const, value: "40",                  label: "Days of football" },
  ];

  return (
    <div className="mc-page">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="mc-hero" aria-label="World Cup 2026 Matches hero">
        <div className="mc-hero-bg" aria-hidden />
        <div className="mc-container">
          <div className="mc-hero-inner">

            {/* Left — text content */}
            <div className="mc-hero-content">
              <span className="mc-eyebrow">FIFA WORLD CUP 2026</span>
              <h1 className="mc-hero-title">World Cup 2026 Matches</h1>
              <p className="mc-hero-sub">
                {totalMatches} matches · {groupMatches} group stage · {knockoutMatches} knockout
              </p>
              <p className="mc-hero-date">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} aria-hidden>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Jun 11 – Jul 19, 2026
              </p>
            </div>

            {/* Right — trophy visual */}
            <div className="mc-hero-visual" aria-hidden>
              <div className="mc-trophy-glow" />
              <div className="mc-trophy-icon">
                {/* World Cup trophy shape in CSS/SVG */}
                <svg viewBox="0 0 120 160" width="120" height="160" className="mc-trophy-svg" aria-hidden>
                  <defs>
                    <linearGradient id="trophyGold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F5C242"/>
                      <stop offset="50%" stopColor="#E0A92E"/>
                      <stop offset="100%" stopColor="#F5C242"/>
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  {/* Cup body */}
                  <ellipse cx="60" cy="28" rx="32" ry="10" fill="url(#trophyGold)" filter="url(#glow)" opacity="0.9"/>
                  <path d="M28 28 Q20 60 35 80 Q48 95 60 95 Q72 95 85 80 Q100 60 92 28Z" fill="url(#trophyGold)" opacity="0.85"/>
                  {/* Handles */}
                  <path d="M28 35 Q8 45 12 65 Q14 75 28 72" fill="none" stroke="url(#trophyGold)" strokeWidth="6" strokeLinecap="round"/>
                  <path d="M92 35 Q112 45 108 65 Q106 75 92 72" fill="none" stroke="url(#trophyGold)" strokeWidth="6" strokeLinecap="round"/>
                  {/* Stem */}
                  <rect x="53" y="95" width="14" height="28" rx="3" fill="url(#trophyGold)" opacity="0.8"/>
                  {/* Base */}
                  <rect x="38" y="120" width="44" height="10" rx="4" fill="url(#trophyGold)" opacity="0.9"/>
                  <rect x="33" y="130" width="54" height="8" rx="4" fill="url(#trophyGold)"/>
                  {/* Globe on cup */}
                  <circle cx="60" cy="58" r="16" fill="none" stroke="url(#trophyGold)" strokeWidth="1.5" opacity="0.5"/>
                  <ellipse cx="60" cy="58" rx="16" ry="6" fill="none" stroke="url(#trophyGold)" strokeWidth="1" opacity="0.4"/>
                  <line x1="60" y1="42" x2="60" y2="74" stroke="url(#trophyGold)" strokeWidth="1" opacity="0.4"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mc-stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="mc-stat-card">
                <div className="mc-stat-icon">
                  <StatIcon type={s.icon} />
                </div>
                <div className="mc-stat-value">{s.value}</div>
                <div className="mc-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ INTERACTIVE BODY (client) ════════════════════════════════════════ */}
      <div className="mc-container">
        <MatchesClient matches={matches} />
      </div>
    </div>
  );
}
