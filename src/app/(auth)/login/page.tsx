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
          <strong>Preview mode —</strong> login requires a live Supabase database.
          Browse the <Link href="/dashboard" style={{ fontWeight: 700, textDecoration: "underline" }}>dashboard</Link> and <Link href="/leaderboards" style={{ fontWeight: 700, textDecoration: "underline" }}>leaderboards</Link> directly — no login needed in preview.
        </div>
      )}
      <div className="auth-shell">
        <section className="auth-panel">
          <span className="eyebrow">{t(locale, "auth.loginEyebrow")}</span>
          <h1>{t(locale, "auth.loginTitle")}</h1>
          <p>Enter your email to receive a new personal access link.</p>
          <p>Continue remotely anytime with your email link.</p>
          <p><Link href="/register">{t(locale, "auth.create")}</Link></p>
        </section>
        <section className="card">
          {isPreview ? (
            <div style={{ display: "grid", gap: 12 }}>
              <p className="muted">Login is disabled in preview mode. Connect Supabase to enable player accounts.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="button primary" href="/dashboard">View dashboard</Link>
                <Link className="button" href="/leaderboards">View leaderboards</Link>
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
