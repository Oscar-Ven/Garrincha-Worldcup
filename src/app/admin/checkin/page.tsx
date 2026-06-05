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

  // Demo / preview mode
  if (!hasDatabaseConfig()) {
    return (
      <div className="manager-shell">
        <AdminSidebar active="/admin/checkin" isSuperAdmin />
        <main className="manager-main">
          <header className="manager-topbar">
            <div>
              <div className="manager-topbar-crumb">Platform Owner</div>
              <h1 className="manager-topbar-title">{t(locale, "admin.checkinTitle")}</h1>
            </div>
          </header>
          <div className="manager-content">
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
    <div className="manager-shell">
      <AdminSidebar
        active="/admin/checkin"
        isSuperAdmin={isSuperAdmin}
        centerName={admin.center.name}
        adminName={admin.fullName ?? admin.displayName ?? undefined}
      />

      <main className="manager-main">
        <header className="manager-topbar">
          <div>
            <div className="manager-topbar-crumb">{admin.center.name}</div>
            <h1 className="manager-topbar-title">{t(locale, "admin.checkinTitle")}</h1>
          </div>
        </header>

        <div className="manager-content">
          <div className="mcard" style={{ maxWidth: 560 }}>
            <div className="mcard-header">
              <h3 className="mcard-title">{admin.center.name}</h3>
              <span className="mbadge mbadge-green">● Active</span>
            </div>

            <p style={{ fontSize: 13.5, color: "var(--text-3)", marginBottom: 22, lineHeight: 1.5 }}>
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
