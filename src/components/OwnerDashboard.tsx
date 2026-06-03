"use client";

import {
  AlertTriangle,
  Award,
  BarChart2,
  CalendarCheck,
  CheckCircle,
  Download,
  Gift,
  Globe,
  ListChecks,
  Save,
  Shield,
  Trash2,
  Trophy,
  Users,
  XCircle,
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

type Tab = "overview" | "scores" | "players" | "centers" | "bonus" | "leaderboard" | "prizes";

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

const STAGE_LABELS: Record<string, string> = { GROUP: "Group", ROUND_OF_32: "R32", ROUND_OF_16: "R16", QUARTER_FINAL: "QF", SEMI_FINAL: "SF", THIRD_PLACE: "3rd", FINAL: "Final" };

// ─── Main component ───────────────────────────────────────────────────────────

export function OwnerDashboard({
  ownerId, ownerEmail, stats, users, matches, centerStats, bonusEvents, leaderboard, prizeWinners, locale,
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
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart2 size={15} /> },
    { id: "scores", label: "Final Scores", icon: <CalendarCheck size={15} /> },
    { id: "players", label: "Players", icon: <Users size={15} /> },
    { id: "centers", label: "Centers", icon: <Globe size={15} /> },
    { id: "bonus", label: "Bonus Points", icon: <Gift size={15} /> },
    { id: "leaderboard", label: "Leaderboard", icon: <Trophy size={15} /> },
    { id: "prizes", label: "🏆 Prize Winners", icon: null },
  ];

  return (
    <div className="owner-shell">
      <header className="owner-header">
        <div className="owner-header-inner">
          <div>
            <div className="owner-title">
              <Shield size={18} aria-hidden />
              <span>GARRINCHA® Owner Dashboard</span>
            </div>
            <div className="owner-subtitle">{ownerEmail} · Super Admin · Full Authority</div>
          </div>
          <div className="owner-quick-stats">
            <span className="oqs"><strong>{stats.playerCount}</strong> players</span>
            <span className="oqs"><strong>{stats.finalizedMatchCount}</strong> scored</span>
            <span className="oqs pending"><strong>{stats.pendingMatchCount}</strong> pending</span>
          </div>
        </div>
      </header>

      <nav className="owner-tabs" role="tablist">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`owner-tab ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}
          >
            {icon} {label}
          </button>
        ))}
      </nav>

      <div className="owner-content">
        {tab === "overview" && <OverviewTab stats={stats} matches={matches} users={users} bonusEvents={bonusEvents} />}
        {tab === "scores" && <ScoresTab matches={matches} locale={locale} />}
        {tab === "players" && <PlayersTab users={users} ownerId={ownerId} />}
        {tab === "centers" && <CentersTab centerStats={centerStats} />}
        {tab === "bonus" && <BonusTab users={users.filter((u) => u.role === "USER")} bonusEvents={bonusEvents} />}
        {tab === "leaderboard" && <LeaderboardTab leaderboard={leaderboard} />}
        {tab === "prizes" && <PrizesTab prizeWinners={prizeWinners} />}
      </div>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ stats, matches, users, bonusEvents }: { stats: Stats; matches: OwnerMatch[]; users: OwnerUser[]; bonusEvents: BonusEvent[] }) {
  const topUser = users.filter((u) => u.role === "USER").sort((a, b) => b.totalPoints - a.totalPoints)[0];
  const needsScore = matches.filter((m) => m.status !== "FINAL" && isPredictionLocked(new Date(m.kickoffAt), new Date())).length;

  return (
    <div className="owner-section">
      <h2 className="owner-section-title">Campaign Overview</h2>
      <div className="owner-stats-grid">
        <div className="owner-stat green">
          <Users size={20} />
          <strong>{stats.playerCount}</strong>
          <span>Registered Players</span>
        </div>
        <div className="owner-stat">
          <ListChecks size={20} />
          <strong>{stats.predictionCount}</strong>
          <span>Predictions Submitted</span>
        </div>
        <div className="owner-stat gold">
          <Award size={20} />
          <strong>{stats.totalPointsAwarded}</strong>
          <span>Total Points Awarded</span>
        </div>
        <div className="owner-stat green">
          <CheckCircle size={20} />
          <strong>{stats.finalizedMatchCount}</strong>
          <span>Matches Scored</span>
        </div>
        <div className={`owner-stat ${stats.pendingMatchCount > 0 ? "amber" : ""}`}>
          <XCircle size={20} />
          <strong>{stats.pendingMatchCount}</strong>
          <span>Matches Pending Score</span>
        </div>
        <div className="owner-stat">
          <Gift size={20} />
          <strong>{stats.bonusEventCount}</strong>
          <span>Bonus Events</span>
        </div>
        <div className="owner-stat">
          <Shield size={20} />
          <strong>{stats.adminCount}</strong>
          <span>Admin Accounts</span>
        </div>
        {needsScore > 0 && (
          <div className="owner-stat red">
            <AlertTriangle size={20} />
            <strong>{needsScore}</strong>
            <span>Played — Needs Score</span>
          </div>
        )}
      </div>

      {topUser ? (
        <div className="owner-highlight-row">
          <div className="owner-highlight">
            <Trophy size={16} />
            <div>
              <span className="owner-highlight-label">Current Leader</span>
              <strong>{topUser.displayName ?? topUser.email}</strong>
              <span className="muted">{topUser.center.name} · {topUser.totalPoints} pts</span>
            </div>
          </div>
        </div>
      ) : null}

      {bonusEvents.length > 0 && (
        <>
          <h3 className="owner-section-subtitle">Recent Bonus Activity</h3>
          <div className="owner-table-wrap">
            <table className="owner-table">
              <thead><tr><th>Player</th><th>Points</th><th>Reason</th><th>By</th><th>When</th></tr></thead>
              <tbody>
                {bonusEvents.slice(0, 8).map((e) => (
                  <tr key={e.id}>
                    <td>{e.user.displayName ?? e.user.email}</td>
                    <td><span className={`badge ${e.points > 0 ? "gold" : "red"}`}>{e.points > 0 ? "+" : ""}{e.points}</span></td>
                    <td>{e.reason}</td>
                    <td className="muted">{e.awardedBy ?? "—"}</td>
                    <td className="muted">{fmt(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
    const matchesSearch = search === "" || m.homeTeam.name.toLowerCase().includes(search.toLowerCase()) || m.awayTeam.name.toLowerCase().includes(search.toLowerCase()) || String(m.fifaMatchNo).includes(search);
    const matchesFilter = filter === "all" || m.status !== "FINAL";
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="owner-section">
      <div className="owner-section-header">
        <h2 className="owner-section-title">Final Scores</h2>
        <div className="owner-controls">
          <input className="owner-search" placeholder="Search team or match #…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="owner-toggle">
            <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>
              Needs score ({matches.filter((m) => m.status !== "FINAL").length})
            </button>
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
              All ({matches.length})
            </button>
          </div>
        </div>
      </div>
      <div className="owner-scores-list">
        {visible.length === 0 && <div className="empty-state">No matches found.</div>}
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
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isScored = match.status === "FINAL";
  const isLocked = isPredictionLocked(new Date(match.kickoffAt), now);
  const stageLabel = match.stage === "GROUP" ? `Group ${match.homeTeam.groupName ?? ""}` : (STAGE_LABELS[match.stage] ?? match.stage);

  async function save() {
    if (home === "" || away === "") return;
    setSaving(true); setStatus(null);
    try {
      await apiPost(`/api/admin/matches/${match.id}/score`, { homeScore: Number(home), awayScore: Number(away) });
      setStatus("✓ Saved");
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Error");
    } finally { setSaving(false); }
  }

  return (
    <div className={`owner-score-row ${isScored ? "scored" : isLocked ? "locked-row" : ""}`}>
      <div className="owner-score-meta">
        <span className={`badge ${isScored ? "green" : isLocked ? "locked" : "gold"}`}>
          {isScored ? "Scored" : isLocked ? "Needs score" : "Upcoming"}
        </span>
        <span className="badge dark">{stageLabel}</span>
        <span className="muted" style={{ fontSize: "0.78rem" }}>#{match.fifaMatchNo} · {fmt(match.kickoffAt)}</span>
        <span className="muted" style={{ fontSize: "0.78rem" }}>{match.predictionCount} predictions</span>
      </div>
      <div className="owner-score-teams">
        <div className="owner-score-team">
          <TeamFlag team={match.homeTeam} size="sm" />
          <strong>{match.homeTeam.name}</strong>
        </div>
        <div className="owner-score-inputs">
          <input
            className="owner-score-input"
            type="number" min={0} max={30}
            value={home} onChange={(e) => setHome(e.target.value)}
            aria-label="Home score"
          />
          <span className="owner-score-dash">–</span>
          <input
            className="owner-score-input"
            type="number" min={0} max={30}
            value={away} onChange={(e) => setAway(e.target.value)}
            aria-label="Away score"
          />
          <button className={`button ${isScored ? "dark" : "primary"}`} onClick={save} disabled={saving || home === "" || away === ""}>
            <Save size={14} /> {saving ? "Saving…" : isScored ? "Update" : t(locale, "admin.saveScore")}
          </button>
          {status && <span className="muted" style={{ fontSize: "0.8rem" }}>{status}</span>}
        </div>
        <div className="owner-score-team" style={{ justifyContent: "flex-end" }}>
          <strong>{match.awayTeam.name}</strong>
          <TeamFlag team={match.awayTeam} size="sm" />
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
  const [roleStatus, setRoleStatus] = useState<Record<string, string>>({});

  const centers = Array.from(new Set(users.map((u) => u.center.name))).sort();

  const visible = users.filter((u) => {
    const matchesSearch = search === "" ||
      (u.displayName ?? u.email).toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesCenter = centerFilter === "all" || u.center.name === centerFilter;
    return matchesSearch && matchesRole && matchesCenter;
  });

  async function changeRole(userId: string, role: string) {
    try {
      await apiPatch(`/api/admin/users/${userId}/role`, { role });
      setRoleStatus((prev) => ({ ...prev, [userId]: "✓ Updated" }));
      router.refresh();
    } catch (err) {
      setRoleStatus((prev) => ({ ...prev, [userId]: err instanceof Error ? err.message : "Error" }));
    }
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Delete "${name}"? This removes all their predictions and points. This cannot be undone.`)) return;
    setDeleting(userId);
    try {
      await apiDelete(`/api/admin/users/${userId}`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete user.");
    } finally { setDeleting(null); }
  }

  function exportCSV() {
    downloadCSV("garrincha-players.csv",
      visible.map((u) => [u.displayName ?? "", u.email, u.role, u.center.name, u.nationality ?? "", String(u.totalPoints), String(u.predictionCount), u.createdAt]),
      ["Display Name", "Email", "Role", "Center", "Nationality", "Points", "Predictions", "Registered"]
    );
  }

  return (
    <div className="owner-section">
      <div className="owner-section-header">
        <h2 className="owner-section-title">Players <span className="muted" style={{ fontWeight: 400 }}>({visible.length} shown)</span></h2>
        <div className="owner-controls">
          <input className="owner-search" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="owner-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}>
            <option value="all">All roles</option>
            <option value="USER">Players</option>
            <option value="ADMIN">Admins</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <select className="owner-select" value={centerFilter} onChange={(e) => setCenterFilter(e.target.value)}>
            <option value="all">All centers</option>
            {centers.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="button dark" onClick={exportCSV}><Download size={14} /> Export CSV</button>
        </div>
      </div>
      <div className="owner-table-wrap">
        <table className="owner-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Center</th>
              <th>Nationality</th>
              <th>Points</th>
              <th>Predictions</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.displayName ?? user.email}</strong>
                  <div className="muted" style={{ fontSize: "0.76rem" }}>{user.email}</div>
                </td>
                <td>{user.center.name}</td>
                <td>{user.nationality ?? "—"}</td>
                <td><span className="badge gold">{user.totalPoints}</span></td>
                <td>{user.predictionCount}</td>
                <td>
                  {user.id === ownerId ? (
                    <span className="badge dark">Owner</span>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div className="role-form" style={{ gap: 6 }}>
                        <select
                          defaultValue={user.role}
                          onChange={(e) => changeRole(user.id, e.target.value)}
                          style={{ minWidth: 110 }}
                        >
                          <option value="USER">Player</option>
                          <option value="ADMIN">Admin</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                      </div>
                      {roleStatus[user.id] && <span className="muted" style={{ fontSize: "0.72rem" }}>{roleStatus[user.id]}</span>}
                    </div>
                  )}
                </td>
                <td>
                  {user.id !== ownerId && (
                    <button
                      className="owner-delete-btn"
                      onClick={() => deleteUser(user.id, user.displayName ?? user.email)}
                      disabled={deleting === user.id}
                      title="Delete this player"
                    >
                      <Trash2 size={14} />
                      {deleting === user.id ? "…" : "Delete"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Centers ─────────────────────────────────────────────────────────────

function CentersTab({ centerStats }: { centerStats: CenterStat[] }) {
  const sorted = [...centerStats].sort((a, b) => b.totalPoints - a.totalPoints);

  function exportCSV() {
    downloadCSV("garrincha-centers.csv",
      sorted.map((c) => [c.name, c.city, c.country, String(c.playerCount), String(c.predictionCount), String(c.totalPoints), c.topPlayer ?? ""]),
      ["Center", "City", "Country", "Players", "Predictions", "Total Points", "Top Player"]
    );
  }

  return (
    <div className="owner-section">
      <div className="owner-section-header">
        <h2 className="owner-section-title">GARRINCHA Centers</h2>
        <button className="button dark" onClick={exportCSV}><Download size={14} /> Export CSV</button>
      </div>
      <div className="owner-centers-grid">
        {sorted.map((c, i) => (
          <div key={c.id} className={`owner-center-card ${i === 0 ? "leader" : ""}`}>
            {i === 0 && <span className="owner-center-rank gold">🥇 Leading</span>}
            {i === 1 && <span className="owner-center-rank silver">🥈 2nd</span>}
            {i === 2 && <span className="owner-center-rank bronze">🥉 3rd</span>}
            <h3>{c.name}</h3>
            <p className="muted">{c.city}, {c.country}</p>
            <div className="owner-center-stats">
              <div>
                <strong>{c.playerCount}</strong>
                <span>Players</span>
              </div>
              <div>
                <strong>{c.predictionCount}</strong>
                <span>Predictions</span>
              </div>
              <div>
                <strong className="green-text">{c.totalPoints}</strong>
                <span>Total pts</span>
              </div>
            </div>
            {c.topPlayer && (
              <div className="owner-center-top">
                <Trophy size={12} />
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
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setStatus(null);
    try {
      await apiPost("/api/admin/bonus", { userId, points: Number(points), reason });
      setStatus("✓ Bonus awarded");
      setUserId(""); setPoints(""); setReason("");
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Error");
    } finally { setSaving(false); }
  }

  const filteredEvents = bonusEvents.filter((e) =>
    search === "" ||
    (e.user.displayName ?? e.user.email).toLowerCase().includes(search.toLowerCase()) ||
    e.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="owner-section">
      <h2 className="owner-section-title">Bonus Points</h2>
      <div className="grid two" style={{ gap: 24 }}>
        <div className="card">
          <h3 style={{ margin: "0 0 6px" }}>Award Bonus Points</h3>
          <p className="muted" style={{ marginBottom: 16 }}>Points are added to the player&apos;s total immediately and appear on the leaderboard.</p>
          <form className="form" onSubmit={submit}>
            <label className="field">
              <span>Player</span>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
                <option value="">Select a player…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.displayName ?? u.email} — {u.center.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Points (negative to deduct, −100 to +100)</span>
              <input type="number" min={-100} max={100} value={points} onChange={(e) => setPoints(e.target.value)} required />
            </label>
            <label className="field">
              <span>Reason (shown on leaderboard)</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Community challenge winner" maxLength={240} required minLength={3} />
            </label>
            <button className="button primary" type="submit" disabled={saving}>
              <Gift size={14} />
              {saving ? "Awarding…" : "Award Bonus"}
            </button>
            {status && <p className={`message ${status.startsWith("✓") ? "success" : "error"}`}>{status}</p>}
          </form>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>History ({bonusEvents.length})</h3>
            <input className="owner-search" style={{ width: 160 }} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {filteredEvents.length === 0 && <div className="empty-state">No bonus events yet.</div>}
          <div className="owner-table-wrap">
            <table className="owner-table">
              <thead><tr><th>Player</th><th>Pts</th><th>Reason</th><th>When</th></tr></thead>
              <tbody>
                {filteredEvents.map((e) => (
                  <tr key={e.id}>
                    <td>{e.user.displayName ?? e.user.email}</td>
                    <td><span className={`badge ${e.points > 0 ? "gold" : "red"}`}>{e.points > 0 ? "+" : ""}{e.points}</span></td>
                    <td style={{ maxWidth: 180 }}>{e.reason}</td>
                    <td className="muted" style={{ fontSize: "0.74rem" }}>{fmt(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    (r.nationality ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function exportCSV() {
    downloadCSV("garrincha-leaderboard.csv",
      visible.map((r) => [String(r.rank), r.name, r.center, r.nationality ?? "", String(r.points), String(r.predictionCount)]),
      ["Rank", "Player", "Center", "Nationality", "Points", "Predictions"]
    );
  }

  const medalClass = (rank: number) => rank === 1 ? "top-1" : rank === 2 ? "top-2" : rank === 3 ? "top-3" : "";

  return (
    <div className="owner-section">
      <div className="owner-section-header">
        <h2 className="owner-section-title">Full Leaderboard <span className="muted" style={{ fontWeight: 400 }}>({leaderboard.length} players)</span></h2>
        <div className="owner-controls">
          <input className="owner-search" placeholder="Search player, center, nationality…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="button primary" onClick={exportCSV}><Download size={14} /> Export CSV</button>
        </div>
      </div>
      <div className="owner-table-wrap">
        <table className="owner-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Center</th>
              <th>Nationality</th>
              <th>Predictions</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className={`rank-medal ${medalClass(row.rank)}`}>{row.rank}</span>
                </td>
                <td><strong>{row.name}</strong></td>
                <td>{row.center}</td>
                <td>{row.nationality ?? "—"}</td>
                <td>{row.predictionCount}</td>
                <td><strong className="green-text">{row.points}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 && <div className="empty-state">No players found.</div>}
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
    <div className="owner-section">
      <div className="owner-section-header">
        <div>
          <h2 className="owner-section-title">Prize Winners — Top 10 Per Center</h2>
          <p className="muted" style={{ marginTop: 4 }}>
            Final standings after the World Cup final (July 19, 2026). Top 10 per GARRINCHA Center.
          </p>
        </div>
        {hasPlayers && (
          <button className="button primary" onClick={exportCSV}>
            <Download size={14} /> Export All
          </button>
        )}
      </div>

      {!hasPlayers ? (
        <div className="empty-state">No scored predictions yet — rankings will appear once matches are finalized.</div>
      ) : (
        <div className="prizes-grid">
          {prizeWinners.map((center) => (
            <div key={center.centerId} className="prize-center-card">
              <h3 className="prize-center-name">{center.centerName}</h3>
              {center.players.length === 0 ? (
                <p className="muted">No players yet.</p>
              ) : (
                <ol className="prize-list">
                  {center.players.map((p) => (
                    <li key={p.id} className={`prize-row${p.rank <= 3 ? " prize-podium" : ""}`}>
                      <span className="prize-rank">
                        {p.rank <= 3 ? MEDAL[p.rank - 1] : `#${p.rank}`}
                      </span>
                      <span className="prize-name">{p.name}</span>
                      <span className="prize-points badge gold">{p.points} pts</span>
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
