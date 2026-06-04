import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { DataModeNotice } from "@/components/DataModeNotice";
import { requireAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoLeaderboard, demoMatches, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminPage() {
  const locale = await getLocale();
  let currentAdmin: Awaited<ReturnType<typeof requireAdmin>> | null = null;
  if (hasDatabaseConfig()) {
    try { currentAdmin = await requireAdmin(); }
    catch { redirect("/admin/login?next=/admin"); }
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
    { href: "/admin/matches", label: t(locale, "admin.finalScores"), ic: "✏️", meta: "Enter results after full time" },
    { href: "/admin/bonus",   label: t(locale, "admin.bonus"),       ic: "🎁", meta: "Award transparent manual points" },
    { href: "/admin/checkin", label: t(locale, "admin.checkinButton"),ic: "📱", meta: "Generate & display center codes" },
    { href: "/leaderboards",  label: t(locale, "admin.review"),      ic: "📊", meta: "Global & per-center rankings" },
    ...(isSuperAdmin ? [
      { href: "/admin/users",  label: t(locale, "admin.ownerControls"), ic: "👥", meta: "Role management" },
      { href: "/admin/health", label: t(locale, "admin.healthTitle"),   ic: "🩺", meta: "All services" },
      { href: "/owner",        label: "Owner Dashboard",                ic: "👑", meta: "Full campaign control" },
    ] : []),
  ];

  return (
    <div className="admin-root" style={{ minHeight: "100vh" }}>
      <AdminSidebar
        active="/admin"
        isSuperAdmin={isSuperAdmin}
        centerName={currentAdmin?.center?.name}
        adminName={currentAdmin?.fullName ?? currentAdmin?.displayName ?? undefined}
      />

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
          <DataModeNotice locale={locale} />

          {/* KPI row */}
          <div className="kpi-row">
            {[
              { value: users.toLocaleString(), label: t(locale, "admin.players"),     accent: "var(--green)" },
              { value: matches.toLocaleString(),label: t(locale, "admin.matches"),    accent: "var(--ink)" },
              { value: predictions.toLocaleString(), label: t(locale, "admin.predictions"), accent: "var(--gold)" },
              { value: "6", label: "Active centers", accent: "var(--ink)" },
            ].map((kpi, i) => (
              <div key={i} className="acard">
                <div className="kpi-value num" style={{ color: kpi.accent }}>{kpi.value}</div>
                <div className="kpi-label">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Tools */}
          <div className="acard">
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
          <div className="acard">
            <div className="panel-header">
              <h3 className="panel-title">Campaign</h3>
            </div>
            <div className="mini-stat"><span className="muted">Status</span><span className="apill" style={{ background: "rgba(95,224,144,0.14)", color: "var(--green)", fontSize: 11 }}>● Live</span></div>
            <div className="mini-stat"><span className="muted">Matchday</span><b className="num">1 / 8</b></div>
            <div className="mini-stat"><span className="muted">Domain</span><span style={{ fontFamily: "ui-monospace,monospace", fontSize: 12, color: "var(--ink-dim)" }}>worldcup-garrincha.com</span></div>
            <div className="progress-bar" style={{ marginTop: 14 }}>
              <div className="progress-bar-fill" style={{ width: "13%" }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
