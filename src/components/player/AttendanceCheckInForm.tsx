"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

interface Props {
  alreadyClaimed: boolean;
}

export default function AttendanceCheckInForm({ alreadyClaimed }: Props) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(
    alreadyClaimed ? "You already claimed today's check-in bonus." : null,
  );
  const [messageType, setMessageType] = useState<"success" | "info" | "error">(
    alreadyClaimed ? "info" : "success",
  );
  const [claimed, setClaimed] = useState(alreadyClaimed);

  async function handleClaim() {
    if (!code.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/player/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }
      if (data.pointsAwarded === 0) {
        setMessageType("info");
        setMessage(data.message ?? "You already claimed today's check-in bonus.");
        setClaimed(true);
      } else {
        setMessageType("success");
        setMessage("Check-in confirmed. You earned +3 points.");
        setClaimed(true);
        setCode("");
      }
    } catch {
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        If you are watching today&apos;s match at a Garrincha center, enter the daily center code to claim +3 points.
      </p>

      {!claimed && (
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleClaim()}
            placeholder="Enter today's code"
            disabled={busy}
            maxLength={16}
            className="flex-1 min-w-0 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm font-mono uppercase tracking-[0.18em] text-white outline-none disabled:opacity-60"
          />
          <button
            type="button"
            disabled={!code.trim() || busy}
            onClick={handleClaim}
            className="inline-flex items-center gap-2 rounded-2xl bg-lime-400 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{busy ? "Claiming…" : "Claim +3 points"}</span>
            <span className="sm:hidden">{busy ? "…" : "+3"}</span>
          </button>
        </div>
      )}

      {message && (
        <div
          className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
            messageType === "error"
              ? "bg-red-500/10 text-red-300"
              : messageType === "success"
                ? "bg-lime-400/10 text-lime-300 border border-lime-400/20"
                : "bg-white/4 text-zinc-300"
          }`}
        >
          {messageType === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-300" />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
