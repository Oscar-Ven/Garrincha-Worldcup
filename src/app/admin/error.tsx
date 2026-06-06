"use client";
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <p>Admin error.</p>
      <button onClick={reset}>Retry</button>
    </main>
  );
}
