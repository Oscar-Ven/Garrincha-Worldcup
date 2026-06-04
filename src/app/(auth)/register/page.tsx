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
          <span className="eyebrow">{t(locale, "register.eyebrow")}</span>
          <h1>{t(locale, "auth.registerFree")}</h1>
          <p>{t(locale, "auth.registerFreeCopy")}</p>
          <div className="mini-steps">
            <span>{t(locale, "register.step1")}</span>
            <span>{t(locale, "register.step2")}</span>
            <span>{t(locale, "register.step3")}</span>
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
