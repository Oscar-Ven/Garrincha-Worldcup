import Link from "next/link";
import { Suspense } from "react";
import { GarrinchaLogo } from "@/components/GarrinchaLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginForm } from "@/components/AuthForms";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

export const metadata = { title: "Request access link — GARRINCHA World Cup Pronostiek 2026" };

export default async function LoginPage() {
  const locale = await getLocale();
  const isPreview = !hasDatabaseConfig();

  return (
    <div className="auth-page auth-page-radial">
      {/* ── Header ── */}
      <div className="auth-header">
        <GarrinchaLogo height={20} />
        <LanguageSwitcher locale={locale} />
      </div>

      {/* ── Preview banner ── */}
      {isPreview && (
        <div className="chip chip-info" style={{ marginBottom: 20, borderRadius: 11, display: "flex" }}>
          <span>👁</span>
          <span>{t(locale, "auth.previewModeNotice")}</span>
        </div>
      )}

      {/* ── How access works (visual context) ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(95,224,144,0.07)", border: "1px solid rgba(95,224,144,0.22)", marginBottom: 24 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--green-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          🔗
        </div>
        <div>
          <div className="label" style={{ fontSize: 9, color: "var(--green)" }}>
            {t(locale, "auth.remoteAccess")}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.4 }}>
            {t(locale, "auth.accessLinkNote")}
          </div>
        </div>
      </div>

      {/* ── Title block ── */}
      <div className="kick" style={{ fontSize: 13, color: "var(--green)", marginBottom: 8 }}>
        {t(locale, "auth.loginEyebrow")}
      </div>
      <h1 className="auth-title">{t(locale, "auth.loginTitle")}</h1>
      <p className="auth-sub">{t(locale, "auth.loginCopy")}</p>

      {/* ── Form or preview state ── */}
      {isPreview ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--ink-faint)", margin: 0 }}>
            {t(locale, "auth.previewLoginDisabled")}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/dashboard" className="btn btn-green btn-md" style={{ textDecoration: "none" }}>
              {t(locale, "auth.previewViewDashboard")}
            </Link>
            <Link href="/leaderboards" className="btn btn-ghost btn-md" style={{ textDecoration: "none" }}>
              {t(locale, "auth.previewViewLeaderboards")}
            </Link>
          </div>
        </div>
      ) : (
        <Suspense>
          <LoginForm locale={locale} />
        </Suspense>
      )}

      {/* ── Register link ── */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <p style={{ fontSize: 13.5, color: "var(--ink-dim)", margin: 0 }}>
          {t(locale, "auth.create")}{" "}
          <Link href="/register" style={{ color: "var(--green)", fontWeight: 700 }}>
            {t(locale, "nav.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
