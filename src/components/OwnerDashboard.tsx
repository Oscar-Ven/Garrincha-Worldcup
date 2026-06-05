"use client";

import {
  Activity,
  AlertTriangle,
  Award,
  BarChart2,
  CalendarCheck,
  CheckCircle,
  Download,
  Gift,
  Globe,
  Heart,
  Link2,
  ListChecks,
  Save,
  Shield,
  Trash2,
  Trophy,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TeamFlag } from "@/components/Flag";
import { isPredictionLocked } from "@/lib/scoring";
import { type Locale, t } from "@/lib/translations";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PrizeCenterGroup = {
  centerId: string;
  centerName: string;
  players: Array<{ rank: number; id: string; name: string; points: number }>;
};

type Stats = {
  playerCount: number;
  adminCount: number;
  predictionCount: number;
  totalPointsAwarded: number;
  finalizedMatchCount: number;
  pendingMatchCount: number;
  bonusEventCount: number;
};

type OwnerUser = {
  id: string;
  email: string;
  displayName: string | null;
  nationality: string | null;
  role: string;
  center: { id: string; name: string };
  totalPoints: number;
  predictionCount: number;
  createdAt: string;
};

type OwnerMatch = {
  id: string;
  fifaMatchNo: number | null;
  stage: string;
  venue: string;
  kickoffAt: string;
  homeTeam: { name: string; fifaCode: string | null; flagUrl: string | null; groupName: string | null };
  awayTeam: { name: string; fifaCode: string | null; flagUrl: string | null; groupName: string | null };
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  predictionCount: number;
};

type CenterStat = {
  id: string;
  name: string;
  city: string;
  country: string;
  playerCount: number;
  predictionCount: number;
  totalPoints: number;
  topPlayer: string | null;
};

type BonusEvent = {
  id: string;
  points: number;
  reason: string;
  awardedBy: string | null;
  createdAt: string;
  user: { email: string; displayName: string | null };
};

type LeaderboardEntry = {
  id: string;
  name: string;
  center: string;
  nationality: string | null;
  points: number;
  predictionCount: number;
  rank: number;
};

export type HealthCheck = {
  label: string;
  status: "healthy" | "warning" | "error" | "unconfigured";
  detail?: string;
};

type Tab = "overview" | "health" | "scores" | "players" | "centers" | "bonus" | "leaderboard" | "prizes";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiPost(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
}

async function apiPatch(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
}

async function apiDelete(url: string) {
  const res = await fetch(url, { method: "DELETE" });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
}

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const lines = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function fmt(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" }).format(new Date(iso));
}

const STAGE_LABELS: Record<string, string> = {
  GROUP: "Group",
  ROUND_OF_32: "R32",
  ROUND_OF_16: "R16",
  QUARTER_FINAL: "QF",
  SEMI_FINAL: "SF",
  THIRD_PLACE: "3rd",
  FINAL: "Final",
};

// ─── Inline style helpers ─────────────────────────────────────────────────────

const S = {
  // Page shell
  page: {
    background: "#F8FAFB",
    minHeight: "100vh",
  } as React.CSSProperties,

  // Header strip
  header: {
    background: "#FFFFFF",
    borderBottom: "1px solid #E5E7EB",
    padding: "1.25rem 1.5rem",
  } as React.CSSProperties,

  headerInner: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
  } as React.CSSProperties,

  titleText: {
    fontFamily: "'Saira Condensed', sans-serif",
    fontStyle: "italic" as const,
    fontWeight: 800,
    fontSize: "1.4rem",
    color: "#1B4332",
    lineHeight: 1.1,
  } as React.CSSProperties,

  subtitle: {
    fontSize: "0.8rem",
    color: "#6B7280",
    marginTop: "0.25rem",
  } as React.CSSProperties,

  quickStats: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  quickStat: {
    fontSize: "0.82rem",
    color: "#374151",
    background: "#F3F4F6",
    padding: "0.3rem 0.75rem",
    borderRadius: 9999,
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
  } as React.CSSProperties,

  // Tab nav
  tabs: {
    background: "#FFFFFF",
    borderBottom: "1px solid #E5E7EB",
    display: "flex",
    overflowX: "auto" as const,
    padding: "0 1rem",
    gap: "0",
  } as React.CSSProperties,

  tab: (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.75rem 1rem",
    fontSize: "0.85rem",
    fontWeight: active ? 600 : 500,
    color: active ? "#1B4332" : "#6B7280",
    borderBottom: active ? "2px solid #1B4332" : "2px solid transparent",
    marginBottom: -1,
    cursor: "pointer",
    background: "none",
    border: "none",
    borderBottomStyle: "solid",
    borderBottomWidth: 2,
    borderBottomColor: active ? "#1B4332" : "transparent",
    whiteSpace: "nowrap" as const,
    transition: "color 0.12s, border-color 0.12s",
  }),

  // Content area
  content: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "1.5rem",
  } as React.CSSProperties,

  // Section wrapper
  section: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.25rem",
  } as React.CSSProperties,

  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  sectionTitle: {
    fontFamily: "'Saira Condensed', sans-serif",
    fontStyle: "italic" as const,
    fontWeight: 800,
    fontSize: "1.3rem",
    color: "#1B4332",
    margin: 0,
  } as React.CSSProperties,

  sectionSubtitle: {
    fontFamily: "'Saira Condensed', sans-serif",
    fontStyle: "italic" as const,
    fontWeight: 700,
    fontSize: "1rem",
    color: "#374151",
    margin: "0 0 0.75rem",
  } as React.CSSProperties,

  controls: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  // White card
  card: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: "1.25rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  } as React.CSSProperties,

  // Stats grid
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
    gap: "0.875rem",
  } as React.CSSProperties,

  statCard: (accent?: "green" | "gold" | "red" | "amber"): React.CSSProperties => {
    const borders: Record<string, string> = {
      green: "#16A34A",
      gold: "#D97706",
      red: "#DC2626",
      amber: "#F59E0B",
    };
    const bgs: Record<string, string> = {
      green: "#F0FDF4",
      gold: "#FFFBEB",
      red: "#FEF2F2",
      amber: "#FFFBEB",
    };
    return {
      background: accent ? bgs[accent] : "#FFFFFF",
      border: `1px solid ${accent ? borders[accent] + "40" : "#E5E7EB"}`,
      borderTop: `3px solid ${accent ? borders[accent] : "#E5E7EB"}`,
      borderRadius: 10,
      padding: "1rem 1.125rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.375rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    };
  },

  statValue: {
    fontFamily: "'Saira Condensed', sans-serif",
    fontStyle: "italic" as const,
    fontWeight: 900,
    fontSize: "2rem",
    color: "#1B4332",
    lineHeight: 1,
  } as React.CSSProperties,

  statLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#6B7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  } as React.CSSProperties,

  // Health card
  healthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "0.75rem",
  } as React.CSSProperties,

  healthCard: (status: string): React.CSSProperties => {
    const cfg: Record<string, { bg: string; border: string }> = {
      healthy:      { bg: "#F0FDF4", border: "#BBF7D0" },
      warning:      { bg: "#FFFBEB", border: "#FDE68A" },
      error:        { bg: "#FEF2F2", border: "#FECACA" },
      unconfigured: { bg: "#F9FAFB", border: "#E5E7EB" },
    };
    const c = cfg[status] ?? cfg.unconfigured;
    return {
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: "0.875rem 1rem",
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
    };
  },

  healthDot: (status: string): React.CSSProperties => {
    const colors: Record<string, string> = {
      healthy:      "#16A34A",
      warning:      "#D97706",
      error:        "#DC2626",
      unconfigured: "#9CA3AF",
    };
    return {
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: colors[status] ?? "#9CA3AF",
      flexShrink: 0,
      marginTop: 4,
    };
  },

  healthLabel: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#111827",
    lineHeight: 1.3,
  } as React.CSSProperties,

  healthDetail: {
    fontSize: "0.76rem",
    color: "#6B7280",
    marginTop: 2,
  } as React.CSSProperties,

  healthPill: (status: string): React.CSSProperties => {
    const cfg: Record<string, { bg: string; color: string }> = {
      healthy:      { bg: "#DCFCE7", color: "#15803D" },
      warning:      { bg: "#FEF3C7", color: "#92400E" },
      error:        { bg: "#FEE2E2", color: "#B91C1C" },
      unconfigured: { bg: "#F3F4F6", color: "#6B7280" },
    };
    const c = cfg[status] ?? cfg.unconfigured;
    return {
      display: "inline-block",
      padding: "0.15rem 0.5rem",
      borderRadius: 9999,
      fontSize: "0.68rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase" as const,
      background: c.bg,
      color: c.color,
      flexShrink: 0,
      marginTop: 2,
    };
  },

  // Badges
  badge: (variant: "green" | "gold" | "red" | "blue" | "gray" | "dark"): React.CSSProperties => {
    const cfg: Record<string, { bg: string; color: string }> = {
      green: { bg: "#DCFCE7", color: "#15803D" },
      gold:  { bg: "#FEF3C7", color: "#92400E" },
      red:   { bg: "#FEE2E2", color: "#B91C1C" },
      blue:  { bg: "#EFF6FF", color: "#2563EB" },
      gray:  { bg: "#F3F4F6", color: "#6B7280" },
      dark:  { bg: "#1B4332", color: "#FFFFFF" },
    };
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "0.2rem 0.6rem",
      borderRadius: 9999,
      fontSize: "0.72rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase" as const,
      whiteSpace: "nowrap" as const,
      background: cfg[variant].bg,
      color: cfg[variant].color,
    };
  },

  lockedBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.2rem 0.6rem",
    borderRadius: 9999,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    background: "#FEF3C7",
    color: "#92400E",
  } as React.CSSProperties,

  // Table
  tableWrap: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    overflowX: "auto" as const,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.875rem",
  } as React.CSSProperties,

  th: {
    padding: "0.625rem 0.875rem",
    textAlign: "left" as const,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    color: "#6B7280",
    background: "#F9FAFB",
    borderBottom: "1px solid #E5E7EB",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  td: {
    padding: "0.625rem 0.875rem",
    borderBottom: "1px solid #F3F4F6",
    color: "#111827",
    verticalAlign: "middle" as const,
  } as React.CSSProperties,

  muted: {
    color: "#9CA3AF",
    fontSize: "0.78rem",
  } as React.CSSProperties,

  greenText: {
    color: "#16A34A",
    fontWeight: 700,
  } as React.CSSProperties,

  // Search / select inputs
  searchInput: {
    padding: "0.45rem 0.75rem",
    border: "1.5px solid #D1D5DB",
    borderRadius: 8,
    fontSize: "0.85rem",
    color: "#111827",
    background: "#FFFFFF",
    outline: "none",
    minWidth: 180,
  } as React.CSSProperties,

  select: {
    padding: "0.45rem 0.75rem",
    border: "1.5px solid #D1D5DB",
    borderRadius: 8,
    fontSize: "0.85rem",
    color: "#111827",
    background: "#FFFFFF",
    outline: "none",
    cursor: "pointer",
  } as React.CSSProperties,

  // Buttons
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.5rem 1rem",
    background: "#1B4332",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.5rem 1rem",
    background: "#FFFFFF",
    color: "#374151",
    border: "1.5px solid #D1D5DB",
    borderRadius: 8,
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  btnDanger: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    padding: "0.35rem 0.625rem",
    background: "#FEF2F2",
    color: "#B91C1C",
    border: "1px solid #FECACA",
    borderRadius: 6,
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,

  // Toggle bar
  toggleBar: {
    display: "flex",
    background: "#F3F4F6",
    borderRadius: 8,
    padding: 3,
    gap: 2,
  } as React.CSSProperties,

  toggleBtn: (active: boolean): React.CSSProperties => ({
    padding: "0.35rem 0.75rem",
    borderRadius: 6,
    border: "none",
    fontSize: "0.8rem",
    fontWeight: active ? 600 : 500,
    background: active ? "#FFFFFF" : "transparent",
    color: active ? "#1B4332" : "#6B7280",
    cursor: "pointer",
    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
    whiteSpace: "nowrap" as const,
  }),

  // Score row
  scoreRow: (scored: boolean, locked: boolean): React.CSSProperties => ({
    background: scored ? "#F9FAFB" : locked ? "#FFFBEB" : "#FFFFFF",
    border: `1px solid ${scored ? "#E5E7EB" : locked ? "#FDE68A" : "#E5E7EB"}`,
    borderRadius: 10,
    padding: "0.875rem 1rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.625rem",
  }),

  scoreMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  scoreTeams: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  scoreTeam: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flex: 1,
    minWidth: 120,
  } as React.CSSProperties,

  scoreInputWrap: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    flexShrink: 0,
  } as React.CSSProperties,

  scoreInput: {
    width: 52,
    padding: "0.4rem 0.25rem",
    textAlign: "center" as const,
    fontSize: "1.1rem",
    fontWeight: 700,
    background: "#FFFFFF",
    border: "2px solid #D1D5DB",
    borderRadius: 6,
    color: "#1B4332",
    outline: "none",
  } as React.CSSProperties,

  scoreDash: {
    fontWeight: 700,
    color: "#9CA3AF",
    fontSize: "1rem",
  } as React.CSSProperties,

  // Centers grid
  centersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "1rem",
  } as React.CSSProperties,

  centerCard: (leader: boolean): React.CSSProperties => ({
    background: leader ? "#FFFBEB" : "#FFFFFF",
    border: `1px solid ${leader ? "#FDE68A" : "#E5E7EB"}`,
    borderTop: `3px solid ${leader ? "#D97706" : "#E5E7EB"}`,
    borderRadius: 10,
    padding: "1.125rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  }),

  centerStatsRow: {
    display: "flex",
    gap: "1rem",
    marginTop: "0.25rem",
  } as React.CSSProperties,

  centerStat: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
    fontSize: "0.8rem",
  } as React.CSSProperties,

  // Prizes
  prizesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem",
  } as React.CSSProperties,

  // Highlight
  highlightRow: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  highlightCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    borderRadius: 10,
    padding: "0.875rem 1.25rem",
    flex: 1,
    minWidth: 220,
  } as React.CSSProperties,

  // Empty state
  emptyState: {
    textAlign: "center" as const,
    padding: "2.5rem 1rem",
    color: "#9CA3AF",
    fontSize: "0.9rem",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
  } as React.CSSProperties,

  // Error banner
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 8,
    color: "#B91C1C",
    fontSize: "0.875rem",
    fontWeight: 500,
  } as React.CSSProperties,

  // Form
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.875rem",
  } as React.CSSProperties,

  fieldLabel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.3rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#374151",
  } as React.CSSProperties,

  fieldInput: {
    padding: "0.5rem 0.75rem",
    border: "1.5px solid #D1D5DB",
    borderRadius: 8,
    fontSize: "0.9rem",
    color: "#111827",
    background: "#FFFFFF",
    outline: "none",
  } as React.CSSProperties,

  // Quick links grid
  quickLinksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "0.75rem",
  } as React.CSSProperties,

  quickLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    padding: "0.875rem 1rem",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#1B4332",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.12s, box-shadow 0.12s",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  } as React.CSSProperties,

  // Health summary bar
  healthSummary: {
    display: "flex",
    gap: "0.875rem",
    flexWrap: "wrap" as const,
    padding: "0.875rem 1.125rem",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    alignItems: "center",
  } as React.CSSProperties,
};

// ─── Main component ───────────────────────────────────────────────────────────

export function OwnerDashboard({
  ownerId, ownerEmail, stats, users, matches, centerStats, bonusEvents, leaderboard, prizeWinners, locale, healthChecks,
}: {
  ownerId: string;
  ownerEmail: string;
  stats: Stats;
  users: OwnerUser[];
  matches: OwnerMatch[];
  centerStats: CenterStat[];
  bonusEvents: BonusEvent[];
  leaderboard: LeaderboardEntry[];
  prizeWinners: PrizeCenterGroup[];
  locale: Locale;
  healthChecks?: HealthCheck[];
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview",    label: "Overview",      icon: <BarChart2 size={14} /> },
    { id: "health",      label: "System Health", icon: <Activity size={14} /> },
    { id: "scores",      label: "Final Scores",  icon: <CalendarCheck size={14} /> },
    { id: "players",     label: "Players",       icon: <Users size={14} /> },
    { id: "centers",     label: "Centers",       icon: <Globe size={14} /> },
    { id: "bonus",       label: "Bonus Points",  icon: <Gift size={14} /> },
    { id: "leaderboard", label: "Leaderboard",   icon: <Trophy size={14} /> },
    { id: "prizes",      label: "Prize Winners", icon: <Award size={14} /> },
  ];

  return (
    <div style={S.page} className="owner-page">
      {/* Header */}
      <div style={S.header} className="owner-header">
        <div style={S.headerInner} className="owner-header-inner">
          <div>
            <div style={S.titleRow}>
              <Shield size={18} color="#1B4332" aria-hidden />
              <span style={S.titleText}>GARRINCHA Owner Dashboard</span>
            </div>
            <div style={S.subtitle}>{ownerEmail} &middot; Owner &middot; Full Authority</div>
          </div>
          <div style={S.quickStats}>
            <span style={S.quickStat}><strong>{stats.playerCount}</strong> players</span>
            <span style={S.quickStat}><strong>{stats.finalizedMatchCount}</strong> scored</span>
            <span style={{ ...S.quickStat, background: stats.pendingMatchCount > 0 ? "#FEF3C7" : "#F3F4F6", color: stats.pendingMatchCount > 0 ? "#92400E" : "#374151" }}>
              <strong>{stats.pendingMatchCount}</strong> pending
            </span>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <nav style={S.tabs} role="tablist" className="owner-tabs" aria-label="Owner dashboard tabs">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            style={S.tab(tab === id)}
            className={`owner-tab${tab === id ? " active" : ""}`}
            onClick={() => setTab(id)}
          >
            {icon} {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div style={S.content} className="owner-content">
        {tab === "overview"    && <OverviewTab stats={stats} matches={matches} users={users} bonusEvents={bonusEvents} centerStats={centerStats} />}
        {tab === "health"      && <HealthTab healthChecks={healthChecks ?? []} />}
        {tab === "scores"      && <ScoresTab matches={matches} locale={locale} />}
        {tab === "players"     && <PlayersTab users={users} ownerId={ownerId} />}
        {tab === "centers"     && <CentersTab centerStats={centerStats} />}
        {tab === "bonus"       && <BonusTab users={users.filter((u) => u.role === "USER")} bonusEvents={bonusEvents} />}
        {tab === "leaderboard" && <LeaderboardTab leaderboard={leaderboard} />}
        {tab === "prizes"      && <PrizesTab prizeWinners={prizeWinners} />}
      </div>
    </div>
  );
}

// ─── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({
  stats, matches, users, bonusEvents, centerStats,
}: {
  stats: Stats;
  matches: OwnerMatch[];
  users: OwnerUser[];
  bonusEvents: BonusEvent[];
  centerStats: CenterStat[];
}) {
  const now = new Date();
  const topUser = users.filter((u) => u.role === "USER").sort((a, b) => b.totalPoints - a.totalPoints)[0];
  const needsScore = matches.filter((m) => m.status !== "FINAL" && isPredictionLocked(new Date(m.kickoffAt), now)).length;
  const topCenter = [...centerStats].sort((a, b) => b.totalPoints - a.totalPoints)[0];

  const overviewStats: Array<{ label: string; value: number | string; accent?: "green" | "gold" | "red" | "amber"; icon: React.ReactNode }> = [
    { label: "Registered Players", value: stats.playerCount, accent: "green", icon: <Users size={18} color="#16A34A" /> },
    { label: "Centers Active", value: centerStats.length, icon: <Globe size={18} color="#6B7280" /> },
    { label: "Matches Total", value: matches.length, icon: <CalendarCheck size={18} color="#6B7280" /> },
    { label: "Predictions Submitted", value: stats.predictionCount, icon: <ListChecks size={18} color="#6B7280" /> },
    { label: "Bonus Events", value: stats.bonusEventCount, icon: <Gift size={18} color="#6B7280" /> },
    { label: "Total Points Awarded", value: stats.totalPointsAwarded, accent: "gold", icon: <Award size={18} color="#D97706" /> },
    { label: "Matches Scored", value: stats.finalizedMatchCount, accent: "green", icon: <CheckCircle size={18} color="#16A34A" /> },
    { label: "Matches Pending", value: stats.pendingMatchCount, accent: stats.pendingMatchCount > 0 ? "amber" : undefined, icon: <XCircle size={18} color={stats.pendingMatchCount > 0 ? "#F59E0B" : "#6B7280"} /> },
    ...(needsScore > 0 ? [{ label: "Played — Needs Score", value: needsScore, accent: "red" as const, icon: <AlertTriangle size={18} color="#DC2626" /> }] : []),
  ];

  return (
    <div style={S.section} className="owner-section">
      <h2 style={S.sectionTitle}>Campaign Overview</h2>

      {/* Stats grid */}
      <div style={S.statsGrid} className="owner-stats-grid">
        {overviewStats.map((s) => (
          <div key={s.label} style={S.statCard(s.accent)} className="owner-stat-card">
            {s.icon}
            <div style={S.statValue}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Highlight row */}
      {(topUser || topCenter) && (
        <div style={S.highlightRow}>
          {topUser && (
            <div style={S.highlightCard}>
              <Trophy size={20} color="#D97706" />
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6B7280", marginBottom: 2 }}>Current Leader</div>
                <div style={{ fontWeight: 700, color: "#111827" }}>{topUser.displayName ?? topUser.email}</div>
                <div style={S.muted}>{topUser.center.name} &middot; {topUser.totalPoints} pts</div>
              </div>
            </div>
          )}
          {topCenter && (
            <div style={S.highlightCard}>
              <Globe size={20} color="#16A34A" />
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6B7280", marginBottom: 2 }}>Leading Center</div>
                <div style={{ fontWeight: 700, color: "#111827" }}>{topCenter.name}</div>
                <div style={S.muted}>{topCenter.city}, {topCenter.country} &middot; {topCenter.totalPoints} pts</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent bonus activity */}
      {bonusEvents.length > 0 && (
        <>
          <h3 style={S.sectionSubtitle}>Recent Bonus Activity</h3>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Player", "Points", "Reason", "By", "When"].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bonusEvents.slice(0, 8).map((e) => (
                  <tr key={e.id}>
                    <td style={S.td}>{e.user.displayName ?? e.user.email}</td>
                    <td style={S.td}>
                      <span style={S.badge(e.points > 0 ? "gold" : "red")}>{e.points > 0 ? "+" : ""}{e.points}</span>
                    </td>
                    <td style={S.td}>{e.reason}</td>
                    <td style={{ ...S.td, ...S.muted }}>{e.awardedBy ?? "—"}</td>
                    <td style={{ ...S.td, ...S.muted }}>{fmt(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Quick links */}
      <h3 style={S.sectionSubtitle}>Owner Operations</h3>
      <div style={S.quickLinksGrid}>
        {[
          { href: "/owner", label: "Owner Dashboard", icon: <Shield size={16} /> },
          { href: "/admin", label: "Admin Panel", icon: <Zap size={16} /> },
          { href: "/leaderboards", label: "View Leaderboard", icon: <Trophy size={16} /> },
          { href: "/matches", label: "Match Schedule", icon: <CalendarCheck size={16} /> },
          { href: "/api/admin/health", label: "Health API", icon: <Heart size={16} /> },
          { href: "/api/admin/leaderboard/recalculate", label: "Recalculate Scores", icon: <Activity size={16} /> },
        ].map(({ href, label, icon }) => (
          <a key={href} href={href} style={S.quickLink} className="owner-quick-link">
            <span style={{ color: "#1B4332", flexShrink: 0 }}>{icon}</span>
            {label}
            <Link2 size={13} color="#9CA3AF" style={{ marginLeft: "auto" }} />
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: System Health ───────────────────────────────────────────────────────

const HEALTH_GROUPS: { label: string; keys: string[] }[] = [
  { label: "Application", keys: ["Next.js Environment", "Preview/Demo Mode", "App URL"] },
  { label: "Database", keys: ["Database Connection", "Centers seeded", "Matches seeded", "Owner account", "Center admins", "Players registered", "Predictions submitted"] },
  { label: "Email", keys: ["RESEND_API_KEY", "EMAIL_FROM", "Email domain"] },
  { label: "Rate Limiting", keys: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "Rate limiter mode"] },
  { label: "Hosting", keys: ["Main app host", "Environment", "Deploy URL", "Render worker"] },
  { label: "Monitoring", keys: ["Sentry DSN"] },
  { label: "Football API", keys: ["Football API Key", "Provider"] },
  { label: "Security", keys: ["JWT Secret", "Owner password", "Admin password", "Center admin password", "Security headers", "Same-origin CSRF protection"] },
];

function HealthTab({ healthChecks }: { healthChecks: HealthCheck[] }) {
  const statusOrder = { error: 0, warning: 1, unconfigured: 2, healthy: 3 };
  const counts = {
    healthy:      healthChecks.filter((c) => c.status === "healthy").length,
    warning:      healthChecks.filter((c) => c.status === "warning").length,
    error:        healthChecks.filter((c) => c.status === "error").length,
    unconfigured: healthChecks.filter((c) => c.status === "unconfigured").length,
  };

  const byLabel = Object.fromEntries(healthChecks.map((c) => [c.label, c]));

  const pillLabel: Record<string, string> = {
    healthy: "Healthy",
    warning: "Warning",
    error: "Error",
    unconfigured: "Not Set",
  };

  return (
    <div style={S.section} className="owner-section">
      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>System Health Check</h2>
        <span style={S.muted}>
          {healthChecks.length} checks &middot; {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Summary bar */}
      <div style={S.healthSummary} className="health-summary">
        {[
          { status: "healthy",      count: counts.healthy,      label: "Healthy",      color: "#16A34A" },
          { status: "warning",      count: counts.warning,      label: "Warnings",     color: "#D97706" },
          { status: "error",        count: counts.error,        label: "Errors",       color: "#DC2626" },
          { status: "unconfigured", count: counts.unconfigured, label: "Not Configured", color: "#9CA3AF" },
        ].map(({ status, count, label, color }) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontWeight: 700, color: "#111827", fontSize: "0.9rem" }}>{count}</span>
            <span style={{ color: "#6B7280", fontSize: "0.82rem" }}>{label}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto" }}>
          {counts.error > 0 && <span style={S.badge("red")}>{counts.error} error{counts.error > 1 ? "s" : ""}</span>}
          {counts.error === 0 && counts.warning > 0 && <span style={S.badge("gold")}>{counts.warning} warning{counts.warning > 1 ? "s" : ""}</span>}
          {counts.error === 0 && counts.warning === 0 && <span style={S.badge("green")}>All systems nominal</span>}
        </div>
      </div>

      {/* Grouped check cards */}
      {HEALTH_GROUPS.map(({ label, keys }) => {
        const checks = keys
          .map((k) => byLabel[k])
          .filter(Boolean)
          .sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));

        if (checks.length === 0) return null;

        return (
          <div key={label}>
            <h3 style={{ ...S.sectionSubtitle, marginBottom: "0.625rem" }}>{label}</h3>
            <div style={S.healthGrid} className="health-grid">
              {checks.map((check) => (
                <div key={check.label} style={S.healthCard(check.status)} className={`health-card health-card--${check.status}`}>
                  <span style={S.healthDot(check.status)} className="health-dot" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.healthLabel}>{check.label}</div>
                    {check.detail && <div style={S.healthDetail}>{check.detail}</div>}
                  </div>
                  <span style={S.healthPill(check.status)} className={`health-status health-status--${check.status}`}>
                    {pillLabel[check.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Ungrouped checks (anything not in the groups above) */}
      {(() => {
        const allGroupedKeys = new Set(HEALTH_GROUPS.flatMap((g) => g.keys));
        const ungrouped = healthChecks.filter((c) => !allGroupedKeys.has(c.label));
        if (ungrouped.length === 0) return null;
        return (
          <div>
            <h3 style={{ ...S.sectionSubtitle, marginBottom: "0.625rem" }}>Other</h3>
            <div style={S.healthGrid}>
              {ungrouped.map((check) => (
                <div key={check.label} style={S.healthCard(check.status)} className={`health-card health-card--${check.status}`}>
                  <span style={S.healthDot(check.status)} className="health-dot" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.healthLabel}>{check.label}</div>
                    {check.detail && <div style={S.healthDetail}>{check.detail}</div>}
                  </div>
                  <span style={S.healthPill(check.status)} className={`health-status health-status--${check.status}`}>
                    {pillLabel[check.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {healthChecks.length === 0 && (
        <div style={S.emptyState}>No health data available. Health checks require a live database connection.</div>
      )}
    </div>
  );
}

// ─── Tab: Scores ─────────────────────────────────────────────────────────────

function ScoresTab({ matches, locale }: { matches: OwnerMatch[]; locale: Locale }) {
  const now = new Date();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [search, setSearch] = useState("");

  const visible = matches.filter((m) => {
    const matchesSearch =
      search === "" ||
      m.homeTeam.name.toLowerCase().includes(search.toLowerCase()) ||
      m.awayTeam.name.toLowerCase().includes(search.toLowerCase()) ||
      String(m.fifaMatchNo).includes(search);
    const matchesFilter = filter === "all" || m.status !== "FINAL";
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={S.section} className="owner-section">
      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>Final Scores</h2>
        <div style={S.controls}>
          <input
            style={S.searchInput}
            placeholder="Search team or match #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search matches"
          />
          <div style={S.toggleBar}>
            <button
              style={S.toggleBtn(filter === "pending")}
              onClick={() => setFilter("pending")}
            >
              Needs score ({matches.filter((m) => m.status !== "FINAL").length})
            </button>
            <button
              style={S.toggleBtn(filter === "all")}
              onClick={() => setFilter("all")}
            >
              All ({matches.length})
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {visible.length === 0 && <div style={S.emptyState}>No matches found.</div>}
        {visible.map((match) => (
          <ScoreRow key={match.id} match={match} now={now} locale={locale} />
        ))}
      </div>
    </div>
  );
}

function ScoreRow({ match, now, locale }: { match: OwnerMatch; now: Date; locale: Locale }) {
  const router = useRouter();
  const [home, setHome] = useState(match.homeScore !== null ? String(match.homeScore) : "");
  const [away, setAway] = useState(match.awayScore !== null ? String(match.awayScore) : "");
  const [saveStatus, setSaveStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const isScored = match.status === "FINAL";
  const isLocked = isPredictionLocked(new Date(match.kickoffAt), now);
  const stageLabel =
    match.stage === "GROUP"
      ? `Group ${match.homeTeam.groupName ?? ""}`
      : (STAGE_LABELS[match.stage] ?? match.stage);

  async function save() {
    if (home === "" || away === "") return;
    setSaving(true); setSaveStatus(null);
    try {
      await apiPost(`/api/admin/matches/${match.id}/score`, { homeScore: Number(home), awayScore: Number(away) });
      setSaveStatus({ ok: true, msg: "Saved" });
      router.refresh();
    } catch (err) {
      setSaveStatus({ ok: false, msg: err instanceof Error ? err.message : "Error" });
    } finally { setSaving(false); }
  }

  return (
    <div style={S.scoreRow(isScored, isLocked)} className="owner-score-row">
      <div style={S.scoreMeta}>
        <span style={isScored ? S.badge("green") : isLocked ? S.lockedBadge : S.badge("gray")}>
          {isScored ? "Scored" : isLocked ? "Needs score" : "Upcoming"}
        </span>
        <span style={S.badge("dark")}>{stageLabel}</span>
        <span style={S.muted}>#{match.fifaMatchNo} &middot; {fmt(match.kickoffAt)}</span>
        <span style={S.muted}>{match.predictionCount} predictions</span>
      </div>
      <div style={S.scoreTeams}>
        <div style={S.scoreTeam}>
          <TeamFlag team={match.homeTeam} size="sm" />
          <strong style={{ fontSize: "0.9rem" }}>{match.homeTeam.name}</strong>
        </div>
        <div style={S.scoreInputWrap}>
          <input
            style={S.scoreInput}
            type="number" min={0} max={30}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            aria-label="Home score"
          />
          <span style={S.scoreDash}>–</span>
          <input
            style={S.scoreInput}
            type="number" min={0} max={30}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            aria-label="Away score"
          />
          <button
            style={{ ...S.btnPrimary, background: isScored ? "#374151" : "#1B4332", opacity: saving || home === "" || away === "" ? 0.5 : 1 }}
            onClick={save}
            disabled={saving || home === "" || away === ""}
          >
            <Save size={13} />
            {saving ? "Saving…" : isScored ? "Update" : t(locale, "admin.saveScore")}
          </button>
          {saveStatus && (
            <span style={{ fontSize: "0.8rem", color: saveStatus.ok ? "#16A34A" : "#DC2626", fontWeight: 500 }}>
              {saveStatus.ok ? "Saved" : saveStatus.msg}
            </span>
          )}
        </div>
        <div style={{ ...S.scoreTeam, justifyContent: "flex-end", flexDirection: "row-reverse" as const }}>
          <TeamFlag team={match.awayTeam} size="sm" />
          <strong style={{ fontSize: "0.9rem" }}>{match.awayTeam.name}</strong>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Players ─────────────────────────────────────────────────────────────

function PlayersTab({ users, ownerId }: { users: OwnerUser[]; ownerId: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "USER" | "ADMIN" | "SUPER_ADMIN">("all");
  const [centerFilter, setCenterFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [roleStatus, setRoleStatus] = useState<Record<string, string>>({});

  const centers = Array.from(new Set(users.map((u) => u.center.name))).sort();

  const visible = users.filter((u) => {
    const matchesSearch =
      search === "" ||
      (u.displayName ?? u.email).toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesCenter = centerFilter === "all" || u.center.name === centerFilter;
    return matchesSearch && matchesRole && matchesCenter;
  });

  async function changeRole(userId: string, role: string) {
    try {
      await apiPatch(`/api/admin/users/${userId}/role`, { role });
      setRoleStatus((prev) => ({ ...prev, [userId]: "Updated" }));
      router.refresh();
    } catch (err) {
      setRoleStatus((prev) => ({ ...prev, [userId]: err instanceof Error ? err.message : "Error" }));
    }
  }

  async function deleteUser(userId: string, name: string) {
    const confirmed = window.confirm(`Delete "${name}"? This removes all their predictions and points. This cannot be undone.`);
    if (!confirmed) return;
    setDeleting(userId);
    setDeleteError(null);
    try {
      await apiDelete(`/api/admin/users/${userId}`);
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete user.");
    } finally { setDeleting(null); }
  }

  function exportCSV() {
    downloadCSV(
      "garrincha-players.csv",
      visible.map((u) => [u.displayName ?? "", u.email, u.role, u.center.name, u.nationality ?? "", String(u.totalPoints), String(u.predictionCount), u.createdAt]),
      ["Display Name", "Email", "Role", "Center", "Nationality", "Points", "Predictions", "Registered"],
    );
  }

  return (
    <div style={S.section} className="owner-section">
      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>
          Players{" "}
          <span style={{ fontWeight: 400, color: "#9CA3AF", fontSize: "1rem" }}>({visible.length} shown)</span>
        </h2>
        <div style={S.controls}>
          <input style={S.searchInput} placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={S.select} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}>
            <option value="all">All roles</option>
            <option value="USER">Players</option>
            <option value="ADMIN">Admins</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <select style={S.select} value={centerFilter} onChange={(e) => setCenterFilter(e.target.value)}>
            <option value="all">All centers</option>
            {centers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button style={S.btnSecondary} onClick={exportCSV}><Download size={14} /> Export CSV</button>
        </div>
      </div>

      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              {["Player", "Center", "Nationality", "Points", "Predictions", "Role", "Action"].map((h) => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={S.td}>
                  <strong style={{ display: "block" }}>{user.displayName ?? user.email}</strong>
                  <span style={S.muted}>{user.email}</span>
                </td>
                <td style={S.td}>{user.center.name}</td>
                <td style={S.td}>{user.nationality ?? "—"}</td>
                <td style={S.td}><span style={S.badge("gold")}>{user.totalPoints}</span></td>
                <td style={S.td}>{user.predictionCount}</td>
                <td style={S.td}>
                  {user.id === ownerId ? (
                    <span style={S.badge("dark")}>Owner</span>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <select
                        defaultValue={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value)}
                        style={{ ...S.select, minWidth: 120 }}
                      >
                        <option value="USER">Player</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                      {roleStatus[user.id] && (
                        <span style={{ ...S.muted, color: roleStatus[user.id].startsWith("Updated") ? "#16A34A" : "#DC2626" }}>
                          {roleStatus[user.id]}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td style={S.td}>
                  {user.id !== ownerId && (
                    <button
                      style={S.btnDanger}
                      onClick={() => deleteUser(user.id, user.displayName ?? user.email)}
                      disabled={deleting === user.id}
                      title="Delete this player"
                    >
                      <Trash2 size={13} />
                      {deleting === user.id ? "…" : "Delete"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteError && (
        <div style={S.errorBanner} role="alert">
          <AlertTriangle size={16} />
          {deleteError}
          <button
            onClick={() => setDeleteError(null)}
            style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", color: "#B91C1C", fontWeight: 700 }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Centers ─────────────────────────────────────────────────────────────

function CentersTab({ centerStats }: { centerStats: CenterStat[] }) {
  const sorted = [...centerStats].sort((a, b) => b.totalPoints - a.totalPoints);
  const rankLabel = ["Leading", "2nd", "3rd"];

  function exportCSV() {
    downloadCSV(
      "garrincha-centers.csv",
      sorted.map((c) => [c.name, c.city, c.country, String(c.playerCount), String(c.predictionCount), String(c.totalPoints), c.topPlayer ?? ""]),
      ["Center", "City", "Country", "Players", "Predictions", "Total Points", "Top Player"],
    );
  }

  return (
    <div style={S.section} className="owner-section">
      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>GARRINCHA Centers</h2>
        <button style={S.btnSecondary} onClick={exportCSV}><Download size={14} /> Export CSV</button>
      </div>

      <div style={S.centersGrid} className="owner-centers-grid">
        {sorted.map((c, i) => (
          <div key={c.id} style={S.centerCard(i === 0)} className={`owner-center-card${i === 0 ? " leader" : ""}`}>
            {i < 3 && (
              <span style={S.badge(i === 0 ? "gold" : "gray")}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {rankLabel[i]}
              </span>
            )}
            <h3 style={{ fontFamily: "'Saira Condensed', sans-serif", fontStyle: "italic", fontWeight: 800, fontSize: "1rem", color: "#1B4332", margin: 0 }}>
              {c.name}
            </h3>
            <p style={S.muted}>{c.city}, {c.country}</p>
            <div style={S.centerStatsRow}>
              {[
                { label: "Players", value: c.playerCount },
                { label: "Predictions", value: c.predictionCount },
                { label: "Points", value: c.totalPoints, green: true },
              ].map(({ label, value, green }) => (
                <div key={label} style={S.centerStat}>
                  <strong style={{ fontSize: "1rem", color: green ? "#16A34A" : "#111827" }}>{value}</strong>
                  <span style={S.muted}>{label}</span>
                </div>
              ))}
            </div>
            {c.topPlayer && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.78rem", color: "#6B7280", marginTop: 2 }}>
                <Trophy size={12} color="#D97706" />
                <span>Top: {c.topPlayer}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Bonus ───────────────────────────────────────────────────────────────

function BonusTab({ users, bonusEvents }: { users: OwnerUser[]; bonusEvents: BonusEvent[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [formStatus, setFormStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setFormStatus(null);
    try {
      await apiPost("/api/admin/bonus", { userId, points: Number(points), reason });
      setFormStatus({ ok: true, msg: "Bonus awarded successfully." });
      setUserId(""); setPoints(""); setReason("");
      router.refresh();
    } catch (err) {
      setFormStatus({ ok: false, msg: err instanceof Error ? err.message : "Error" });
    } finally { setSaving(false); }
  }

  const filteredEvents = bonusEvents.filter((e) =>
    search === "" ||
    (e.user.displayName ?? e.user.email).toLowerCase().includes(search.toLowerCase()) ||
    e.reason.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={S.section} className="owner-section">
      <h2 style={S.sectionTitle}>Bonus Points</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Award form */}
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Saira Condensed', sans-serif", fontStyle: "italic", fontWeight: 800, fontSize: "1.1rem", color: "#1B4332", margin: "0 0 0.375rem" }}>
            Award Bonus Points
          </h3>
          <p style={{ ...S.muted, marginBottom: "1rem" }}>
            Points are added to the player&apos;s total immediately and appear on the leaderboard.
          </p>
          <form style={S.form} onSubmit={submit}>
            <label style={S.fieldLabel}>
              Player
              <select style={S.fieldInput} value={userId} onChange={(e) => setUserId(e.target.value)} required>
                <option value="">Select a player…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.displayName ?? u.email} — {u.center.name}</option>
                ))}
              </select>
            </label>
            <label style={S.fieldLabel}>
              Points (negative to deduct, −100 to +100)
              <input style={S.fieldInput} type="number" min={-100} max={100} value={points} onChange={(e) => setPoints(e.target.value)} required />
            </label>
            <label style={S.fieldLabel}>
              Reason (shown on leaderboard)
              <input style={S.fieldInput} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Community challenge winner" maxLength={240} required minLength={3} />
            </label>
            <button style={{ ...S.btnPrimary, justifyContent: "center", opacity: saving ? 0.6 : 1 }} type="submit" disabled={saving}>
              <Gift size={14} />
              {saving ? "Awarding…" : "Award Bonus"}
            </button>
            {formStatus && (
              <div style={{ fontSize: "0.85rem", color: formStatus.ok ? "#16A34A" : "#DC2626", fontWeight: 500 }}>
                {formStatus.msg}
              </div>
            )}
          </form>
        </div>

        {/* History */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
            <h3 style={{ fontFamily: "'Saira Condensed', sans-serif", fontStyle: "italic", fontWeight: 800, fontSize: "1.1rem", color: "#1B4332", margin: 0 }}>
              History ({bonusEvents.length})
            </h3>
            <input style={{ ...S.searchInput, width: 160 }} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {filteredEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "#9CA3AF", fontSize: "0.875rem" }}>No bonus events yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {["Player", "Pts", "Reason", "When"].map((h) => <th key={h} style={S.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((e) => (
                    <tr key={e.id}>
                      <td style={S.td}>{e.user.displayName ?? e.user.email}</td>
                      <td style={S.td}><span style={S.badge(e.points > 0 ? "gold" : "red")}>{e.points > 0 ? "+" : ""}{e.points}</span></td>
                      <td style={{ ...S.td, maxWidth: 180 }}>{e.reason}</td>
                      <td style={{ ...S.td, ...S.muted }}>{fmt(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Leaderboard ─────────────────────────────────────────────────────────

function LeaderboardTab({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  const [search, setSearch] = useState("");

  const visible = leaderboard.filter((r) =>
    search === "" ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.center.toLowerCase().includes(search.toLowerCase()) ||
    (r.nationality ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  function exportCSV() {
    downloadCSV(
      "garrincha-leaderboard.csv",
      visible.map((r) => [String(r.rank), r.name, r.center, r.nationality ?? "", String(r.points), String(r.predictionCount)]),
      ["Rank", "Player", "Center", "Nationality", "Points", "Predictions"],
    );
  }

  const medalColors: Record<number, string> = { 1: "#D97706", 2: "#6B7280", 3: "#B45309" };

  return (
    <div style={S.section} className="owner-section">
      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>
          Full Leaderboard{" "}
          <span style={{ fontWeight: 400, color: "#9CA3AF", fontSize: "1rem" }}>({leaderboard.length} players)</span>
        </h2>
        <div style={S.controls}>
          <input style={S.searchInput} placeholder="Search player, center, nationality…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button style={S.btnPrimary} onClick={exportCSV}><Download size={14} /> Export CSV</button>
        </div>
      </div>

      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              {["#", "Player", "Center", "Nationality", "Predictions", "Points"].map((h) => (
                <th key={h} style={{ ...S.th, ...(h === "Points" ? { textAlign: "right" } : {}) }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} style={{ background: row.rank <= 3 ? "#FFFBEB" : "transparent", borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ ...S.td, width: 48, textAlign: "center" }}>
                  <span style={{
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    color: medalColors[row.rank] ?? "#9CA3AF",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {row.rank}
                  </span>
                </td>
                <td style={S.td}><strong>{row.name}</strong></td>
                <td style={S.td}>{row.center}</td>
                <td style={S.td}>{row.nationality ?? "—"}</td>
                <td style={S.td}>{row.predictionCount}</td>
                <td style={{ ...S.td, textAlign: "right" }}>
                  <strong style={S.greenText}>{row.points}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 && <div style={S.emptyState}>No players found.</div>}
    </div>
  );
}

// ─── Tab: Prizes ──────────────────────────────────────────────────────────────

function PrizesTab({ prizeWinners }: { prizeWinners: PrizeCenterGroup[] }) {
  const MEDAL = ["🥇", "🥈", "🥉"];

  function exportCSV() {
    const rows: string[][] = [];
    for (const center of prizeWinners) {
      for (const p of center.players) {
        rows.push([String(p.rank), p.name, center.centerName, String(p.points)]);
      }
    }
    downloadCSV("garrincha-prize-winners.csv", rows, ["Rank", "Player", "Center", "Points"]);
  }

  const hasPlayers = prizeWinners.some((c) => c.players.length > 0);

  return (
    <div style={S.section} className="owner-section">
      <div style={S.sectionHeader}>
        <div>
          <h2 style={S.sectionTitle}>Prize Winners — Top 10 Per Center</h2>
          <p style={{ ...S.muted, marginTop: 4, fontSize: "0.85rem" }}>
            Final standings after the World Cup final (July 19, 2026). Top 10 per GARRINCHA Center.
          </p>
        </div>
        {hasPlayers && (
          <button style={S.btnPrimary} onClick={exportCSV}><Download size={14} /> Export All</button>
        )}
      </div>

      {!hasPlayers ? (
        <div style={S.emptyState}>
          No scored predictions yet — rankings will appear once matches are finalized.
        </div>
      ) : (
        <div style={S.prizesGrid}>
          {prizeWinners.map((center) => (
            <div key={center.centerId} style={S.card}>
              <h3 style={{ fontFamily: "'Saira Condensed', sans-serif", fontStyle: "italic", fontWeight: 800, fontSize: "1rem", color: "#1B4332", margin: "0 0 0.875rem" }}>
                {center.centerName}
              </h3>
              {center.players.length === 0 ? (
                <p style={S.muted}>No players yet.</p>
              ) : (
                <ol style={{ listStyle: "none" }}>
                  {center.players.map((p) => (
                    <li key={p.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      padding: "0.5rem 0",
                      borderBottom: "1px solid #F3F4F6",
                      background: p.rank <= 3 ? "#FFFBEB" : "transparent",
                      borderRadius: p.rank <= 3 ? 6 : 0,
                      paddingLeft: p.rank <= 3 ? "0.5rem" : 0,
                    }}>
                      <span style={{ fontWeight: 700, fontSize: "1rem", minWidth: 28 }}>
                        {p.rank <= 3 ? MEDAL[p.rank - 1] : `#${p.rank}`}
                      </span>
                      <span style={{ flex: 1, fontWeight: 500, fontSize: "0.875rem", color: "#111827" }}>{p.name}</span>
                      <span style={S.badge("gold")}>{p.points} pts</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
