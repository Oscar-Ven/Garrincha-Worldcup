"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Locale, t } from "@/lib/translations";

type UserOption = { id: string; email: string; displayName: string | null };

async function postJson(url: string, form: HTMLFormElement) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
  const body = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(body.error || "Request failed.");
}

async function patchJson(url: string, form: HTMLFormElement) {
  const response = await fetch(url, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
  const body = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(body.error || "Request failed.");
}

const inputStyle = { background: "var(--surface-2)", border: "1.5px solid var(--line-2)", color: "var(--ink)", fontFamily: "var(--f-body)", fontSize: 15, padding: "0 14px", outline: "none", borderRadius: 10 } as React.CSSProperties;

export function FinalScoreForm({ matchId, homeScore, awayScore, locale }: { matchId: string; homeScore?: number | null; awayScore?: number | null; locale: Locale }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus(null);
    try { await postJson(`/api/admin/matches/${matchId}/score`, e.currentTarget); setStatus("✓ Saved"); router.refresh(); }
    catch (err) { setStatus(err instanceof Error ? err.message : "Error"); }
  }

  return (
    <form style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }} onSubmit={submit}>
      <input aria-label="Home" defaultValue={homeScore ?? ""} min={0} max={30} name="homeScore" required type="number"
        style={{ ...inputStyle, width: 64, height: 44, fontFamily: "var(--f-num)", fontWeight: 800, fontSize: 20, textAlign: "center" }} />
      <span className="num" style={{ fontSize: 20, color: "var(--ink-faint)" }}>:</span>
      <input aria-label="Away" defaultValue={awayScore ?? ""} min={0} max={30} name="awayScore" required type="number"
        style={{ ...inputStyle, width: 64, height: 44, fontFamily: "var(--f-num)", fontWeight: 800, fontSize: 20, textAlign: "center" }} />
      <button type="submit" className="abtn abtn-green">{t(locale, "admin.saveScore")}</button>
      {status && <span style={{ fontSize: 12.5, color: "var(--green)", fontWeight: 700 }}>{status}</span>}
    </form>
  );
}

export function BonusForm({ users, locale }: { users: UserOption[]; locale: Locale }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus(null);
    try { await postJson("/api/admin/bonus", e.currentTarget); setStatus("✓ Bonus awarded"); (e.target as HTMLFormElement).reset(); router.refresh(); }
    catch (err) { setStatus(err instanceof Error ? err.message : "Error"); }
  }

  return (
    <form style={{ display: "flex", flexDirection: "column", gap: 14 }} onSubmit={submit}>
      <div>
        <label className="label" style={{ fontSize: 10.5, color: "var(--ink-dim)", display: "block", marginBottom: 8 }}>{t(locale, "form.user")}</label>
        <select name="userId" required style={{ ...inputStyle, width: "100%", height: 50, borderRadius: 12, fontSize: 14 }}>
          <option value="">{t(locale, "admin.selectUser")}</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.displayName || u.email}</option>)}
        </select>
      </div>
      <div>
        <label className="label" style={{ fontSize: 10.5, color: "var(--ink-dim)", display: "block", marginBottom: 8 }}>{t(locale, "form.points")}</label>
        <input name="points" type="number" min={-100} max={100} required
          style={{ ...inputStyle, width: 120, height: 50, borderRadius: 12, fontFamily: "var(--f-num)", fontWeight: 800, fontSize: 18 }} />
      </div>
      <div>
        <label className="label" style={{ fontSize: 10.5, color: "var(--ink-dim)", display: "block", marginBottom: 8 }}>{t(locale, "form.reason")}</label>
        <input name="reason" maxLength={240} placeholder="Bonus reason…" required
          style={{ ...inputStyle, width: "100%", height: 50, borderRadius: 12 }} />
      </div>
      <button type="submit" className="abtn abtn-green" style={{ alignSelf: "flex-start" }}>🎁 {t(locale, "admin.awardButton")}</button>
      {status && <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 700 }}>{status}</span>}
    </form>
  );
}

export function CheckInCodeForm({ centerId, initialCode, initialExpiresAt, locale }: { centerId: string; initialCode: string | null; initialExpiresAt: string | null; locale: Locale }) {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(initialCode);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setPending(true); setError(null);
    const res = await fetch("/api/admin/checkin-code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ centerId }) });
    const body = (await res.json()) as { code?: string; expiresAt?: string; error?: string };
    setPending(false);
    if (!res.ok) { setError(body.error ?? "Could not generate code."); return; }
    setCode(body.code ?? null); setExpiresAt(body.expiresAt ?? null); router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
      {code ? (
        <div>
          <div style={{ background: "var(--bg-2)", padding: 20, borderRadius: 12, fontFamily: "var(--f-disp)", fontStyle: "italic", fontWeight: 900, fontSize: "clamp(2.4rem,10vw,4rem)", color: "var(--green)", letterSpacing: "0.18em", textAlign: "center" }}>
            {code}
          </div>
          {expiresAt && (
            <p className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 8 }}>
              {t(locale, "admin.checkinExpires")}{" "}
              {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(expiresAt))}
            </p>
          )}
        </div>
      ) : (
        <p className="muted">{t(locale, "admin.checkinNone")}</p>
      )}
      <button className="abtn abtn-green" style={{ alignSelf: "flex-start" }} disabled={pending} onClick={generate} type="button">
        🔄 {pending ? t(locale, "admin.checkinGenerating") : t(locale, "admin.checkinGenerate")}
      </button>
      {error && <p style={{ fontSize: 12, color: "var(--live)", fontWeight: 700 }}>{error}</p>}
    </div>
  );
}

export function UserRoleForm({ userId, role, disabled = false, locale }: { userId: string; role: "USER" | "ADMIN" | "CENTER_ADMIN" | "SUPER_ADMIN"; disabled?: boolean; locale: Locale }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus(null);
    try { await patchJson(`/api/admin/users/${userId}/role`, e.currentTarget); setStatus(t(locale, "admin.roleSaved")); router.refresh(); }
    catch (err) { setStatus(err instanceof Error ? err.message : "Error"); }
  }

  return (
    <form style={{ display: "flex", alignItems: "center", gap: 8 }} onSubmit={submit}>
      <label className="sr-only" htmlFor={`role-${userId}`}>{t(locale, "admin.role")}</label>
      <select id={`role-${userId}`} name="role" defaultValue={role} disabled={disabled}
        style={{ ...inputStyle, height: 38, borderRadius: 9, fontSize: 13 }}>
        <option value="USER">{t(locale, "admin.roleUser")}</option>
        <option value="ADMIN">{t(locale, "admin.roleAdmin")}</option>
        <option value="CENTER_ADMIN">{t(locale, "admin.roleCenterAdmin")}</option>
        <option value="SUPER_ADMIN">{t(locale, "admin.roleSuperAdmin")}</option>
      </select>
      <button type="submit" className="abtn abtn-ghost" disabled={disabled}>{t(locale, "admin.updateRole")}</button>
      {status && <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 700 }}>{status}</span>}
    </form>
  );
}
