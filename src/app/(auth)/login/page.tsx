import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/AuthForms";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function LoginPage() {
  const locale = await getLocale();
  const isPreview = !hasDatabaseConfig();

  return (
    <main className="page">
      {isPreview && (
        <div className="notice" style={{ marginBottom: 20 }}>
          <strong>{t(locale, "auth.previewModeNotice")}</strong>{" "}
          {t(locale, "auth.loginCopy")}{" "}
          <Link href="/dashboard" style={{ fontWeight: 700, textDecoration: "underline" }}>
            {t(locale, "auth.previewBrowseDashboard")}
          </Link>{" "}
          {t(locale, "auth.previewBrowseLeaderboards")}{" "}
          <Link href="/leaderboards" style={{ fontWeight: 700, textDecoration: "underline" }}>
            {t(locale, "nav.leaderboards")}
          </Link>.
        </div>
      )}
      <div className="auth-shell">
        <section className="auth-panel">
          <span className="eyebrow">{t(locale, "auth.loginEyebrow")}</span>
          <h1>{t(locale, "auth.loginTitle")}</h1>
          <p>{t(locale, "auth.loginPanelCopy")}</p>
          <p>{t(locale, "auth.loginRemoteCopy")}</p>
          <p>
            <Link href="/register">{t(locale, "auth.create")}</Link>
          </p>
        </section>
        <section className="card">
          {isPreview ? (
            <div style={{ display: "grid", gap: 12 }}>
              <p className="muted">{t(locale, "auth.previewLoginDisabled")}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="button primary" href="/dashboard">{t(locale, "auth.previewViewDashboard")}</Link>
                <Link className="button" href="/leaderboards">{t(locale, "auth.previewViewLeaderboards")}</Link>
              </div>
            </div>
          ) : (
            <Suspense>
              <LoginForm locale={locale} />
            </Suspense>
          )}
        </section>
      </div>
    </main>
  );
}
