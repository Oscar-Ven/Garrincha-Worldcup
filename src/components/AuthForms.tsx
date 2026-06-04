"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Locale, t } from "@/lib/translations";

type Status = { type: "error" | "success"; text: string } | null;

async function submitJson(url: string, form: HTMLFormElement) {
  const data = Object.fromEntries(new FormData(form));
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(body.error || "Request failed.");
}

// ── Register form ────────────────────────────────────────────────────────────

export function RegisterForm({ locale, activationCode }: { locale: Locale; activationCode: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentErr, setConsentErr] = useState(false);

  if (!activationCode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "40px 0" }}>
        <div style={{ width: 88, height: 88, borderRadius: "50%", background: "rgba(255,90,77,0.12)", border: "2px solid rgba(255,90,77,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, marginBottom: 20 }}>📷</div>
        <h2 className="disp" style={{ fontSize: 28, color: "var(--ink)", marginBottom: 10 }}>{t(locale, "no_qr_title")}</h2>
        <p style={{ fontSize: 14, color: "var(--ink-dim)", lineHeight: 1.5, maxWidth: 280 }}>{t(locale, "no_qr_body")}</p>
      </div>
    );
  }

  if (registered) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
          <div style={{ width: 96, height: 96, borderRadius: 24, background: "var(--surface)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, boxShadow: "var(--sh-2)" }}>✉️</div>
          <div style={{ position: "absolute", right: -8, bottom: -8, width: 38, height: 38, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--sh-green)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#06210F" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
        <h2 className="disp" style={{ fontSize: 28, color: "var(--ink)", marginBottom: 8 }}>{t(locale, "auth.registrationComplete")}</h2>
        <p style={{ fontSize: 14, color: "var(--ink-dim)" }}>{t(locale, "auth.accessLinkSent")}</p>
        <div className="disp" style={{ fontSize: 16, color: "var(--green)", marginTop: 4 }}>{registeredEmail}</div>
        <div style={{ marginTop: 20, width: "100%", padding: "14px 16px", borderRadius: 14, background: "var(--surface)", border: "1px dashed var(--line-2)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--green-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🔗</div>
          <div style={{ textAlign: "left", overflow: "hidden" }}>
            <div className="label" style={{ fontSize: 9, color: "var(--green)" }}>Your permanent access link</div>
            <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 12, color: "var(--ink-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>worldcup-garrincha.com/auth/access?token=…</div>
          </div>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) { setConsentErr(true); return; }
    setConsentErr(false);
    setPending(true);
    setStatus(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value ?? "";
    try {
      await submitJson("/api/auth/register", form);
      setRegisteredEmail(email);
      setRegistered(true);
      setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 3000);
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Registration failed." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {status && (
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,90,77,0.10)", border: "1px solid rgba(255,90,77,0.3)", color: "var(--live)", fontSize: 13.5, fontWeight: 600 }}>
          ⚠ {status.text}
        </div>
      )}
      <input type="hidden" name="activationCode" value={activationCode} />
      {(["name", "email", "nick", "phone"] as const).map((key) => {
        const labelMap = { name: t(locale, "f_name"), email: t(locale, "f_email"), nick: t(locale, "f_nick"), phone: t(locale, "f_phone") };
        const typeMap = { name: "text", email: "email", nick: "text", phone: "tel" };
        const nameMap = { name: "fullName", email: "email", nick: "nickname", phone: "phoneNumber" };
        const autoMap = { name: "name", email: "email", nick: "nickname", phone: "tel" };
        return (
          <div key={key}>
            <label className="field-label" htmlFor={`field-${key}`}>{labelMap[key]}</label>
            <input
              id={`field-${key}`}
              className="field"
              type={typeMap[key]}
              name={nameMap[key]}
              autoComplete={autoMap[key]}
              placeholder={labelMap[key]}
              required
            />
            {key === "nick" && (
              <p className="field-hint">{t(locale, "f_nick_hint")}</p>
            )}
          </div>
        );
      })}

      {/* Consent */}
      <button type="button" className="consent-row" onClick={() => { setConsent(!consent); setConsentErr(false); }}>
        <div className={`consent-box${consent ? " checked" : ""}${consentErr ? " error" : ""}`}>
          {consent && (
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" stroke="#06210F" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="consent-text">{t(locale, "consent")}</span>
      </button>
      {consentErr && <div className="field-err-msg">⚠ {t(locale, "err_consent")}</div>}
      <input type="hidden" name="termsAccepted" value={consent ? "true" : "false"} />

      <button className="btn btn-green btn-lg" type="submit" disabled={pending}>
        {pending ? t(locale, "form.creating") : t(locale, "create_account")}
      </button>
    </form>
  );
}

// ── Login form ───────────────────────────────────────────────────────────────

export function LoginForm({ admin = false, locale }: { admin?: boolean; locale: Locale }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      await submitJson(admin ? "/api/admin/login" : "/api/auth/login", e.currentTarget);
      if (admin) {
        router.push("/admin");
        router.refresh();
      } else {
        setSent(true);
      }
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Login failed." });
    } finally {
      setPending(false);
    }
  }

  if (!admin && sent) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
        <div className="disp" style={{ fontSize: 22, color: "var(--ink)", marginBottom: 8 }}>{t(locale, "auth.requestLinkSent")}</div>
      </div>
    );
  }

  return (
    <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={onSubmit}>
      {status && (
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,90,77,0.10)", border: "1px solid rgba(255,90,77,0.3)", color: "var(--live)", fontSize: 13.5, fontWeight: 600 }}>
          ⚠ {status.text}
        </div>
      )}
      <div>
        <label className="field-label" htmlFor="login-email">
          {admin ? t(locale, "form.email") : t(locale, "auth.loginPanelCopy")}
        </label>
        <input
          id="login-email"
          className="field"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={admin ? "admin@garrincha.be" : "you@example.com"}
          required
        />
      </div>
      {admin && (
        <div>
          <label className="field-label" htmlFor="login-password">{t(locale, "form.password")}</label>
          <input
            id="login-password"
            className="field"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>
      )}
      <button className="btn btn-green btn-lg" type="submit" disabled={pending}>
        {pending ? t(locale, "form.signingIn") : admin ? t(locale, "form.adminLogin") : t(locale, "form.sendLink")}
      </button>
    </form>
  );
}
