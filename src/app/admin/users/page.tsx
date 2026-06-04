import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
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
  let ownerName: string | null = null;

  if (hasDatabaseConfig()) {
    try { const owner = await requireSuperAdmin(); ownerId = owner.id; ownerName = owner.fullName ?? owner.displayName; }
    catch { redirect("/admin/login?next=/admin/users"); }
  }

  const users = hasDatabaseConfig()
    ? await prisma.user.findMany({
        orderBy: [{ role: "desc" }, { email: "asc" }],
        select: { id: true, email: true, displayName: true, nationality: true, role: true, center: { select: { name: true } } },
      })
    : demoLeaderboard.map((row, index) => ({
        id: row.id, email: `${row.name.toLowerCase().replaceAll(" ", ".")}@example.com`, displayName: row.name,
        nationality: row.nationality, role: index === 0 ? Role.SUPER_ADMIN : index === 1 ? Role.ADMIN : Role.USER, center: { name: row.center },
      }));

  const ROLE_COLOR: Record<string, string> = {
    SUPER_ADMIN: "var(--gold)", ADMIN: "var(--green)", CENTER_ADMIN: "var(--info)", USER: "var(--ink-faint)",
  };

  return (
    <div className="admin-root" style={{ minHeight: "100vh" }}>
      <AdminSidebar active="/admin/users" isSuperAdmin adminName={ownerName ?? undefined} />
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-topbar-crumb">{t(locale, "admin.superEyebrow")}</div>
            <h1 className="admin-topbar-title">{t(locale, "admin.usersTitle")}</h1>
          </div>
        </header>
        <div className="admin-content">
          <DataModeNotice locale={locale} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(245,194,66,0.07)", border: "1px solid rgba(245,194,66,0.25)", fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.5 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            {t(locale, "admin.ownerWarning")}
          </div>
          <div className="acard" style={{ padding: 0, overflow: "hidden" }}>
            {users.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--ink-faint)" }}>{t(locale, "admin.noUsers")}</div>
            ) : (
              <div className="tbl-scroll">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>{t(locale, "table.player")}</th>
                      <th>{t(locale, "table.center")}</th>
                      <th className="lb-hide-mobile">{t(locale, "form.nationality")}</th>
                      <th>{t(locale, "admin.role")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: "var(--ink)" }}>{user.displayName || user.email}</div>
                          <div className="muted mono" style={{ marginTop: 2 }}>{user.email}</div>
                        </td>
                        <td><span className="muted">{user.center.name}</span></td>
                        <td className="lb-hide-mobile"><span className="muted">{user.nationality || "—"}</span></td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                            <span className="apill" style={{ background: `${ROLE_COLOR[user.role]}1f`, color: ROLE_COLOR[user.role], fontSize: 10 }}>
                              {user.role.replace("_", " ")}
                            </span>
                            {user.id !== ownerId && (
                              <UserRoleForm userId={user.id} role={user.role as "USER" | "ADMIN" | "CENTER_ADMIN" | "SUPER_ADMIN"} locale={locale} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
