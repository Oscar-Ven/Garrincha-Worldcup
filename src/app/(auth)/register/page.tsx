import { GarrinchaLogo } from "@/components/GarrinchaLogo";
import { RegisterForm } from "@/components/AuthForms";
import { DataModeNotice } from "@/components/DataModeNotice";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";

// Center shield badge (SVG) — purely decorative indicator
function CenterActivatedBadge({ centerName }: { centerName: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 14px", borderRadius: 14, background: "rgba(95,224,144,0.07)", border: "1px solid rgba(95,224,144,0.22)" }}>
      <div style={{ width: 30, height: 33, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 40 44" width="30" height="33" style={{ position: "absolute", inset: 0 }}>
          <path d="M20 1 L38 7 V22 C38 33 30 40 20 43 C10 40 2 33 2 22 V7 Z" fill="#5FE090" fillOpacity="0.16" stroke="#5FE090" strokeWidth="1.6" />
        </svg>
        <span style={{ position: "relative", fontFamily: "var(--f-disp)", fontWeight: 900, fontStyle: "italic", fontSize: 10, color: "#5FE090" }}>✓</span>
      </div>
      <div style={{ flex: 1 }}>
        <div className="label" style={{ fontSize: 9, color: "var(--green)" }}>QR activated · Center detected</div>
        <div className="disp" style={{ fontSize: 17, color: "var(--ink)" }}>{centerName}</div>
      </div>
    </div>
  );
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; session?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const activationCode = params.code ?? params.session ?? null;

  return (
    <div className="auth-page g-scroll" style={{ overflowY: "auto", minHeight: "100vh" }}>
      {/* header */}
      <div className="auth-header">
        <GarrinchaLogo height={18} />
        <span className="chip chip-green">✓ {t(locale, "auth.registerFree")}</span>
      </div>

      <DataModeNotice locale={locale} />

      {activationCode && (
        <CenterActivatedBadge centerName="GARRINCHA Center" />
      )}

      <div className="kick" style={{ fontSize: 13, color: "var(--green)", marginBottom: 8 }}>{t(locale, "register.eyebrow")}</div>
      <h1 className="auth-title">{t(locale, "reg_title")}</h1>
      <p className="auth-sub">{t(locale, "reg_sub")}</p>

      <RegisterForm activationCode={activationCode} locale={locale} />

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: "var(--ink-dim)" }}>
        {t(locale, "auth.already")}{" "}
        <a href="/login" style={{ color: "var(--green)", fontWeight: 700 }}>{t(locale, "nav.login")}</a>
      </p>
    </div>
  );
}
