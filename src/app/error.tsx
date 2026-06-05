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
    <main
      style={{
        minHeight: "min(100dvh, 100vh)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px 20px 100px",
        gap: 18,
      }}
    >
      <div
        style={{
          color: "var(--green)",
          fontFamily: "var(--f-disp)",
          fontSize: "clamp(2.5rem,10vw,5rem)",
          fontWeight: 900,
          lineHeight: 0.9,
          fontStyle: "italic",
        }}
      >
        Oops
      </div>
      <h1 style={{ color: "var(--ink)", margin: 0, fontSize: "1.4rem" }}>Something went wrong</h1>
      <p style={{ color: "var(--ink-dim)", margin: 0, maxWidth: 400, fontSize: 14.5, lineHeight: 1.55 }}>
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      {error.digest && (
        <p style={{ color: "var(--ink-faint)", fontSize: "0.72rem", margin: 0 }}>
          Error ID: {error.digest}
        </p>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="cta cta-green cta-md" onClick={reset}>
          Try again
        </button>
        <Link className="cta cta-ghost cta-md" href="/">
          Back to home
        </Link>
      </div>
    </main>
  );
}
