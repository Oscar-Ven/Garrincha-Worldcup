import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoLeaderboard, demoMatches, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminPage() {
  const locale = await getLocale();
  let currentAdmin: Awaited<ReturnType<typeof requireAdmin>> | null = null;
  if (hasDatabaseConfig()) {
    try {
      currentAdmin = await requireAdmin();
    } catch {
      redirect("/admin/login?next=/admin");
    }
  }

  const isSuperAdmin = currentAdmin?.role === Role.SUPER_ADMIN || !hasDatabaseConfig();

  const [users, matches, predictions] = hasDatabaseConfig()
    ? await Promise.all([
        prisma.user.count({ where: { role: Role.USER } }),
        prisma.match.count(),
        prisma.prediction.count(),
      ])
    : [demoLeaderboard.length, demoMatches.length, demoMatches.filter((m) => m.predictions.length > 0).length];

  const tools = [
    { href: "/admin/matches", label: t(locale, "admin.finalScores"), ic: "✏️", meta: "Adjust points · audit logged" },
    { href: "/admin/bonus", label: t(locale, "admin.bonus"), ic: "🎁", meta: "Award campaign bonuses" },
    { href: "/admin/checkin", label: t(locale, "admin.checkinButton"), ic: "📱", meta: "Generate & rotate center codes" },
    { href: "/leaderboards", label: t(locale, "admin.review"), ic: "📊", meta: "Global & per center" },
    ...(isSuperAdmin ? [
      { href: "/admin/users", label: t(locale, "admin.ownerControls"), ic: "👥", meta: "Role management" },
      { href: "/admin/health", label: t(locale, "admin.healthTitle"), ic: "🩺", meta: "All services" },
    ] : []),
  ];

  return (
    <div className="admin-root" style={{ minHeight: "100vh" }}>
      {/* sidebar */}
      <aside className="admin-side">
        <div className="admin-side-top">
          <Image src="/garrincha-white.png" alt="GARRINCHA" height={20} width={120} style={{ height: 20, width: "auto" }} />
          <span className="admin-side-tag">ADMIN</span>
        </div>
        <div className="admin-side-nav">
          {[
            { href: "/admin", label: "Overview", ic: "▦" },
            { href: "/admin/matches", label: t(locale, "admin.finalScores"), ic: "✏️" },
            { href: "/admin/bonus", label: t(locale, "admin.bonus"), ic: "🎁" },
            { href: "/admin/checkin", label: t(locale, "admin.checkinButton"), ic: "📱" },
            { href: "/leaderboards", label: t(locale, "admin.review"), ic: "📊" },
            ...(isSuperAdmin ? [
              { href: "/admin/users", label: t(locale, "admin.ownerControls"), ic: "👥" },
              { href: "/admin/health", label: t(locale, "admin.healthTitle"), ic: "🩺" },
            ] : []),
          ].map((n) => (
            <Link key={n.href} href={n.href} className="admin-nav-link" style={{ textDecoration: "none" }}>
              <span className="admin-nav-ic">{n.ic}</span>
              {n.label}
            </Link>
          ))}
        </div>
        <div className="admin-side-foot">
          <div className="admin-avatar">A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
              {currentAdmin?.fullName ?? "Admin"}
            </div>
            <div className="muted" style={{ fontSize: 11 }}>
              {isSuperAdmin ? "Super Admin" : "Center Admin"}
            </div>
          </div>
          <Link href="/dashboard" style={{ color: "var(--ink-faint)", fontSize: 18, textDecoration: "none" }}>⎋</Link>
        </div>
      </aside>

      {/* main */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-topbar-crumb">
              {isSuperAdmin ? "Super Admin" : "Center Admin"}
            </div>
            <h1 className="admin-topbar-title">{t(locale, "admin.campaign")}</h1>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-date-pill">
              {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
        </header>

        <div className="admin-content">
          {/* KPI row */}
          <div className="kpi-row">
            {[
              { value: users.toLocaleString(), label: t(locale, "admin.players"), accent: "var(--green)", delta: undefined },
              { value: matches.toLocaleString(), label: t(locale, "admin.matches"), accent: "var(--ink)", delta: undefined },
              { value: predictions.toLocaleString(), label: t(locale, "admin.predictions"), accent: "var(--gold)", delta: undefined },
              { value: "6", label: "Centers", accent: "var(--ink)", delta: undefined },
            ].map((kpi, i) => (
              <div key={i} className="acard">
                <div className="kpi-value num" style={{ color: kpi.accent }}>{kpi.value}</div>
                <div className="kpi-label">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Tools */}
          <div className="acard" style={{ padding: "20px" }}>
            <div className="panel-header">
              <h3 className="panel-title">{t(locale, "admin.tools")}</h3>
            </div>
            <div className="tool-list">
              {tools.map((tool) => (
                <Link key={tool.href} href={tool.href} className="tool-row" style={{ textDecoration: "none" }}>
                  <div className="tool-ic">{tool.ic}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="tool-row-label">{tool.label}</span>
                    <span className="tool-row-meta">{tool.meta}</span>
                  </div>
                  <span className="tool-chev">›</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Campaign status */}
          <div className="acard" style={{ padding: "20px" }}>
            <div className="panel-header">
              <h3 className="panel-title">Campaign</h3>
            </div>
            <div className="mini-stat">
              <span className="muted">Matchday</span>
              <b className="num">1 / 8</b>
            </div>
            <div className="mini-stat">
              <span className="muted">Status</span>
              <span className="apill" style={{ background: "rgba(95,224,144,0.14)", color: "var(--green)" }}>● Live</span>
            </div>
            <div className="progress-bar" style={{ marginTop: 14 }}>
              <div className="progress-bar-fill" style={{ width: "13%" }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
