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

const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: "var(--gold)",
  ADMIN: "var(--green)",
  CENTER_ADMIN: "var(--info)",
  USER: "var(--text-4)",
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  SUPER_ADMIN: "mbadge mbadge-amber",
  ADMIN: "mbadge mbadge-green",
  CENTER_ADMIN: "mbadge mbadge-blue",
  USER: "mbadge",
};

export default async function AdminUsersPage() {
  const locale = await getLocale();
  let ownerId: string | null = null;
  let ownerName: string | null = null;

  if (hasDatabaseConfig()) {
    try {
      const owner = await requireSuperAdmin();
      ownerId = owner.id;
      ownerName = owner.fullName ?? owner.displayName;
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
    <div className="manager-shell">
      <AdminSidebar active="/admin/users" isSuperAdmin adminName={ownerName ?? undefined} />

      <main className="manager-main">
        <header className="manager-topbar">
          <div>
            <div className="manager-topbar-crumb">{t(locale, "admin.superEyebrow")}</div>
            <h1 className="manager-topbar-title">{t(locale, "admin.usersTitle")}</h1>
          </div>
          <div className="manager-topbar-right">
            <span className="mbadge mbadge-amber">Owner Access</span>
          </div>
        </header>

        <div className="manager-content">
          <DataModeNotice locale={locale} />

          <div className="manager-notice manager-notice--amber">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10 3L2 17h16L10 3z" strokeLinejoin="round" />
              <path d="M10 9v4M10 14.5v.5" strokeLinecap="round" />
            </svg>
            <span>{t(locale, "admin.ownerWarning")}</span>
          </div>

          <div className="mcard" style={{ padding: 0, overflow: "hidden" }}>
            {users.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-4)" }}>
                {t(locale, "admin.noUsers")}
              </div>
            ) : (
              <div className="manager-tbl-wrap">
                <table className="manager-tbl">
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
                          <div style={{ fontWeight: 700, color: "var(--text)" }}>{user.displayName || user.email}</div>
                          <div className="m-mono" style={{ marginTop: 2 }}>{user.email}</div>
                        </td>
                        <td>
                          <span style={{ color: "var(--text-3)", fontSize: 13 }}>{user.center.name}</span>
                        </td>
                        <td className="lb-hide-mobile">
                          <span style={{ color: "var(--text-3)", fontSize: 13 }}>{user.nationality || "—"}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                            <span
                              className={ROLE_BADGE_CLASS[user.role] ?? "mbadge"}
                              style={!(user.role in ROLE_BADGE_CLASS) ? {
                                background: `${ROLE_COLOR[user.role] ?? "var(--text-4)"}1f`,
                                color: ROLE_COLOR[user.role] ?? "var(--text-4)",
                              } : undefined}
                            >
                              {user.role.replace("_", " ")}
                            </span>
                            {user.id !== ownerId && (
                              <UserRoleForm
                                userId={user.id}
                                role={user.role as "USER" | "ADMIN" | "CENTER_ADMIN" | "SUPER_ADMIN"}
                                locale={locale}
                              />
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
