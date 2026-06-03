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
    <main className="page">
      {isPreview && (
        <div className="notice" style={{ marginBottom: 20 }}>
          <strong>Preview mode —</strong> no database connected. Admin login is disabled.
          Go directly to <Link href="/admin" style={{ fontWeight: 700, textDecoration: "underline" }}>Admin dashboard</Link> or <Link href="/owner" style={{ fontWeight: 700, textDecoration: "underline" }}>Owner dashboard</Link> — no login needed in preview.
        </div>
      )}
      <div className="auth-shell">
        <section className="auth-panel">
          <span className="eyebrow">{t(locale, "auth.adminEyebrow")}</span>
          <h1>{t(locale, "auth.adminTitle")}</h1>
          <p>{t(locale, "auth.adminCopy")}</p>
        </section>
        <section className="card">
          <h2>{t(locale, "auth.adminCredentials")}</h2>
          <p className="muted">
            {isPreview
              ? "Login requires a live Supabase database. Use the links above to access admin pages in preview mode."
              : t(locale, "auth.adminCredentialsCopy")}
          </p>
          {!isPreview && (
            <Suspense>
              <LoginForm admin locale={locale} />
            </Suspense>
          )}
          {isPreview && (
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <Link className="button primary" href="/owner">👑 Owner dashboard</Link>
              <Link className="button dark" href="/admin">Admin dashboard</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
