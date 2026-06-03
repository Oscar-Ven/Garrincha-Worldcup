import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { UserRoleForm } from "@/components/AdminForms";
import { DataModeNotice } from "@/components/DataModeNotice";
import { requireSuperAdmin } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoLeaderboard, hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminUsersPage() {
  const locale = await getLocale();
  let ownerId: string | null = null;

  if (hasDatabaseConfig()) {
    try {
      const owner = await requireSuperAdmin();
      ownerId = owner.id;
    } catch {
      redirect("/admin/login?next=/admin/users");
    }
  }

  const users = hasDatabaseConfig()
    ? await prisma.user.findMany({
        orderBy: [{ role: "desc" }, { email: "asc" }],
        select: {
          id: true,
          email: true,
          displayName: true,
          nationality: true,
          role: true,
          center: { select: { name: true } },
        },
      })
    : demoLeaderboard.map((row, index) => ({
        id: row.id,
        email: `${row.name.toLowerCase().replaceAll(" ", ".")}@example.com`,
        displayName: row.name,
        nationality: row.nationality,
        role: index === 0 ? Role.SUPER_ADMIN : index === 1 ? Role.ADMIN : Role.USER,
        center: { name: row.center },
      }));

  return (
    <main className="page">
      <DataModeNotice locale={locale} />
      <section className="page-header">
        <span className="eyebrow">{t(locale, "admin.superEyebrow")}</span>
        <h1>{t(locale, "admin.usersTitle")}</h1>
        <p>{t(locale, "admin.usersCopy")}</p>
      </section>
      <div className="admin-warning">{t(locale, "admin.ownerWarning")}</div>
      <section className="card">
        {users.length === 0 ? <div className="empty-state">{t(locale, "admin.noUsers")}</div> : null}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t(locale, "table.player")}</th>
                <th>{t(locale, "table.center")}</th>
                <th>{t(locale, "form.nationality")}</th>
                <th>{t(locale, "admin.role")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.displayName || user.email}</strong>
                    <p className="muted">{user.email}</p>
                  </td>
                  <td>{user.center.name}</td>
                  <td>{user.nationality || "-"}</td>
                  <td>
                    <UserRoleForm
                      userId={user.id}
                      role={user.role}
                      disabled={user.id === ownerId}
                      locale={locale}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
