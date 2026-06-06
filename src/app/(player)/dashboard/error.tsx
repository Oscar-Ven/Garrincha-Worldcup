"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
      <div className="font-semibold">We could not load your dashboard right now.</div>
      <button
        onClick={reset}
        className="mt-4 rounded-2xl bg-red-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
      >
        Retry
      </button>
    </div>
  );
}