import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "@/components/AuthForms";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminLoginPage() {
  const locale = await getLocale();
  const isPreview = !hasDatabaseConfig();

  return (
    <div className="auth-page" style={{ background: "var(--bg-2)", minHeight: "100vh", justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image src="/garrincha-white.png" alt="GARRINCHA" height={22} width={132} style={{ height: 22, width: "auto", display: "inline-block", opacity: 0.9 }} />
          <div className="admin-side-tag" style={{ display: "inline-block", marginLeft: 10 }}>ADMIN</div>
        </div>

        <div className="acard" style={{ padding: "28px 24px" }}>
          <div className="kick" style={{ fontSize: 12, color: "var(--green)", marginBottom: 8 }}>{t(locale, "auth.adminEyebrow")}</div>
          <h1 className="disp" style={{ fontSize: 28, color: "var(--ink)", margin: "0 0 6px" }}>{t(locale, "auth.adminTitle")}</h1>
          <p style={{ fontSize: 13, color: "var(--ink-dim)", margin: "0 0 24px", lineHeight: 1.5 }}>
            {isPreview ? "Login requires a live Supabase database." : t(locale, "auth.adminCopy")}
          </p>

          {isPreview ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/admin" className="btn btn-green btn-md" style={{ textDecoration: "none" }}>Admin dashboard (preview)</Link>
              <Link href="/dashboard" className="btn btn-ghost btn-md" style={{ textDecoration: "none" }}>Back to app</Link>
            </div>
          ) : (
            <Suspense>
              <LoginForm admin locale={locale} />
            </Suspense>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--ink-faint)" }}>
          {t(locale, "auth.adminCredentialsCopy")}
        </p>
      </div>
    </div>
  );
}
