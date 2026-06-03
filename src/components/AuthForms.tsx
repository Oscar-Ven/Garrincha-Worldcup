"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { type Locale, t } from "@/lib/translations";

type Status = {
  type: "error" | "success";
  text: string;
} | null;

async function submitJson(url: string, form: HTMLFormElement) {
  const data = Object.fromEntries(new FormData(form));
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });

  const body = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(body.error || "Request failed.");
  }
}

export function RegisterForm({ locale, activationCode }: { locale: Locale; activationCode: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  if (!activationCode) {
    return (
      <div className="checkin-gate">
        <div className="checkin-card">
          <span className="eyebrow">First activation required</span>
          <h2>Scan the QR code at a GARRINCHA Center</h2>
          <p className="muted">Please visit a GARRINCHA Center and scan the QR code to start registration.</p>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <p className="message success">
        Registration complete! Your personal access link has been sent to {registeredEmail}. Check your email — you can use that link anytime to continue remotely.
      </p>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value ?? "";
    try {
      await submitJson("/api/auth/register", form);
      setRegisteredEmail(email);
      setRegistered(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 3000);
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Registration failed." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {status ? <p className={`message ${status.type}`}>{status.text}</p> : null}
      <input type="hidden" name="activationCode" value={activationCode} />
      <div className="form-grid">
        <label className="field">
          <span>{t(locale, "form.email")}</span>
          <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </label>
        <label className="field">
          <span>{t(locale, "form.fullName")}</span>
          <input name="fullName" type="text" autoComplete="name" required />
        </label>
        <label className="field">
          <span>{t(locale, "form.nickname")}</span>
          <input name="nickname" type="text" autoComplete="nickname" placeholder="Your leaderboard name" required />
        </label>
        <label className="field">
          <span>{t(locale, "form.phone")}</span>
          <input name="phoneNumber" type="tel" autoComplete="tel" placeholder="+32 ..." required />
        </label>
        <label className="field">
          <span>{t(locale, "form.nationality")}</span>
          <input name="nationality" autoComplete="country-name" placeholder="Belgium" />
        </label>
        <label className="field full checkbox-field">
          <input name="termsAccepted" type="checkbox" value="true" required />
          <span>{t(locale, "form.termsAccepted")}</span>
        </label>
      </div>
      <button className="button primary" type="submit" disabled={pending}>
        {pending ? t(locale, "form.creating") : t(locale, "form.createAccount")}
      </button>
    </form>
  );
}

export function LoginForm({ admin = false, locale }: { admin?: boolean; locale: Locale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      await submitJson(admin ? "/api/admin/login" : "/api/auth/login", event.currentTarget);
      if (admin) {
        router.push(searchParams.get("next") || "/admin");
        router.refresh();
      } else {
        setMagicLinkSent(true);
      }
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Login failed." });
    } finally {
      setPending(false);
    }
  }

  if (!admin && magicLinkSent) {
    return <p className="message success">Check your email for your access link.</p>;
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {status ? <p className={`message ${status.type}`}>{status.text}</p> : null}
      <label className="field">
        <span>{admin ? t(locale, "form.email") : "Enter your email to receive a new access link"}</span>
        <input name="email" type="email" autoComplete="email" placeholder={admin ? "admin@garrincha.local" : "you@example.com"} required />
      </label>
      {admin && (
        <label className="field">
          <span>{t(locale, "form.password")}</span>
          <input name="password" type="password" autoComplete="current-password" placeholder="Your password" required />
        </label>
      )}
      <button className="button primary" type="submit" disabled={pending}>
        {pending ? t(locale, "form.signingIn") : admin ? t(locale, "form.adminLogin") : t(locale, "nav.login")}
      </button>
    </form>
  );
}
