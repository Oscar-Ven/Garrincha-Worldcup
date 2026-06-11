"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
  RefreshCw,
  Search,
  UserCheck,
  Clock,
} from "lucide-react";

interface ClaimRow {
  id: string;
  createdAt: string;
  fullName: string;
  nickname: string;
  email: string;
}

interface Props {
  currentUserRole: string;
  initialActiveCode: string;
  initialExpiresAt: string;
  initialClaimCount: number;
  initialClaims: ClaimRow[];
  today: string;
}

export default function CheckinClient({
  currentUserRole,
  initialActiveCode,
  initialExpiresAt,
  initialClaimCount,
  initialClaims,
  today,
}: Props) {
  const router = useRouter();
  const isOwner = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  const [activeCode, setActiveCode] = useState(initialActiveCode);
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const [claimCount, setClaimCount] = useState(initialClaimCount);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copyText, setCopyText] = useState("Copy");
  const [timeLeft, setTimeLeft] = useState("");

  const filteredClaims = initialClaims.filter((c) => {
    const term = searchQuery.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(term) ||
      c.nickname.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft("");
      return;
    }
    function updateTimer() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        setActiveCode("");
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m ${seconds}s remaining`,
      );
    }
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  async function handleGenerateCode() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/check-in-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate code.");
      setActiveCode(data.code);
      setExpiresAt(data.expiresAt);
      setClaimCount(0);
      setSuccess(`New check-in code generated for today (${today}).`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate code.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!activeCode) return;
    navigator.clipboard.writeText(activeCode);
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy"), 2000);
  }

  const codeActive = activeCode && timeLeft !== "EXPIRED";

  return (
    <div className="space-y-6 font-sans">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <QrCode className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Attendance &amp; Check-in</h1>
        </div>
        <p className="text-sm text-gray-500">
          {isOwner
            ? "Generate today's global check-in code. Share it with all center managers."
            : "Today's check-in code for your center. Share it with players to award +3 points."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Code panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Today&apos;s Code — {today}
            </h2>

            {/* Code display */}
            <div className="border border-gray-200 bg-gray-50 flex flex-col items-center justify-center py-8 px-4 min-h-36">
              {codeActive ? (
                <div className="text-center space-y-2">
                  <span className="font-mono text-4xl font-black text-gray-900 tracking-widest block">
                    {activeCode}
                  </span>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 block">
                    {timeLeft}
                  </span>
                  <span className="text-xs text-gray-500 block">
                    {claimCount} player{claimCount !== 1 ? "s" : ""} claimed
                  </span>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-2">
                  <AlertCircle className="w-7 h-7 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-medium">
                    {isOwner ? "No code generated yet today." : "No active code today."}
                  </p>
                  {!isOwner && (
                    <p className="text-xs text-gray-400 mt-1">Ask the owner to generate one.</p>
                  )}
                </div>
              )}
            </div>

            {/* Alerts */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2.5 p-3 bg-green-50 border border-green-200 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              {isOwner && (
                <button
                  onClick={handleGenerateCode}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {codeActive ? "Delete & Generate New" : "Generate Today's Code"}
                </button>
              )}

              {codeActive && (
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copyText}
                </button>
              )}
            </div>

            {!isOwner && (
              <p className="text-xs text-gray-400 text-center">
                Share this code with players at your center to let them claim +3 points.
              </p>
            )}
          </div>
        </div>

        {/* Players who claimed today */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 shadow-sm p-6 flex flex-col h-full min-h-96">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-600" />
                Players who claimed today ({initialClaims.length})
              </h3>

              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search players…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {filteredClaims.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No claims recorded today yet.</p>
                </div>
              ) : (
                filteredClaims.map((item) => {
                  const claimTime = new Date(item.createdAt);
                  return (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                          <span>{item.fullName}</span>
                          <span className="text-xs text-gray-400">@{item.nickname}</span>
                        </div>
                        <span className="text-xs text-gray-500">{item.email}</span>
                      </div>
                      <div className="text-right text-xs text-gray-500 flex flex-col items-end gap-0.5 shrink-0">
                        <span className="flex items-center gap-1 font-medium text-green-700">
                          <Clock className="w-3 h-3" />
                          {claimTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-green-600 font-semibold">+3 pts</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4 text-xs text-gray-500">
              Each player can claim once per day. Check-in gives +3 attendance bonus points.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
