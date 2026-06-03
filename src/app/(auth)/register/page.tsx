import Link from "next/link";
import { RegisterForm } from "@/components/AuthForms";
import { DataModeNotice } from "@/components/DataModeNotice";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; session?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const activationCode = params.code ?? params.session ?? null;

  return (
    <main className="page">
      <DataModeNotice locale={locale} />
      <div className="auth-shell">
        <section className="auth-panel">
          <span className="eyebrow">Free registration</span>
          <h1>Register for free</h1>
          <p>Scan the QR code at a GARRINCHA Center, register for free, and receive your personal access link by email.</p>
          <div className="mini-steps">
            <span>1. Scan QR</span>
            <span>2. Register free</span>
            <span>3. Play remotely</span>
          </div>
          <p>
            <Link href="/login">{t(locale, "auth.already")}</Link>
          </p>
        </section>
        <section className="card">
          <h2>{t(locale, "auth.details")}</h2>
          <p className="muted">{t(locale, "auth.detailsCopy")}</p>
          <RegisterForm activationCode={activationCode} locale={locale} />
        </section>
      </div>
    </main>
  );
}
