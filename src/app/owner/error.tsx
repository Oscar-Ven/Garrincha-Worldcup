"use client";
export default function OwnerError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <p>Error loading owner dashboard.</p>
      <button onClick={reset}>Retry</button>
    </main>
  );
}
