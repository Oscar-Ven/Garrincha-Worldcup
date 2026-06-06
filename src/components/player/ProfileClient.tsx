"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, Save } from "lucide-react";

type ProfileClientProps = {
  avatarUrl:   string | null;
  fullName:    string;
  nickname:    string;
  nationality: string;
  phoneNumber: string;
  email:       string;
};

export default function ProfileClient({
  avatarUrl,
  fullName:    initialFullName,
  nickname:    initialNickname,
  nationality: initialNationality,
  phoneNumber: initialPhoneNumber,
  email,
}: ProfileClientProps) {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Avatar state
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const [avatarMsg, setAvatarMsg]         = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy]       = useState(false);

  // Profile fields state
  const [fullName,    setFullName]    = useState(initialFullName);
  const [nickname,    setNickname]    = useState(initialNickname);
  const [nationality, setNationality] = useState(initialNationality);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [profileMsg,  setProfileMsg]  = useState<string | null>(null);
  const [profileOk,   setProfileOk]   = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);

  async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Avatar upload failed.");
      setCurrentAvatar(payload.avatarUrl ?? null);
      setAvatarMsg("Avatar updated.");
    } catch (err) {
      setAvatarMsg(err instanceof Error ? err.message : "Avatar upload failed.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      const res = await fetch("/api/user/avatar", { method: "DELETE" });
      if (!res.ok) throw new Error("Avatar could not be removed.");
      setCurrentAvatar(null);
      setAvatarMsg("Avatar removed.");
    } catch (err) {
      setAvatarMsg(err instanceof Error ? err.message : "Avatar could not be removed.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileBusy(true);
    setProfileMsg(null);
    setProfileOk(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, nickname, nationality, phoneNumber }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Could not save profile.");
      setProfileOk(true);
      setProfileMsg("Profile saved.");
      router.refresh();
    } catch (err) {
      setProfileOk(false);
      setProfileMsg(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setProfileBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-lime-400/50 focus:outline-none focus:ring-0 disabled:opacity-50";

  return (
    <div className="space-y-4">
      {/* ── Avatar ─────────────────────────────────────────────────────── */}
      <div className="rounded-[28px] border border-white/8 bg-black/20 p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">Profile photo</h2>
        </div>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
            {currentAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentAvatar} alt="Player avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">No photo</span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={avatarBusy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-2xl bg-lime-400 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60"
            >
              <Camera className="h-4 w-4" />
              {avatarBusy ? "Working…" : "Upload photo"}
            </button>
            {currentAvatar && (
              <button
                type="button"
                disabled={avatarBusy}
                onClick={removeAvatar}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-sm font-semibold text-zinc-200 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
            />
          </div>
        </div>

        {avatarMsg && (
          <div className="rounded-2xl bg-white/4 px-4 py-3 text-sm text-zinc-300">{avatarMsg}</div>
        )}
      </div>

      {/* ── Editable profile fields ─────────────────────────────────────── */}
      <form onSubmit={saveProfile} className="rounded-[28px] border border-white/8 bg-black/20 p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">Personal details</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-[0.16em] text-zinc-500">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              maxLength={80}
              disabled={profileBusy}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-[0.16em] text-zinc-500">Nickname</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              minLength={2}
              maxLength={40}
              disabled={profileBusy}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-[0.16em] text-zinc-500">Nationality</label>
            <input
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              maxLength={60}
              disabled={profileBusy}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-[0.16em] text-zinc-500">Phone number</label>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              maxLength={30}
              disabled={profileBusy}
              className={inputClass}
            />
          </div>
        </div>

        {/* Email — read-only, cannot be changed */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-[0.16em] text-zinc-500">Email (cannot be changed)</label>
          <input
            value={email}
            readOnly
            className={`${inputClass} cursor-not-allowed opacity-40`}
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={profileBusy}
            className="inline-flex items-center gap-2 rounded-2xl bg-lime-400 px-5 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {profileBusy ? "Saving…" : "Save changes"}
          </button>
          {profileMsg && (
            <span className={`text-sm ${profileOk ? "text-lime-400" : "text-red-400"}`}>
              {profileMsg}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
