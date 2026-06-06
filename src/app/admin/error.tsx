"use client";

export default function AdminErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
      <div className="text-red-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
        Error
      </div>
      <h2 className="text-lg font-black text-white uppercase tracking-tight mb-2">
        Admin page error
      </h2>
      <p className="text-zinc-400 text-sm leading-relaxed mb-6">
        This section failed to load. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-red-500 text-white font-bold uppercase tracking-wider text-xs hover:bg-red-400 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
