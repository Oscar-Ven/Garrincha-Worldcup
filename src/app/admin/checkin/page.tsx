import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { CheckInCodeForm } from "@/components/AdminForms";
import { DataModeNotice } from "@/components/DataModeNotice";
import { requireCenterAdmin } from "@/lib/auth";
import { getActiveSession } from "@/lib/checkin";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminCheckInPage() {
  const locale = await getLocale();

  if (!hasDatabaseConfig()) {
    return (
      <div className="admin-root" style={{ minHeight: "100vh" }}>
        <AdminSidebar active="/admin/checkin" isSuperAdmin />
        <main className="admin-main">
          <header className="admin-topbar">
            <div><h1 className="admin-topbar-title">{t(locale, "admin.checkinTitle")}</h1></div>
          </header>
          <div className="admin-content">
            <DataModeNotice locale={locale} />
          </div>
        </main>
      </div>
    );
  }

  let admin;
  try { admin = await requireCenterAdmin(); }
  catch { redirect("/admin/login?next=/admin/checkin"); }

  const session = await getActiveSession(admin.center.id);
  const isSuperAdmin = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";

  return (
    <div className="admin-root" style={{ minHeight: "100vh" }}>
      <AdminSidebar
        active="/admin/checkin"
        isSuperAdmin={isSuperAdmin}
        centerName={admin.center.name}
        adminName={admin.fullName ?? admin.displayName ?? undefined}
      />
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-topbar-crumb">{admin.center.name}</div>
            <h1 className="admin-topbar-title">{t(locale, "admin.checkinTitle")}</h1>
          </div>
        </header>
        <div className="admin-content">
          <div className="acard" style={{ maxWidth: 560 }}>
            <div className="panel-header" style={{ marginBottom: 6 }}>
              <h3 className="panel-title">{admin.center.name}</h3>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--ink-dim)", marginBottom: 22, lineHeight: 1.5 }}>
              {t(locale, "admin.checkinInstructions")}
            </p>
            <CheckInCodeForm
              centerId={admin.center.id}
              initialCode={session?.code ?? null}
              initialExpiresAt={session?.expiresAt.toISOString() ?? null}
              locale={locale}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
