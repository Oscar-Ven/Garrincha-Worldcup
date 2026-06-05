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

// SVG icons for tool rows
function IconScore() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ color: "var(--green-deep)" }}>
      <path d="M4 10h12M4 6h8M4 14h6" strokeLinecap="round" />
      <circle cx="15" cy="14" r="3" />
      <path d="M15 12.5v1.5l1 1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconGift() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ color: "var(--green-deep)" }}>
      <rect x="3" y="9" width="14" height="9" rx="1" />
      <path d="M2 9h16v2H2z" />
      <path d="M10 9V18M10 9C10 7 8 5 6.5 6S6 9 10 9M10 9C10 7 12 5 13.5 6S14 9 10 9" strokeLinecap="round" />
    </svg>
  );
}
function IconQr() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ color: "var(--green-deep)" }}>
      <rect x="3" y="3" width="6" height="6" rx="0.5" />
      <rect x="5" y="5" width="2" height="2" fill="currentColor" stroke="none" />
      <rect x="11" y="3" width="6" height="6" rx="0.5" />
      <rect x="13" y="5" width="2" height="2" fill="currentColor" stroke="none" />
      <rect x="3" y="11" width="6" height="6" rx="0.5" />
      <rect x="5" y="13" width="2" height="2" fill="currentColor" stroke="none" />
      <path d="M11 11h2v2h-2zM13 13h2v2h-2zM15 11h2M11 15h2v2M15 15v2" strokeLinecap="round" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ color: "var(--green-deep)" }}>
      <path d="M3 15l4-4 4 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 17h14" strokeLinecap="round" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ color: "var(--green-deep)" }}>
      <circle cx="8" cy="7" r="3" />
      <path d="M2 17c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round" />
      <path d="M14 5a3 3 0 1 1 0 4M18 17c0-2.5-1.8-4-4-4" strokeLinecap="round" />
    </svg>
  );
}
function IconHealth() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ color: "var(--green-deep)" }}>
      <path d="M3 10h3l2-5 3 10 2-5h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCrown() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ color: "var(--green-deep)" }}>
      <path d="M3 15h14M3 15l2-7 5 4 5-4 2 7H3z" strokeLinejoin="round" />
      <circle cx="10" cy="5" r="1.5" />
    </svg>
  );
}
function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
    { href: "/admin/matches", label: t(locale, "admin.finalScores"), Icon: IconScore,  meta: "Enter results after full time" },
    { href: "/admin/bonus",   label: t(locale, "admin.bonus"),       Icon: IconGift,   meta: "Award transparent manual points" },
    { href: "/admin/checkin", label: t(locale, "admin.checkinButton"),Icon: IconQr,     meta: "Generate & display center codes" },
    { href: "/leaderboards",  label: t(locale, "admin.review"),      Icon: IconChart,  meta: "Global & per-center rankings" },
    ...(isSuperAdmin ? [
      { href: "/admin/users",  label: t(locale, "admin.ownerControls"), Icon: IconUsers,  meta: "Role management" },
      { href: "/admin/health", label: t(locale, "admin.healthTitle"),   Icon: IconHealth, meta: "All services" },
      { href: "/owner",        label: "Owner Dashboard",                Icon: IconCrown,  meta: "Full campaign control" },
    ] : []),
  ];

  return (
    <div className="manager-shell">
      <AdminSidebar
        active="/admin"
        isSuperAdmin={isSuperAdmin}
        centerName={currentAdmin?.center?.name}
        adminName={currentAdmin?.fullName ?? currentAdmin?.displayName ?? undefined}
      />

      <main className="manager-main">
        <header className="manager-topbar">
          <div>
            <div className="manager-topbar-crumb">
              {isSuperAdmin ? "Platform Owner" : "Center Manager"}
            </div>
            <h1 className="manager-topbar-title">{t(locale, "admin.campaign")}</h1>
          </div>
          <div className="manager-topbar-right">
            <span className="manager-date-pill">
              {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
        </header>

        <div className="manager-content">
          <DataModeNotice locale={locale} />

          <div className="manager-desktop-notice">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0 }}>
              <rect x="2" y="4" width="16" height="11" rx="1.5" />
              <path d="M7 18h6M10 15v3" strokeLinecap="round" />
            </svg>
            <span>This dashboard is optimized for desktop. For the best experience, use a laptop or larger screen.</span>
          </div>

          {/* KPI row */}
          <div className="mcard-kpi-row">
            {[
              { value: users.toLocaleString(),       label: t(locale, "admin.players"),      color: "var(--green-deep)" },
              { value: matches.toLocaleString(),     label: t(locale, "admin.matches"),      color: "var(--text)" },
              { value: predictions.toLocaleString(), label: t(locale, "admin.predictions"),  color: "var(--gold)" },
              { value: "6",                          label: "Active centers",                color: "var(--text)" },
            ].map((kpi, i) => (
              <div key={i} className="mcard">
                <div className="mcard-kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="mcard-kpi-label">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Tools */}
          <div className="mcard">
            <div className="mcard-header">
              <h3 className="mcard-title">{t(locale, "admin.tools")}</h3>
            </div>
            <div className="mcard-tool-list">
              {tools.map((tool) => (
                <Link key={tool.href} href={tool.href} className="mcard-tool-row">
                  <div className="mcard-tool-icon">
                    <tool.Icon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="mcard-tool-label">{tool.label}</span>
                    <span className="mcard-tool-meta">{tool.meta}</span>
                  </div>
                  <span className="mcard-tool-chev"><IconChevron /></span>
                </Link>
              ))}
            </div>
          </div>

          {/* Campaign status */}
          <div className="mcard">
            <div className="mcard-header">
              <h3 className="mcard-title">Campaign</h3>
              <span className="mbadge mbadge-green">● Live</span>
            </div>
            <div className="mcard-mini-stat">
              <span className="m-muted" style={{ fontSize: 13 }}>Status</span>
              <span className="mbadge mbadge-green">Active</span>
            </div>
            <div className="mcard-mini-stat">
              <span className="m-muted" style={{ fontSize: 13 }}>Matchday</span>
              <strong style={{ fontFamily: "ui-monospace,monospace", fontSize: 13 }}>1 / 8</strong>
            </div>
            <div className="mcard-mini-stat">
              <span className="m-muted" style={{ fontSize: 13 }}>Domain</span>
              <span className="m-mono">worldcup-garrincha.com</span>
            </div>
            <div className="manager-progress">
              <div className="manager-progress-fill" style={{ width: "13%" }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
