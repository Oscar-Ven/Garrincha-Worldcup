"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface PlayerRow {
  id: string;
  fullName: string;
  nickname: string;
  email: string;
  centerName: string;
}

interface Props {
  currentUserRole: string;
  centerName: string;
  players: PlayerRow[];
}

export default function BonusFormClient({ currentUserRole, centerName, players }: Props) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOwner = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  async function handleAwardBonus(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const ptsNum = parseInt(points, 10);
    if (isNaN(ptsNum) || ptsNum < -100 || ptsNum > 100 || ptsNum === 0) {
      setError("Please award a valid non-zero points score between -100 and +100.");
      setLoading(false);
      return;
    }

    if (reason.trim().length < 3) {
      setError("Please enter a clear mandatory reason with at least 3 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, points: ptsNum, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to award bonus points.");
      }

      setSuccess(`Successfully credited ${ptsNum} points to the competitor.`);
      // Reset form fields
      setUserId("");
      setPoints("");
      setReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record bonus points.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none font-sans">
      {/* Header Panel */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Coins className="w-8 h-8 text-lime-400" />
          Award Bonus Points
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          {isOwner
            ? "Credit manual bonus points to any global campaign competitor."
            : `Credit attendance bonus points strictly to players at ${centerName}.`}
        </p>
      </div>

      {/* Main card */}
      <div className="bg-zinc-900/40 border border-zinc-800 p-8 shadow-2xl backdrop-blur-md">
        <form onSubmit={handleAwardBonus} className="space-y-5">
          {/* Competitor list selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
              Select Competitor
            </label>
            <select
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-lime-400 transition-colors"
            >
              <option value="">Choose a player account...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} (@{p.nickname}) — {p.centerName.replace("GARRINCHA ", "")}
                </option>
              ))}
            </select>
          </div>

          {/* Points Award Score */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
              Bonus Points Amount
            </label>
            <input
              type="number"
              min="-100"
              max="100"
              required
              placeholder="e.g. 5"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-lime-400 transition-colors placeholder-zinc-700"
            />
            <p className="text-[10px] text-zinc-500 mt-1 leading-snug">
              Accepts values from -100 to +100. Positive values award points; negative corrections remove points.
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
              Mandatory Reason
            </label>
            <textarea
              required
              minLength={3}
              maxLength={240}
              placeholder="e.g. Attended June 12 local watch party physically"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-lime-400 transition-colors placeholder-zinc-700 resize-none font-sans"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Minimum 3 characters, maximum 240 characters. Every award is permanently logged for audit trails.
            </p>
          </div>

          {/* Messages info */}
          {error && (
            <div className="flex items-start gap-3 p-3 border border-red-900/50 bg-red-900/10 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-3 border border-lime-400/30 bg-lime-400/10 text-lime-400 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="border-t border-zinc-805 pt-5">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-lime-400 hover:bg-lime-300 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-black uppercase tracking-wider text-xs shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Award...</span>
                </>
              ) : (
                <>
                  <span>Commit Bonus Award</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Guide Note card */}
      <div className="p-4 border border-zinc-800 bg-zinc-950/40 text-xs text-zinc-500 leading-relaxed">
        <span className="text-zinc-400 font-bold uppercase block mb-1">Corporate Audit Disclaimer:</span>
        Manual point awards create an immutable record inside the database PointEvent table including your administrative secure email, points allocation, timestamp, and clear reason, preserving campaign transparency.
      </div>
    </div>
  );
}
