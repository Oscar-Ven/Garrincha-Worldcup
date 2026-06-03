import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
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
    try {
      await requireAdmin();
    } catch {
      redirect("/admin/login?next=/admin/bonus");
    }
  }

  const [users, events] = hasDatabaseConfig()
    ? await Promise.all([
        prisma.user.findMany({
          where: { role: Role.USER },
          orderBy: { email: "asc" },
          select: { id: true, email: true, displayName: true },
        }),
        prisma.pointEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 25,
          include: { user: { select: { email: true, displayName: true } } },
        }),
      ])
    : [demoBonusUsers, demoBonusEvents];

  return (
    <main className="page">
      <DataModeNotice locale={locale} />
      <section className="page-header">
        <span className="eyebrow">{t(locale, "auth.adminEyebrow")}</span>
        <h1>{t(locale, "admin.bonusTitle")}</h1>
        <p>{t(locale, "admin.bonusCopy")}</p>
      </section>
      <div className="grid two">
        <section className="card">
          <h2>{t(locale, "admin.awardBonus")}</h2>
          <p className="muted">{t(locale, "admin.awardCopy")}</p>
          <BonusForm users={users} locale={locale} />
        </section>
        <section className="card">
          <h2>{t(locale, "admin.recentAwards")}</h2>
          {events.length === 0 ? <div className="empty-state">{t(locale, "admin.noAwards")}</div> : null}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t(locale, "form.user")}</th>
                  <th>{t(locale, "form.reason")}</th>
                  <th>{t(locale, "form.points")}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.user.displayName || event.user.email}</td>
                    <td>{event.reason}</td>
                    <td><span className="badge gold">{event.points}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
