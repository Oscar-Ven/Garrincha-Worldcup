"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/translations";
import { ArrowRight, CheckCircle } from "lucide-react";

interface Center {
  id: string;
  name: string;
  city: string;
}

interface Props {
  locale: Locale;
  centers: Center[];
  activationCode?: string;
}

export default function RegisterForm({ locale, centers, activationCode }: Props) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    nickname: "",
    phoneNumber: "",
    nationality: "",
    centerId: "",
    termsAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const hasActivationCode = Boolean(activationCode);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.termsAccepted) {
      setError(t(locale, "err_consent"));
      return;
    }
    if (!hasActivationCode && !form.centerId) {
      setError(t(locale, "form.selectCenter"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, string | boolean> = {
        fullName: form.fullName,
        email: form.email,
        nickname: form.nickname,
        phoneNumber: form.phoneNumber,
        termsAccepted: form.termsAccepted,
      };
      if (form.nationality) body.nationality = form.nationality;
      if (hasActivationCode) body.activationCode = activationCode!;
      else body.centerId = form.centerId;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed.");

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="border border-lime-400/30 bg-lime-400/5 p-10 text-center">
        <CheckCircle className="w-12 h-12 text-lime-400 mx-auto mb-5" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
          {t(locale, "auth.registrationComplete")}
        </h2>
        <p className="text-zinc-400 leading-relaxed max-w-md mx-auto">
          {t(locale, "auth.accessLinkSent")}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          label={t(locale, "f_name")}
          type="text"
          value={form.fullName}
          onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
        />
        <Field
          label={t(locale, "f_email")}
          type="email"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          required
          autoComplete="email"
        />
        <div>
          <Field
            label={t(locale, "f_nick")}
            type="text"
            value={form.nickname}
            onChange={(v) => setForm((f) => ({ ...f, nickname: v }))}
            required
            minLength={2}
            maxLength={50}
            autoComplete="username"
          />
          <p className="mt-1.5 text-xs text-zinc-600">{t(locale, "f_nick_hint")}</p>
        </div>
        <Field
          label={t(locale, "f_phone")}
          type="tel"
          value={form.phoneNumber}
          onChange={(v) => setForm((f) => ({ ...f, phoneNumber: v }))}
          required
          minLength={6}
          maxLength={32}
          autoComplete="tel"
        />
      </div>

      {/* Center selection */}
      {hasActivationCode ? (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            {t(locale, "form.center")}
          </label>
          <input
            type="text"
            value={`QR Code: ${activationCode}`}
            disabled
            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 text-zinc-400 text-sm cursor-not-allowed"
          />
        </div>
      ) : (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            {t(locale, "form.center")}
          </label>
          <select
            value={form.centerId}
            onChange={(e) => setForm((f) => ({ ...f, centerId: e.target.value }))}
            required
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-lime-400 transition-colors appearance-none"
          >
            <option value="">{t(locale, "form.selectCenter")}</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={form.termsAccepted}
            onChange={(e) => setForm((f) => ({ ...f, termsAccepted: e.target.checked }))}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
              form.termsAccepted
                ? "bg-lime-400 border-lime-400"
                : "bg-transparent border-zinc-600 group-hover:border-zinc-400"
            }`}
          >
            {form.termsAccepted && (
              <svg className="w-3 h-3 text-zinc-950" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm text-zinc-400 leading-relaxed">
          {t(locale, "form.termsAccepted")}
        </span>
      </label>

      {error && (
        <div className="px-4 py-3 border border-red-900 bg-red-900/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-4 bg-lime-400 text-zinc-950 font-black uppercase tracking-widest text-sm hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)]"
      >
        {loading ? (
          t(locale, "form.creating")
        ) : (
          <>
            {t(locale, "create_account")}
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
  minLength,
  maxLength,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-lime-400 transition-colors"
      />
    </div>
  );
}
