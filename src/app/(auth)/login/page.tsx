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
    <div className="auth-page">
      <div className="auth-card">
        {/* ── Logo + language switcher ── */}
        <div className="auth-logo">
          <GarrinchaLogo height={22} variant="black" />
          <LanguageSwitcher locale={locale} />
        </div>

        {/* ── Preview banner ── */}
        {isPreview && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--info-tint)",
              border: "1px solid #BFDBFE",
              marginBottom: 16,
              fontSize: 13,
              color: "#1e3a5f",
            }}
          >
            <span>👁</span>
            <span>{t(locale, "auth.previewModeNotice")}</span>
          </div>
        )}

        {/* ── Heading ── */}
        <h1 className="auth-title">{t(locale, "auth.loginTitle")}</h1>
        <p className="auth-sub">{t(locale, "auth.loginCopy")}</p>

        {/* ── Info box: how email-link access works ── */}
        <div className="auth-info-box">
          <div className="auth-info-box-icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="22,6 12,13 2,6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="auth-info-box-text">
            {t(locale, "auth.accessLinkNote")}
          </p>
        </div>

        {/* ── Form or preview state ── */}
        {isPreview ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>
              {t(locale, "auth.previewLoginDisabled")}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                href="/dashboard"
                className="btn btn-green btn-md"
                style={{ textDecoration: "none" }}
              >
                {t(locale, "auth.previewViewDashboard")}
              </Link>
              <Link
                href="/leaderboards"
                className="btn btn-ghost btn-md"
                style={{ textDecoration: "none" }}
              >
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
        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 13.5,
            color: "var(--text-3)",
          }}
        >
          {t(locale, "auth.create")}{" "}
          <Link
            href="/register"
            style={{ color: "var(--green)", fontWeight: 700 }}
          >
            {t(locale, "nav.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
