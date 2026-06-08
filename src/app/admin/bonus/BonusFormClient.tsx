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
    <div className="max-w-2xl space-y-6 font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Coins className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Award Bonus Points</h1>
        </div>
        <p className="text-sm text-gray-500">
          {isOwner
            ? "Credit manual bonus points to any global campaign competitor."
            : `Credit attendance bonus points strictly to players at ${centerName}.`}
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white border border-gray-200 shadow-sm p-8">
        <form onSubmit={handleAwardBonus} className="space-y-6">
          {/* Player select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select player
            </label>
            <select
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
            >
              <option value="">Choose a player account…</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} (@{p.nickname}) — {p.centerName.replace("GARRINCHA ", "")}
                </option>
              ))}
            </select>
          </div>

          {/* Points amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bonus points amount
            </label>
            <input
              type="number"
              min="-100"
              max="100"
              required
              placeholder="e.g. 5"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Accepts values from −100 to +100. Positive awards points; negative corrections remove points.
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason <span className="text-gray-400 font-normal">(required)</span>
            </label>
            <textarea
              required
              minLength={3}
              maxLength={240}
              placeholder="e.g. Attended June 12 local watch party physically"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors resize-none font-sans"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Minimum 3 characters, max 240. Every award is permanently logged for audit.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div role="alert" className="flex items-start gap-3 p-3 border border-red-200 bg-red-50 text-red-700 text-sm rounded-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 text-green-700 text-sm rounded-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording…</span>
                </>
              ) : (
                <span>Commit Bonus Award</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Audit note */}
      <div className="p-4 border border-gray-200 bg-white text-sm text-gray-500 leading-relaxed">
        <span className="text-gray-700 font-semibold block mb-1">Audit note</span>
        Every manual award creates an immutable record in the PointEvent table — including your admin email, points, timestamp, and reason — preserving full campaign transparency.
      </div>
    </div>
  );
}
