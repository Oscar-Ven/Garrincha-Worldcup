import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
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
        gap: 20,
      }}
    >
      <Image src="/garrincha-white.png" alt="GARRINCHA" height={20} width={120} style={{ height: 20, width: "auto", opacity: 0.7 }} />
      <div
        style={{
          color: "var(--green)",
          fontSize: "clamp(5rem,20vw,10rem)",
          fontFamily: "var(--f-disp)",
          fontWeight: 900,
          fontStyle: "italic",
          lineHeight: 0.9,
          letterSpacing: "-0.04em",
        }}
      >
        404
      </div>
      <h1 style={{ color: "var(--ink)", margin: 0, fontSize: "clamp(1.3rem,4vw,2rem)", fontWeight: 700 }}>
        Page not found
      </h1>
      <p style={{ color: "var(--ink-dim)", maxWidth: 360, margin: 0, fontSize: 15, lineHeight: 1.55 }}>
        This page doesn&apos;t exist or has been moved. Head back to the homepage to keep predicting.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
        <Link className="cta cta-green cta-md" href="/">
          Back to home
        </Link>
        <Link className="cta cta-ghost cta-md" href="/dashboard">
          My matches
        </Link>
      </div>
    </main>
  );
}
