import Link from "next/link";
import { Suspense } from "react";
import { GarrinchaLogo } from "@/components/GarrinchaLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginForm } from "@/components/AuthForms";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function LoginPage() {
  const locale = await getLocale();
  const isPreview = !hasDatabaseConfig();

  return (
    <div className="auth-page auth-page-radial">
      {/* header */}
      <div className="auth-header">
        <GarrinchaLogo height={20} />
        <LanguageSwitcher locale={locale} />
      </div>

      {isPreview && (
        <div className="chip chip-info" style={{ marginBottom: 20, borderRadius: 11, display: "flex" }}>
          <span>👁</span>
          <span>{t(locale, "auth.previewModeNotice")}</span>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="kick" style={{ fontSize: 13, color: "var(--green)", marginBottom: 8 }}>{t(locale, "auth.loginEyebrow")}</div>
        <h1 className="auth-title">{t(locale, "auth.loginTitle")}</h1>
        <p style={{ fontSize: 14, color: "var(--ink-dim)", marginBottom: 24, lineHeight: 1.5 }}>{t(locale, "auth.loginPanelCopy")}</p>

        {isPreview ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>{t(locale, "auth.previewLoginDisabled")}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/dashboard" className="btn btn-green btn-md" style={{ textDecoration: "none" }}>{t(locale, "auth.previewViewDashboard")}</Link>
              <Link href="/leaderboards" className="btn btn-ghost btn-md" style={{ textDecoration: "none" }}>{t(locale, "auth.previewViewLeaderboards")}</Link>
            </div>
          </div>
        ) : (
          <Suspense>
            <LoginForm locale={locale} />
          </Suspense>
        )}

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: "var(--ink-dim)" }}>
          {t(locale, "auth.create")}{" "}
          <Link href="/register" style={{ color: "var(--green)", fontWeight: 700 }}>{t(locale, "nav.register")}</Link>
        </div>
      </div>
    </div>
  );
}
