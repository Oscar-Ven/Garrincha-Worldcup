"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw, Zap, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  today: string;
  currentCode: string | null;
  claimCount: number;
  expiresAt: string | null;
}

export default function DailyBonusAdminClient({ today, currentCode, claimCount, expiresAt }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(currentCode ?? "");
  const [loading, setLoading] = useState<"generate" | "set" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [liveCode, setLiveCode] = useState(currentCode);
  const [liveClaims, setLiveClaims] = useState(claimCount);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading("generate");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/daily-bonus-code/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate code.");
      setLiveCode(data.code);
      setCode(data.code);
      setLiveClaims(0);
      setMessage({ ok: true, text: `New code generated: ${data.code}` });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Error." });
    } finally {
      setLoading(null);
    }
  }

  async function handleSetCode() {
    if (!code.trim()) return;
    setLoading("set");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/daily-bonus-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to set code.");
      setLiveCode(data.code);
      setCode(data.code);
      setLiveClaims(0);
      setMessage({ ok: true, text: `Code set to: ${data.code}` });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Error." });
    } finally {
      setLoading(null);
    }
  }

  async function handleCopy() {
    if (!liveCode) return;
    await navigator.clipboard.writeText(liveCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Daily Attendance Bonus</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Generate one code per day and share it with your center managers. Players enter it at{" "}
          <span className="font-mono text-lime-400">/daily-bonus</span> to claim +3 points.
        </p>
      </div>

      {/* Today's code card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-lime-400" />
            <h2 className="font-semibold text-white">Today&apos;s code</h2>
            <span className="text-xs text-zinc-500 font-mono">{today}</span>
          </div>
          <span className="text-xs text-zinc-400">{liveClaims} claim{liveClaims !== 1 ? "s" : ""} so far</span>
        </div>

        {liveCode ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl border border-lime-400/30 bg-lime-400/10 px-5 py-4">
              <span className="font-mono text-3xl font-bold tracking-[0.3em] text-lime-300">{liveCode}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
            >
              <Copy className="h-4 w-4" />
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 px-5 py-4 text-sm text-zinc-500">
            No code set for today yet. Generate one below.
          </div>
        )}

        {expiresAt && (
          <p className="text-xs text-zinc-500">
            Expires at end of today (Brussels time) — {new Date(expiresAt).toLocaleTimeString("en-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" })} Brussels
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Auto-generate */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-white">Auto-generate</h3>
            <p className="mt-1 text-sm text-zinc-400">Creates a random 6-character code for today and replaces any existing one.</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-lime-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading === "generate" ? "animate-spin" : ""}`} />
            {loading === "generate" ? "Generating…" : "Generate new code"}
          </button>
        </div>

        {/* Custom code */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-white">Set custom code</h3>
            <p className="mt-1 text-sm text-zinc-400">Enter a memorable code to use instead (max 16 characters).</p>
          </div>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. KORTRIJK"
              maxLength={16}
              disabled={loading !== null}
              className="flex-1 min-w-0 rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm font-mono uppercase tracking-widest text-white placeholder-zinc-600 outline-none focus:border-lime-400 disabled:opacity-50"
            />
            <button
              onClick={handleSetCode}
              disabled={!code.trim() || loading !== null}
              className="rounded-xl bg-zinc-700 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-600 disabled:opacity-50 transition-colors"
            >
              {loading === "set" ? "Saving…" : "Set"}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${message.ok ? "bg-lime-400/10 text-lime-300 border border-lime-400/20" : "bg-red-500/10 text-red-300 border border-red-500/20"}`}>
          {message.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
        <strong className="text-zinc-300">How it works:</strong> Generate one code per day → share it with all center managers → players enter it at <span className="font-mono text-lime-400">/daily-bonus</span> → each player gets +3 points once per day. The code expires automatically at midnight Brussels time.
      </div>
    </div>
  );
}
