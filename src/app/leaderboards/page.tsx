import Link from "next/link";
import { getLeaderboardWithMeta } from "@/lib/leaderboards";
import { hasDatabaseConfig } from "@/lib/app-mode";
import { demoLeaderboard } from "@/lib/ui-demo-data";
import { LeaderboardClient, type LbRow } from "@/components/LeaderboardClient";

export const metadata = {
  title: "World Cup 2026 Leaderboard — GARRINCHA",
  description: "Track the top players, points, predictions, and rankings. FIFA World Cup 2026 prediction campaign.",
};

// Reuse the same StatIcon shapes from matches page
function StatIcon({ type }: { type: "stadium" | "nations" | "groups" | "star" }) {
  const icons = {
    stadium: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 5v6a9 3 0 01-18 0V5"/><path d="M3 11v3a9 3 0 0018 0v-3"/>
      </svg>
    ),
    nations: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
    groups: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    star: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  };
  return icons[type];
}

export default async function LeaderboardsPage() {
  const hasDb = hasDatabaseConfig();

  const { rows: rawRows, total } = hasDb
    ? await getLeaderboardWithMeta().catch(() => ({ rows: [], total: 0, limited: false, limit: 200 }))
    : { rows: demoLeaderboard, total: demoLeaderboard.length };

  const rows: LbRow[] = (rawRows as {
    id: string; name: string; nationality: string; center: string; points: number; predictionCount?: number;
  }[]).map((r) => ({
    id: r.id,
    name: r.name ?? "Anonymous",
    nationality: r.nationality ?? "Unknown",
    center: r.center ?? "Center TBD",
    points: r.points ?? 0,
    predictionCount: r.predictionCount ?? 0,
  }));

  const stats = [
    { icon: "stadium" as const, value: "104",  label: "Matches" },
    { icon: "nations" as const, value: "48",   label: "Nations" },
    { icon: "groups"  as const, value: "12",   label: "Groups" },
    { icon: "star"    as const, value: "5 pts", label: "Exact score" },
  ];

  return (
    <div className="mc-page">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="mc-hero" aria-label="World Cup 2026 Leaderboard hero">
        <div className="mc-hero-bg" aria-hidden />
        <div className="mc-container">
          <div className="mc-hero-inner">

            {/* Left — text */}
            <div className="mc-hero-content">
              <span className="mc-eyebrow">FIFA WORLD CUP 2026</span>
              <h1 className="mc-hero-title">World Cup 2026 Leaderboard</h1>
              <p className="mc-hero-sub">Track the top players, points, predictions, and rankings.</p>
              <p className="mc-hero-date">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} aria-hidden>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Jun 11 – Jul 19, 2026
              </p>
            </div>

            {/* Right — trophy (same as matches) */}
            <div className="mc-hero-visual" aria-hidden>
              <div className="mc-trophy-glow" />
              <div className="mc-trophy-icon">
                <svg viewBox="0 0 120 160" width="120" height="160" className="mc-trophy-svg" aria-hidden>
                  <defs>
                    <linearGradient id="lbTrophyGold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F5C242"/><stop offset="50%" stopColor="#E0A92E"/><stop offset="100%" stopColor="#F5C242"/>
                    </linearGradient>
                    <filter id="lbGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  <ellipse cx="60" cy="28" rx="32" ry="10" fill="url(#lbTrophyGold)" filter="url(#lbGlow)" opacity="0.9"/>
                  <path d="M28 28 Q20 60 35 80 Q48 95 60 95 Q72 95 85 80 Q100 60 92 28Z" fill="url(#lbTrophyGold)" opacity="0.85"/>
                  <path d="M28 35 Q8 45 12 65 Q14 75 28 72" fill="none" stroke="url(#lbTrophyGold)" strokeWidth="6" strokeLinecap="round"/>
                  <path d="M92 35 Q112 45 108 65 Q106 75 92 72" fill="none" stroke="url(#lbTrophyGold)" strokeWidth="6" strokeLinecap="round"/>
                  <rect x="53" y="95" width="14" height="28" rx="3" fill="url(#lbTrophyGold)" opacity="0.8"/>
                  <rect x="38" y="120" width="44" height="10" rx="4" fill="url(#lbTrophyGold)" opacity="0.9"/>
                  <rect x="33" y="130" width="54" height="8" rx="4" fill="url(#lbTrophyGold)"/>
                  <circle cx="60" cy="58" r="16" fill="none" stroke="url(#lbTrophyGold)" strokeWidth="1.5" opacity="0.5"/>
                  <ellipse cx="60" cy="58" rx="16" ry="6" fill="none" stroke="url(#lbTrophyGold)" strokeWidth="1" opacity="0.4"/>
                  <line x1="60" y1="42" x2="60" y2="74" stroke="url(#lbTrophyGold)" strokeWidth="1" opacity="0.4"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mc-stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="mc-stat-card">
                <div className="mc-stat-icon"><StatIcon type={s.icon} /></div>
                <div>
                  <div className="mc-stat-value">{s.value}</div>
                  <div className="mc-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONTENT ══════════════════════════════════════════════════════════ */}
      <div className="mc-container">
        {/* Preview notice in demo mode */}
        {!hasDb && (
          <div className="preview-banner" style={{ margin: "20px 0 0" }}>
            <span>👁</span>
            <span className="preview-banner-text">
              Preview mode — sample standings. Real rankings appear once World Cup matches are scored.
            </span>
          </div>
        )}

        {rows.length > 0 ? (
          <LeaderboardClient rows={rows} total={total} />
        ) : (
          <div className="lb-body">
            <div className="lb-empty-state" style={{ marginTop: 28 }}>
              <div className="lb-empty-icon">🏆</div>
              <h3 className="lb-empty-title">Tournament not started yet</h3>
              <p className="lb-empty-sub">
                The FIFA World Cup 2026 kicks off on June 11. Register now, predict every match, and climb the leaderboard.
              </p>
              <Link href="/register" className="cta cta-green cta-md" style={{ display: "inline-flex", marginTop: 20 }}>
                Register for free
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
