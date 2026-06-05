import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/AuthForms";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

export const metadata = { title: "Request access link — GARRINCHA World Cup 2026" };

export default async function LoginPage() {
  const locale = await getLocale();
  const isPreview = !hasDatabaseConfig();

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Logo row ── */}
        <div className="auth-logo-row">
          <div>
            <div style={{ fontSize: ".9375rem", fontWeight: 800, color: "var(--g-dark)", letterSpacing: "-.01em" }}>
              GARRINCHA
            </div>
            <div style={{ fontSize: ".625rem", fontWeight: 600, color: "var(--gold)", letterSpacing: ".08em", textTransform: "uppercase" }}>
              World Cup 2026
            </div>
          </div>
        </div>

        {/* ── Preview banner ── */}
        {isPreview && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 10,
            background: "rgba(245,194,66,0.12)", border: "1px solid rgba(245,194,66,0.28)",
            marginBottom: 16, fontSize: 13, color: "var(--gold)",
          }}>
            <span>👁</span>
            <span>{t(locale, "auth.previewModeNotice")}</span>
          </div>
        )}

        {/* ── Heading ── */}
        <h1 className="auth-title">{t(locale, "auth.loginTitle")}</h1>
        <p style={{ fontSize: ".875rem", color: "var(--text-3)", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
          {t(locale, "auth.loginCopy")}
        </p>

        {/* ── Email link info box ── */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "12px 14px", borderRadius: 10, marginBottom: 16,
          background: "var(--g-pale)", border: "1px solid var(--g-border)",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "var(--g-muted)", border: "1px solid var(--g-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, color: "var(--g-main)",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <p style={{ fontSize: 13, color: "var(--g-dark)", margin: 0, lineHeight: 1.5 }}>
            {t(locale, "auth.accessLinkNote")}
          </p>
        </div>

        {/* ── Form ── */}
        {isPreview ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>
              {t(locale, "auth.previewLoginDisabled")}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/dashboard" className="btn btn-green btn-md">
                {t(locale, "auth.previewViewDashboard")}
              </Link>
              <Link href="/leaderboards" className="btn btn-ghost btn-md">
                {t(locale, "auth.previewViewLeaderboards")}
              </Link>
            </div>
          </div>
        ) : (
          <Suspense>
            <LoginForm locale={locale} />
          </Suspense>
        )}

        {/* ── Footer ── */}
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13.5, color: "var(--text-3)" }}>
          {t(locale, "auth.create")}{" "}
          <Link href="/register" style={{ color: "var(--g-main)", fontWeight: 700 }}>
            {t(locale, "nav.register")}
          </Link>
        </p>

      </div>
    </div>
  );
}
