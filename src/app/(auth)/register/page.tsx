import Link from "next/link";
import { GarrinchaLogo } from "@/components/GarrinchaLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RegisterForm } from "@/components/AuthForms";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoCenters, hasDatabaseConfig } from "@/lib/ui-demo-data";

export const metadata = { title: "Register — GARRINCHA World Cup Pronostiek 2026" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; session?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const activationCode = params.code ?? params.session ?? null;

  // Fetch centers for direct registration
  const centers = hasDatabaseConfig()
    ? await prisma.garrinchaCenter
        .findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
        .catch(() => demoCenters)
    : demoCenters;

  const hasCode = Boolean(activationCode);

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* ── Logo + language switcher ── */}
        <div className="auth-logo">
          <GarrinchaLogo height={22} variant="black" />
          <LanguageSwitcher locale={locale} />
        </div>

        {/* ── QR / center-detected badge ── */}
        {hasCode && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--green-tint)",
              border: "1px solid var(--green-light)",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="#fff"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span style={{ fontSize: 13, color: "var(--green-deep)", fontWeight: 600 }}>
              GARRINCHA Center · QR activated
            </span>
          </div>
        )}

        {/* ── Heading ── */}
        <h1 className="auth-title">
          {hasCode ? t(locale, "reg_title") : t(locale, "register.directTitle")}
        </h1>
        <p className="auth-sub">{t(locale, "reg_sub")}</p>

        {/* ── Registration form ── */}
        <RegisterForm
          activationCode={activationCode}
          centers={centers}
          locale={locale}
        />

        {/* ── Footer link ── */}
        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 13.5,
            color: "var(--text-3)",
          }}
        >
          {t(locale, "register.alreadyHaveLink")}{" "}
          <Link
            href="/login"
            style={{ color: "var(--green)", fontWeight: 700 }}
          >
            {t(locale, "register.requestLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
