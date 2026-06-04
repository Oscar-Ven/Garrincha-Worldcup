import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BonusForm } from "@/components/AdminForms";
import { DataModeNotice } from "@/components/DataModeNotice";
import { requireAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoBonusEvents, demoBonusUsers, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function BonusPage() {
  const locale = await getLocale();
  if (hasDatabaseConfig()) {
    try { await requireAdmin(); }
    catch { redirect("/admin/login?next=/admin/bonus"); }
  }

  const [users, events] = hasDatabaseConfig()
    ? await Promise.all([
        prisma.user.findMany({ where: { role: Role.USER }, orderBy: { email: "asc" }, select: { id: true, email: true, displayName: true } }),
        prisma.pointEvent.findMany({ orderBy: { createdAt: "desc" }, take: 25, include: { user: { select: { email: true, displayName: true } } } }),
      ])
    : [demoBonusUsers, demoBonusEvents];

  return (
    <div className="admin-root" style={{ minHeight: "100vh" }}>
      <aside className="admin-side">
        <div className="admin-side-top">
          <Image src="/garrincha-white.png" alt="GARRINCHA" height={20} width={120} style={{ height: 20, width: "auto" }} />
          <span className="admin-side-tag">ADMIN</span>
        </div>
        <nav className="admin-side-nav">
          <Link href="/admin" className="admin-nav-link" style={{ textDecoration: "none" }}><span className="admin-nav-ic">▦</span>Overview</Link>
          <Link href="/admin/matches" className="admin-nav-link" style={{ textDecoration: "none" }}><span className="admin-nav-ic">✏️</span>{t(locale, "admin.scoreTitle")}</Link>
          <Link href="/admin/bonus" className="admin-nav-link active" style={{ textDecoration: "none" }}><span className="admin-nav-ic">🎁</span>{t(locale, "admin.bonusTitle")}</Link>
          <Link href="/admin/checkin" className="admin-nav-link" style={{ textDecoration: "none" }}><span className="admin-nav-ic">📱</span>{t(locale, "admin.checkinTitle")}</Link>
        </nav>
        <div className="admin-side-foot">
          <Link href="/admin" style={{ fontSize: 13, color: "var(--ink-dim)", textDecoration: "none" }}>← Back</Link>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-topbar-crumb">{t(locale, "auth.adminEyebrow")}</div>
            <h1 className="admin-topbar-title">{t(locale, "admin.bonusTitle")}</h1>
          </div>
        </header>
        <div className="admin-content">
          <DataModeNotice locale={locale} />
          <div className="two-col">
            {/* Award form */}
            <div className="acard">
              <div className="panel-header">
                <h3 className="panel-title">{t(locale, "admin.awardBonus")}</h3>
              </div>
              <p style={{ fontSize: 13, color: "var(--ink-dim)", margin: "0 0 20px", lineHeight: 1.5 }}>{t(locale, "admin.awardCopy")}</p>
              <BonusForm users={users} locale={locale} />
            </div>

            {/* Recent awards */}
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
                    <thead>
                      <tr>
                        <th>{t(locale, "form.user")}</th>
                        <th>{t(locale, "form.reason")}</th>
                        <th style={{ textAlign: "right" }}>{t(locale, "form.points")}</th>
                      </tr>
                    </thead>
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
