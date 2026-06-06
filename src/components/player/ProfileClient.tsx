"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";

type ProfileClientProps = {
  avatarUrl: string | null;
};

export default function ProfileClient({ avatarUrl }: ProfileClientProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Avatar upload failed.");
      setCurrentAvatar(payload.avatarUrl ?? null);
      setMessage("Avatar updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Avatar upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAvatar() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/user/avatar", { method: "DELETE" });
      if (!response.ok) throw new Error("Avatar could not be removed.");
      setCurrentAvatar(null);
      setMessage("Avatar removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Avatar could not be removed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-[28px] border border-white/8 bg-black/20 p-5">
      <div>
        <h2 className="text-base font-semibold text-white">Profile photo</h2>
        <p className="mt-1 text-sm text-zinc-400">Avatar upload is supported. Other profile fields are currently read-only.</p>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05]">
          {currentAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentAvatar} alt="Player avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">No avatar</span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-2xl bg-lime-400 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
            <span>{busy ? "Working..." : "Upload avatar"}</span>
          </button>
          {currentAvatar && (
            <button
              type="button"
              disabled={busy}
              onClick={removeAvatar}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-zinc-200 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              <span>Remove</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadAvatar(file);
            }}
          />
        </div>
      </div>

      {message && <div className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">{message}</div>}
    </div>
  );
}