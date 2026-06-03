"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page" style={{ minHeight: "60vh", display: "grid", placeContent: "center", textAlign: "center" }}>
      <div style={{ display: "grid", gap: 18, justifyItems: "center", maxWidth: 480 }}>
        <div style={{ color: "var(--green)", fontFamily: "var(--font-heading)", fontSize: "clamp(3rem,12vw,6rem)", fontWeight: 800, lineHeight: 0.9 }}>
          ERROR
        </div>
        <h1 style={{ color: "white", margin: 0, fontSize: "1.4rem" }}>Something went wrong</h1>
        <p style={{ color: "rgba(255,255,255,0.62)", margin: 0 }}>
          {error.message ?? "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", margin: 0 }}>
            Error ID: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="button primary" onClick={reset}>Try again</button>
          <Link className="button" href="/">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
