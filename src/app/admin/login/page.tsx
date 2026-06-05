import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/AuthForms";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminLoginPage() {
  const locale = await getLocale();
  const isPreview = !hasDatabaseConfig();

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: "2.5rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo + badge */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span>GARRINCHA</span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 9px",
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "var(--green-tint)",
              color: "var(--green-deep)",
              border: "1px solid var(--green-light)",
            }}>
              MANAGER
            </span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          padding: "28px 24px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--green)", marginBottom: 8 }}>
            {t(locale, "auth.adminEyebrow")}
          </div>
          <h1 style={{ fontFamily: "Arial, Helvetica, sans-serif", fontStyle: "normal", fontWeight: 800, fontSize: 28, color: "var(--green-deep)", margin: "0 0 6px" }}>
            Center Manager
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 24px", lineHeight: 1.5 }}>
            {isPreview
              ? "Login requires a live Supabase database."
              : t(locale, "auth.adminCopy")}
          </p>

          {isPreview ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/admin" className="btn btn-primary btn-full btn-md" style={{ textDecoration: "none" }}>
                Manager dashboard (preview)
              </Link>
              <Link href="/dashboard" className="btn btn-ghost btn-full btn-md" style={{ textDecoration: "none" }}>
                Back to app
              </Link>
            </div>
          ) : (
            <Suspense>
              <LoginForm admin locale={locale} />
            </Suspense>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--text-4)" }}>
          {t(locale, "auth.adminCredentialsCopy")}
        </p>
      </div>
    </div>
  );
}
