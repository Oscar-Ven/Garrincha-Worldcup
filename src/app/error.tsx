"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="text-lime-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">
          Error
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-3">
          Something went wrong
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          An unexpected error occurred. Please try again or return to the home page.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-full sm:w-auto px-6 py-3 bg-lime-400 text-zinc-950 font-black uppercase tracking-wider text-sm hover:bg-lime-300 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 border border-zinc-700 text-white font-bold uppercase tracking-wider text-sm hover:bg-zinc-900 transition-colors text-center"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
