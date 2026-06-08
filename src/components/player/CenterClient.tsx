"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";

type CenterOption = {
  id: string;
  name: string;
  city: string;
};

type CenterClientProps = {
  currentCenterId: string;
  canChangeCenter: boolean;
  centers: CenterOption[];
};

export default function CenterClient({ currentCenterId, canChangeCenter, centers }: CenterClientProps) {
  const router = useRouter();
  const [selectedCenterId, setSelectedCenterId] = useState(currentCenterId);
  const [checkInCode, setCheckInCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [busy, setBusy] = useState<"center" | "checkin" | null>(null);

  async function handleCenterChange() {
    setBusy("center");
    setMessage(null);
    setMessageType(null);
    try {
      const response = await fetch("/api/user/center", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId: selectedCenterId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Center change failed.");
      setMessageType("success");
      setMessage(`Competition center updated to ${payload.centerName}.`);
      router.refresh();
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Center change failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCheckin() {
    setBusy("checkin");
    setMessage(null);
    setMessageType(null);
    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: checkInCode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Check-in failed.");
      setMessageType("success");
      setMessage("Check-in confirmed.");
      setCheckInCode("");
      router.refresh();
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Check-in failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="space-y-4 rounded-[28px] border border-white/8 bg-black/20 p-5">
        <div>
          <h2 className="text-base font-semibold text-white">Competition center</h2>
          <p className="mt-1 text-sm text-zinc-400">You register under a GARRINCHA center and compete in both global and center leaderboards.</p>
        </div>

        <div className="space-y-3">
          <select
            value={selectedCenterId}
            onChange={(event) => setSelectedCenterId(event.target.value)}
            disabled={!canChangeCenter || busy !== null}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none disabled:opacity-60"
          >
            {centers.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name} · {center.city}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!canChangeCenter || busy !== null || selectedCenterId === currentCenterId}
            onClick={handleCenterChange}
            className="inline-flex items-center gap-2 rounded-2xl bg-lime-400 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60"
          >
            <MapPin className="h-4 w-4" />
            <span>{busy === "center" ? "Saving..." : canChangeCenter ? "Update center" : "Center locked"}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 rounded-[28px] border border-white/8 bg-black/20 p-5">
        <div>
          <h2 className="text-base font-semibold text-white">Center check-in</h2>
          <p className="mt-1 text-sm text-zinc-400">Enter the code shown at your center to confirm attendance and unlock any supported bonus flow.</p>
        </div>

        <div className="space-y-3">
          <input
            value={checkInCode}
            onChange={(event) => setCheckInCode(event.target.value.toUpperCase())}
            placeholder="Enter today's code"
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm uppercase tracking-[0.18em] text-white outline-none"
          />

          <button
            type="button"
            disabled={!checkInCode || busy !== null}
            onClick={handleCheckin}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-zinc-200 disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{busy === "checkin" ? "Checking..." : "Confirm check-in"}</span>
          </button>
        </div>

        {message && (
          <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${messageType === "error" ? "bg-red-500/10 text-red-300" : "bg-white/4 text-zinc-200"}`}>
            {messageType === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-300" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-300" />
            )}
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}