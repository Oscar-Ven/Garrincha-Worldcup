"use client";

import { Gift, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Locale, t } from "@/lib/translations";

type UserOption = {
  id: string;
  email: string;
  displayName: string | null;
};

async function postJson(url: string, form: HTMLFormElement) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(form))),
  });
  const body = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(body.error || "Request failed.");
}

async function patchJson(url: string, form: HTMLFormElement) {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(form))),
  });
  const body = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(body.error || "Request failed.");
}

export function FinalScoreForm({
  matchId,
  homeScore,
  awayScore,
  locale,
}: {
  matchId: string;
  homeScore?: number | null;
  awayScore?: number | null;
  locale: Locale;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    try {
      await postJson(`/api/admin/matches/${matchId}/score`, event.currentTarget);
      setStatus("Final score saved");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save score.");
    }
  }

  return (
    <form className="score-form" onSubmit={submit}>
      <input aria-label="Home final score" defaultValue={homeScore ?? ""} min={0} max={30} name="homeScore" required type="number" />
      <span>-</span>
      <input aria-label="Away final score" defaultValue={awayScore ?? ""} min={0} max={30} name="awayScore" required type="number" />
      <button className="button dark" title="Save final score" type="submit">
        <Save size={16} aria-hidden />
        <span>{t(locale, "admin.saveScore")}</span>
      </button>
      {status ? <span className="muted">{status}</span> : null}
    </form>
  );
}

export function BonusForm({ users, locale }: { users: UserOption[]; locale: Locale }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    try {
      await postJson("/api/admin/bonus", event.currentTarget);
      setStatus("Bonus awarded");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not award bonus.");
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label className="field">
        <span>{t(locale, "form.user")}</span>
        <select name="userId" required>
          <option value="">{t(locale, "admin.selectUser")}</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName || user.email}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{t(locale, "form.points")}</span>
        <input name="points" type="number" min={-100} max={100} required />
      </label>
      <label className="field">
        <span>{t(locale, "form.reason")}</span>
        <input name="reason" maxLength={240} placeholder="Example: community challenge winner" required />
      </label>
      <button className="button primary" type="submit">
        <Gift size={16} aria-hidden /> {t(locale, "admin.awardButton")}
      </button>
      {status ? <p className="muted">{status}</p> : null}
    </form>
  );
}

export function CheckInCodeForm({
  centerId,
  initialCode,
  initialExpiresAt,
  locale,
}: {
  centerId: string;
  initialCode: string | null;
  initialExpiresAt: string | null;
  locale: Locale;
}) {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(initialCode);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/admin/checkin-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ centerId }),
    });
    const body = (await response.json()) as { code?: string; expiresAt?: string; error?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.error ?? "Could not generate code.");
      return;
    }
    setCode(body.code ?? null);
    setExpiresAt(body.expiresAt ?? null);
    router.refresh();
  }

  return (
    <div className="checkin-admin-panel">
      {code ? (
        <div className="checkin-code-display-wrapper">
          <div className="checkin-code-display" aria-label="Today's check-in code">
            {code}
          </div>
          {expiresAt ? (
            <p className="muted checkin-expires">
              {t(locale, "admin.checkinExpires")}:{" "}
              {new Intl.DateTimeFormat("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Europe/Brussels",
              }).format(new Date(expiresAt))}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="muted">{t(locale, "admin.checkinNone")}</p>
      )}
      <button className="button primary" disabled={pending} onClick={generate} type="button">
        <RefreshCw size={16} aria-hidden />
        {pending ? t(locale, "admin.checkinGenerating") : t(locale, "admin.checkinGenerate")}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}

export function UserRoleForm({
  userId,
  role,
  disabled = false,
  locale,
}: {
  userId: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  disabled?: boolean;
  locale: Locale;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    try {
      await patchJson(`/api/admin/users/${userId}/role`, event.currentTarget);
      setStatus(t(locale, "admin.roleSaved"));
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update role.");
    }
  }

  return (
    <form className="role-form" onSubmit={submit}>
      <label className="sr-only" htmlFor={`role-${userId}`}>
        {t(locale, "admin.role")}
      </label>
      <select id={`role-${userId}`} name="role" defaultValue={role} disabled={disabled}>
        <option value="USER">{t(locale, "admin.roleUser")}</option>
        <option value="ADMIN">{t(locale, "admin.roleAdmin")}</option>
        <option value="SUPER_ADMIN">{t(locale, "admin.roleSuperAdmin")}</option>
      </select>
      <button className="button dark" type="submit" disabled={disabled}>
        <ShieldCheck size={16} aria-hidden />
        {t(locale, "admin.updateRole")}
      </button>
      {status ? <span className="muted">{status}</span> : null}
    </form>
  );
}
