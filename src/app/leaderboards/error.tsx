"use client";

import Link from "next/link";

export default function LeaderboardsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page" style={{ display: "grid", placeContent: "center", minHeight: "50vh", textAlign: "center" }}>
      <div style={{ display: "grid", gap: 14, justifyItems: "center" }}>
        <h1 style={{ color: "var(--green)", margin: 0 }}>Leaderboard Error</h1>
        <p className="muted">{error.message ?? "Could not load leaderboard data."}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="button primary" onClick={reset}>Retry</button>
          <Link className="button" href="/">Home</Link>
        </div>
      </div>
    </main>
  );
}
