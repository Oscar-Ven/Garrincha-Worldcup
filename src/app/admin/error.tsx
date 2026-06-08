"use client";

export default function AdminErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="border border-red-200 bg-red-50 p-8 text-center max-w-lg mx-auto">
      <div className="text-red-600 text-xs font-bold uppercase tracking-widest mb-3">
        Error
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">
        This page failed to load
      </h2>
      <p className="text-gray-600 text-sm leading-relaxed mb-6">
        Something went wrong. Please try again or refresh the page.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
