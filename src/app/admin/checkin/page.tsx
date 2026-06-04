import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "60px 22px 40px" }}>
        <DataModeNotice locale={locale} />
        <h1 className="disp" style={{ fontSize: 32, color: "var(--ink)" }}>{t(locale, "admin.checkinTitle")}</h1>
        <p style={{ color: "var(--ink-dim)" }}>{t(locale, "preview.notice")}</p>
      </div>
    );
  }

  let admin;
  try { admin = await requireCenterAdmin(); }
  catch { redirect("/admin/login?next=/admin/checkin"); }

  const session = await getActiveSession(admin.center.id);

  return (
    <div className="admin-root" style={{ minHeight: "100vh" }}>
      <aside className="admin-side">
        <div className="admin-side-top">
          <Image src="/garrincha-white.png" alt="GARRINCHA" height={20} width={120} style={{ height: 20, width: "auto" }} />
          <span className="admin-side-tag">ADMIN</span>
        </div>
        <nav className="admin-side-nav">
          <Link href="/admin" className="admin-nav-link" style={{ textDecoration: "none" }}><span className="admin-nav-ic">▦</span>Overview</Link>
          <Link href="/admin/checkin" className="admin-nav-link active" style={{ textDecoration: "none" }}><span className="admin-nav-ic">📱</span>{t(locale, "admin.checkinTitle")}</Link>
        </nav>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-topbar-crumb">Center Admin · {admin.center.name}</div>
            <h1 className="admin-topbar-title">{t(locale, "admin.checkinTitle")}</h1>
          </div>
          <div className="admin-topbar-right">
            <Link href="/admin" style={{ fontSize: 13, color: "var(--ink-dim)", textDecoration: "none" }}>← Back</Link>
          </div>
        </header>
        <div className="admin-content">
          <div className="acard" style={{ padding: "20px 20px 24px" }}>
            <h3 className="panel-title" style={{ marginBottom: 6 }}>{admin.center.name}</h3>
            <p style={{ fontSize: 13.5, color: "var(--ink-dim)", marginBottom: 20 }}>{t(locale, "admin.checkinInstructions")}</p>
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
