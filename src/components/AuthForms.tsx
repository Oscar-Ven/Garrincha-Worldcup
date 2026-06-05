"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Locale, t } from "@/lib/translations";

type Status = { type: "error" | "success"; text: string } | null;

type Center = { id: string; name: string };

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

export function RegisterForm({
  locale,
  activationCode,
  centers = [],
}: {
  locale: Locale;
  activationCode: string | null;
  centers?: Center[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentErr, setConsentErr] = useState(false);

  // ── Success state ──────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16, padding: "24px 0" }}>
        {/* Email icon with green check */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <div style={{ width: 88, height: 88, borderRadius: 22, background: "var(--surface)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: "var(--sh-2)" }}>
            ✉️
          </div>
          <div style={{ position: "absolute", right: -10, bottom: -10, width: 36, height: 36, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--sh-green)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" stroke="#111111" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div>
          <h2 className="disp" style={{ fontSize: 26, color: "var(--ink)", margin: "0 0 8px" }}>
            {t(locale, "auth.registrationComplete")}
          </h2>
          <p style={{ fontSize: 14.5, color: "var(--ink-dim)", margin: 0, lineHeight: 1.5 }}>
            {t(locale, "auth.accessLinkSent")}
          </p>
          {registeredEmail && (
            <p className="disp" style={{ fontSize: 16, color: "var(--green)", margin: "8px 0 0" }}>
              {registeredEmail}
            </p>
          )}
        </div>

        {/* Access link preview */}
        <div style={{ width: "100%", padding: "14px 16px", borderRadius: 14, background: "var(--surface)", border: "1px dashed var(--line-2)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--green-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            🔗
          </div>
          <div style={{ textAlign: "left", minWidth: 0 }}>
            <div className="label" style={{ fontSize: 9, color: "var(--green)" }}>Your permanent access link</div>
            <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 12, color: "var(--ink-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              worldcup-garrincha.com/auth/access?token=…
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--ink-faint)", margin: 0, lineHeight: 1.5, maxWidth: 340 }}>
          {t(locale, "auth.accessLinkNote")}
        </p>

        <button
          className="btn btn-green btn-md"
          onClick={() => { router.push("/dashboard"); router.refresh(); }}
          style={{ width: "100%", maxWidth: 320 }}
        >
          {t(locale, "auth.goToDashboard")}
        </button>
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
      setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 5000);
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Registration failed." });
    } finally {
      setPending(false);
    }
  }

  const fields = [
    { key: "name",  label: t(locale, "f_name"),  type: "text",  name: "fullName",     auto: "name",     hint: undefined },
    { key: "email", label: t(locale, "f_email"), type: "email", name: "email",        auto: "email",    hint: undefined },
    { key: "nick",  label: t(locale, "f_nick"),  type: "text",  name: "nickname",     auto: "nickname", hint: t(locale, "f_nick_hint") },
    { key: "phone", label: t(locale, "f_phone"), type: "tel",   name: "phoneNumber",  auto: "tel",      hint: undefined },
  ] as const;

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {/* Error banner */}
      {status && (
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,90,77,0.10)", border: "1px solid rgba(255,90,77,0.3)", color: "var(--live)", fontSize: 13.5, fontWeight: 600 }}>
          ⚠ {status.text}
        </div>
      )}

      {/* Hidden fields */}
      {activationCode && <input type="hidden" name="activationCode" value={activationCode} />}

      {/* ── Center selection (direct registration only) ── */}
      {!activationCode && centers.length > 0 && (
        <div>
          <label className="field-label" htmlFor="field-center">{t(locale, "register.selectCenter")}</label>
          <select
            id="field-center"
            className="field"
            name="centerId"
            required
            style={{ appearance: "auto" }}
          >
            <option value="">{t(locale, "form.selectCenter")}</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="field-hint">{t(locale, "register.selectCenterHint")}</p>
        </div>
      )}

      {/* ── Form fields ── */}
      {fields.map(({ key, label, type, name, auto, hint }) => (
        <div key={key}>
          <label className="field-label" htmlFor={`field-${key}`}>{label}</label>
          <input
            id={`field-${key}`}
            className="field"
            type={type}
            name={name}
            autoComplete={auto}
            placeholder={label}
            required
          />
          {hint && <p className="field-hint">{hint}</p>}
        </div>
      ))}

      {/* ── Consent — real checkbox for screen reader accessibility ── */}
      <label className={`consent-row${consentErr ? " consent-row--error" : ""}`} htmlFor="consent-check">
        <input
          type="checkbox"
          id="consent-check"
          className="consent-checkbox-real"
          checked={consent}
          onChange={(e) => { setConsent(e.target.checked); setConsentErr(false); }}
          aria-describedby={consentErr ? "consent-err-msg" : undefined}
        />
        <span className={`consent-box${consent ? " checked" : ""}${consentErr ? " error" : ""}`} aria-hidden>
          {consent && (
            <svg width="13" height="13" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className="consent-text">{t(locale, "consent")}</span>
      </label>
      {consentErr && <div id="consent-err-msg" className="field-err-msg" role="alert">⚠ {t(locale, "err_consent")}</div>}
      <input type="hidden" name="termsAccepted" value={consent ? "true" : "false"} />

      {/* ── Submit ── */}
      <button className="btn btn-green btn-lg" type="submit" disabled={pending}>
        {pending ? t(locale, "form.creating") : t(locale, "create_account")}
      </button>

      {/* Note about email access */}
      <p style={{ fontSize: 12.5, color: "var(--ink-faint)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
        {t(locale, "register.afterRegNote")}
      </p>
    </form>
  );
}

// ── Login / Access-link form ──────────────────────────────────────────────────

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
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Request failed." });
    } finally {
      setPending(false);
    }
  }

  // ── Sent state ──
  if (!admin && sent) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, padding: "24px 0" }}>
        <div style={{ fontSize: 48 }}>✉️</div>
        <div>
          <div className="disp" style={{ fontSize: 22, color: "var(--ink)", marginBottom: 8 }}>
            Check your email
          </div>
          <p style={{ fontSize: 14, color: "var(--ink-dim)", margin: 0, lineHeight: 1.5, maxWidth: 300 }}>
            {t(locale, "auth.requestLinkSent")}
          </p>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink-faint)", margin: 0, lineHeight: 1.5, maxWidth: 300 }}>
          {t(locale, "auth.accessLinkNote")}
        </p>
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
          {admin ? t(locale, "form.email") : t(locale, "f_email")}
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
        {pending
          ? t(locale, "form.signingIn")
          : admin
            ? t(locale, "form.adminLogin")
            : t(locale, "form.sendLink")}
      </button>

      {!admin && (
        <p style={{ fontSize: 12.5, color: "var(--ink-faint)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
          {t(locale, "auth.accessLinkNote")}
        </p>
      )}
    </form>
  );
}
