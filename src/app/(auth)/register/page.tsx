import Image from "next/image";
import Link from "next/link";
import { RegisterForm } from "@/components/AuthForms";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { demoCenters, hasDatabaseConfig } from "@/lib/ui-demo-data";

export const metadata = { title: "Register — GARRINCHA World Cup 2026" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; session?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const activationCode = params.code ?? params.session ?? null;

  const centers = hasDatabaseConfig()
    ? await prisma.garrinchaCenter
        .findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
        .catch(() => demoCenters)
    : demoCenters;

  const hasCode = Boolean(activationCode);

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Logo row ── */}
        <div className="auth-logo-row">
          <div className="auth-logo-img">
            <Image
              src="/images/player-medal.png"
              alt="GARRINCHA"
              width={42}
              height={42}
            />
          </div>
          <div>
            <div style={{ fontSize: ".9375rem", fontWeight: 800, color: "var(--g-dark)", letterSpacing: "-.01em" }}>
              GARRINCHA
            </div>
            <div style={{ fontSize: ".625rem", fontWeight: 600, color: "var(--gold)", letterSpacing: ".08em", textTransform: "uppercase" }}>
              World Cup 2026
            </div>
          </div>
        </div>

        {/* ── QR activated badge ── */}
        {hasCode && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 10, marginBottom: 16,
            background: "var(--g-pale)", border: "1px solid var(--g-border)",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "var(--g-main)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 13, color: "var(--g-dark)", fontWeight: 600 }}>
              GARRINCHA Center · QR activated
            </span>
          </div>
        )}

        {/* ── Heading ── */}
        <h1 className="auth-title">
          {hasCode ? t(locale, "reg_title") : t(locale, "register.directTitle")}
        </h1>
        <p style={{ fontSize: ".875rem", color: "var(--text-3)", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
          {t(locale, "reg_sub")}
        </p>

        {/* ── Form ── */}
        <RegisterForm
          activationCode={activationCode}
          centers={centers}
          locale={locale}
        />

        {/* ── Footer ── */}
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13.5, color: "var(--text-3)" }}>
          {t(locale, "register.alreadyHaveLink")}{" "}
          <Link href="/login" style={{ color: "var(--g-main)", fontWeight: 700 }}>
            {t(locale, "register.requestLink")}
          </Link>
        </p>

      </div>
    </div>
  );
}
