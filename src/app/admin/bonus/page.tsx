import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { BonusForm } from "@/components/AdminForms";
import { DataModeNotice } from "@/components/DataModeNotice";
import { requireAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoBonusEvents, demoBonusUsers, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function BonusPage() {
  const locale = await getLocale();
  let admin: Awaited<ReturnType<typeof requireAdmin>> | null = null;
  if (hasDatabaseConfig()) {
    try { admin = await requireAdmin(); }
    catch { redirect("/admin/login?next=/admin/bonus"); }
  }

  const [users, events] = hasDatabaseConfig()
    ? await Promise.all([
        prisma.user.findMany({ where: { role: Role.USER }, orderBy: { email: "asc" }, select: { id: true, email: true, displayName: true } }),
        prisma.pointEvent.findMany({ orderBy: { createdAt: "desc" }, take: 25, include: { user: { select: { email: true, displayName: true } } } }),
      ])
    : [demoBonusUsers, demoBonusEvents];

  const isSuperAdmin = !admin || admin.role === "SUPER_ADMIN" || !hasDatabaseConfig();

  return (
    <div className="admin-root" style={{ minHeight: "100vh" }}>
      <AdminSidebar
        active="/admin/bonus"
        isSuperAdmin={isSuperAdmin}
        centerName={admin?.center?.name}
        adminName={admin?.fullName ?? admin?.displayName ?? undefined}
      />
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-topbar-crumb">{isSuperAdmin ? "Super Admin" : `Center Admin · ${admin?.center?.name}`}</div>
            <h1 className="admin-topbar-title">{t(locale, "admin.bonusTitle")}</h1>
          </div>
        </header>
        <div className="admin-content">
          <DataModeNotice locale={locale} />
          <div className="two-col">
            <div className="acard">
              <div className="panel-header">
                <h3 className="panel-title">{t(locale, "admin.awardBonus")}</h3>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink-dim)", margin: "0 0 20px", lineHeight: 1.5 }}>{t(locale, "admin.awardCopy")}</p>
              <BonusForm users={users} locale={locale} />
            </div>
            <div className="acard" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "20px 20px 0" }}>
                <div className="panel-header">
                  <h3 className="panel-title">{t(locale, "admin.recentAwards")}</h3>
                </div>
              </div>
              {events.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--ink-faint)", fontSize: 13 }}>{t(locale, "admin.noAwards")}</div>
              ) : (
                <div className="tbl-scroll">
                  <table className="tbl">
                    <thead><tr><th>{t(locale, "form.user")}</th><th>{t(locale, "form.reason")}</th><th style={{ textAlign: "right" }}>{t(locale, "form.points")}</th></tr></thead>
                    <tbody>
                      {(events as { id: string; points: number; reason: string; user: { email: string; displayName: string | null } }[]).map((ev) => (
                        <tr key={ev.id}>
                          <td><b>{ev.user.displayName || ev.user.email}</b></td>
                          <td><span className="muted">{ev.reason}</span></td>
                          <td style={{ textAlign: "right" }}>
                            <span className="num" style={{ color: ev.points > 0 ? "var(--green)" : "var(--live)", fontSize: 16 }}>
                              {ev.points > 0 ? "+" : ""}{ev.points}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
