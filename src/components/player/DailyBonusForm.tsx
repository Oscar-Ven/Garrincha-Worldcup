"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

export default function DailyBonusForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; points?: number } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/player/daily-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      setResult({ ok: res.ok && data.ok, message: data.message ?? data.error ?? "Unknown error.", points: data.pointsAwarded });
      if (res.ok && data.ok && data.pointsAwarded > 0) {
        setCode("");
      }
    } catch {
      setResult({ ok: false, message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">
          Daily attendance code
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. A3BX7R"
          maxLength={16}
          disabled={loading}
          autoComplete="off"
          className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm font-mono uppercase tracking-widest text-white placeholder-zinc-600 focus:border-lime-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {result && (
        <div
          role="alert"
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${
            result.ok
              ? "border border-lime-400/30 bg-lime-400/10 text-lime-300"
              : "border border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {result.ok && result.points && result.points > 0 ? `+${result.points} points — ` : ""}
          {result.message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Zap className="h-4 w-4" />
        {loading ? "Claiming…" : "Claim +3 points"}
      </button>
    </form>
  );
}
