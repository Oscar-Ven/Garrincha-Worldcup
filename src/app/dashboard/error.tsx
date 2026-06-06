"use client";
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <p>Error loading dashboard.</p>
      <button onClick={reset}>Retry</button>
    </main>
  );
}
