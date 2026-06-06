"use client";
export default function LeaderboardsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <p>Error loading leaderboard.</p>
      <button onClick={reset}>Retry</button>
    </main>
  );
}
