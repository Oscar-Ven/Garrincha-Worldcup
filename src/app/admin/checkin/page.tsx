import { redirect } from "next/navigation";
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
      <main className="page">
        <DataModeNotice locale={locale} />
        <section className="page-header">
          <span className="eyebrow">{t(locale, "auth.adminEyebrow")}</span>
          <h1>{t(locale, "admin.checkinTitle")}</h1>
          <p>{t(locale, "admin.checkinCopy")}</p>
        </section>
        <div className="admin-warning">{t(locale, "preview.notice")}</div>
      </main>
    );
  }

  let admin;
  try {
    admin = await requireCenterAdmin();
  } catch {
    redirect("/admin/login?next=/admin/checkin");
  }

  const session = await getActiveSession(admin.center.id);

  return (
    <main className="page">
      <DataModeNotice locale={locale} />
      <section className="page-header">
        <span className="eyebrow">{t(locale, "auth.adminEyebrow")}</span>
        <h1>{t(locale, "admin.checkinTitle")}</h1>
        <p>{t(locale, "admin.checkinCopy")}</p>
      </section>
      <section className="card checkin-admin-card">
        <h2>{admin.center.name}</h2>
        <p className="muted">{t(locale, "admin.checkinInstructions")}</p>
        <CheckInCodeForm
          centerId={admin.center.id}
          initialCode={session?.code ?? null}
          initialExpiresAt={session?.expiresAt.toISOString() ?? null}
          locale={locale}
        />
      </section>
    </main>
  );
}
