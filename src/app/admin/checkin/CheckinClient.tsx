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
  Printer,
} from "lucide-react";

interface CenterRow {
  id: string;
  name: string;
  city: string;
}

interface CheckinRow {
  id: string;
  createdAt: string;
  fullName: string;
  nickname: string;
  email: string;
}

interface Props {
  currentUserRole: string;
  adminCenterId: string;
  initialCenters: CenterRow[];
  initialCheckins: CheckinRow[];
  initialActiveCode: string;
  initialExpiresAt: string;
}

export default function CheckinClient({
  currentUserRole,
  adminCenterId,
  initialCenters,
  initialCheckins,
  initialActiveCode,
  initialExpiresAt,
}: Props) {
  const router = useRouter();
  const isOwner = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  // Selected center state
  const [selectedCenterId, setSelectedCenterId] = useState(
    isOwner ? initialCenters[0]?.id ?? "" : adminCenterId
  );

  const [activeCode, setActiveCode] = useState(initialActiveCode);
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);

  // General controls
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copyText, setCopyText] = useState("Copy Code");

  // Filter checkins lists
  const filteredCheckins = initialCheckins.filter((c) => {
    const term = searchQuery.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(term) ||
      c.nickname.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  // Fetch active code for selected center (especially useful when Owner toggles centers)
  async function fetchActiveCode(centerId: string) {
    if (!centerId) return;
    setCodeLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/checkin-code?centerId=${centerId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to retrieve check-in code.");
      }
      setActiveCode(data.code ?? "");
      setExpiresAt(data.expiresAt ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load active code.");
      setActiveCode("");
      setExpiresAt("");
    } finally {
      setCodeLoading(false);
    }
  }

  // Effect to load code when owner switches centers
  useEffect(() => {
    if (isOwner) {
      fetchActiveCode(selectedCenterId);
    }
  }, [selectedCenterId]);

  // Handle Code Generation
  async function handleGenerateCode() {
    if (!selectedCenterId) {
      setError("Please select a physical center first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/checkin-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId: selectedCenterId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate security code.");
      }

      setActiveCode(data.code);
      setExpiresAt(data.expiresAt);
      setSuccess("New 6-digit session check-in code generated!");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate code.");
    } finally {
      setLoading(false);
    }
  }

  // Clipboard copy
  function handleCopy() {
    if (!activeCode) return;
    navigator.clipboard.writeText(activeCode);
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy Code"), 2000);
  }

  // Quick helper to display countdown or expired notices
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft("");
      return;
    }

    function updateTimer() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        setActiveCode(""); // Clear code locally if expired
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s remaining`);
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <QrCode className="w-8 h-8 text-lime-400" />
          Attendance & Check-in Desk
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Validate and logs physical attendance, generate dynamic session keys, and monitor Checked-In users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Code Console block */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 space-y-5">
            <h2 className="text-sm font-black text-white uppercase tracking-wider border-b border-zinc-805 pb-3">
              Session Code Generator
            </h2>

            {/* Center Selection (Only enabled for Owner) */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">
                Physical Center Assignment
              </label>
              <select
                disabled={!isOwner}
                value={selectedCenterId}
                onChange={(e) => setSelectedCenterId(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-805 text-white text-xs focus:outline-none focus:border-lime-400 transition-colors disabled:opacity-70 disabled:text-zinc-400"
              >
                {!isOwner && (
                  <option value={adminCenterId}>
                    {initialCenters.find((c) => c.id === adminCenterId)?.name ?? "Your Center"}
                  </option>
                )}
                {isOwner &&
                  initialCenters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city})
                    </option>
                  ))}
              </select>
            </div>

            {/* Big chunky display code */}
            <div className="bg-zinc-950 border border-zinc-805 p-6 flex flex-col items-center justify-center relative min-h-44">
              {codeLoading ? (
                <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
              ) : activeCode && timeLeft !== "EXPIRED" ? (
                <div className="text-center space-y-3">
                  <span className="font-mono text-4xl sm:text-5xl font-black text-white tracking-widest block uppercase">
                    {activeCode}
                  </span>
                  <span className="text-[10px] font-semibold text-lime-400 uppercase tracking-wider block bg-lime-400/5 px-2 py-0.5 border border-lime-400/20">
                    {timeLeft}
                  </span>
                </div>
              ) : (
                <div className="text-center text-zinc-600 py-4 max-w-40">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                  <p className="text-[10px] font-bold uppercase">No active security session currently key.</p>
                </div>
              )}
            </div>

            {/* Error notifications */}
            {error && (
              <div className="flex items-start gap-2.5 p-2 bg-red-900/10 border border-red-905/30 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success notifications */}
            {success && (
              <div className="flex items-center gap-2.5 p-2 bg-lime-400/10 border border-lime-405/30 text-lime-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Trigger buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleGenerateCode}
                disabled={loading}
                className="w-full py-3 bg-lime-400 hover:bg-lime-300 disabled:bg-zinc-810 disabled:text-zinc-500 font-bold uppercase tracking-wider text-xs text-zinc-950 transition-colors flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <RefreshCw className="w-4 h-4 shrink-0" />
                )}
                <span>Generate New Code</span>
              </button>

              {activeCode && timeLeft !== "EXPIRED" && (
                <button
                  onClick={handleCopy}
                  className="w-full py-2.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-755 font-bold uppercase tracking-wider text-[11px] text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copyText}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Checked-In Users Listing block */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 flex flex-col justify-between h-full min-h-120">
            <div className="space-y-4">
              {/* Internal header filtering */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-lime-400" />
                  Checked-In Competing Players ({initialCheckins.length})
                </h3>

                <div className="relative w-full max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-500">
                    <Search className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search checked-in..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-805 text-white text-xs placeholder-zinc-650 focus:outline-none focus:border-lime-400 transition-colors"
                  />
                </div>
              </div>

              {/* Data list view */}
              <div className="overflow-y-auto max-h-80 divide-y divide-zinc-900 pr-1">
                {filteredCheckins.length === 0 ? (
                  <div className="text-center py-16 text-zinc-550">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-20 text-lime-400" />
                    <p className="text-[10px] uppercase font-bold">No physical check-ins registered.</p>
                  </div>
                ) : (
                  filteredCheckins.map((item) => {
                    const checkinTime = new Date(item.createdAt);

                    return (
                      <div
                        key={item.id}
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-2">
                            <span>{item.fullName}</span>
                            <span className="text-[10px] text-zinc-500 font-normal">
                              (@{item.nickname})
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 block">{item.email}</span>
                        </div>

                        <div className="text-right text-[10px] text-zinc-400 flex flex-col items-end gap-0.5">
                          <span className="flex items-center gap-1 font-semibold text-lime-400/90">
                            <Clock className="w-3 h-3 text-lime-400" />
                            {checkinTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-zinc-550 text-[9px]">
                            {checkinTime.toLocaleDateString([], { dateStyle: "short" })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="border-t border-zinc-850 pt-4 flex justify-between items-center text-[10px] text-zinc-500">
              <span>* Valid check-ins automatically credit competitors with +5 verification attendance bonus points.</span>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 hover:text-white px-2 py-1 border border-zinc-805 hover:bg-zinc-850"
              >
                <Printer className="w-3 h-3 text-lime-400" />
                <span>Print Log</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
