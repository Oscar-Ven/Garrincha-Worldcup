import Link from "next/link";
import { GarrinchaLogo } from "@/components/GarrinchaLogo";

export default function NotFound() {
  return (
    <main className="page" style={{ minHeight: "60vh", display: "grid", placeContent: "center", textAlign: "center" }}>
      <div style={{ display: "grid", gap: 20, justifyItems: "center" }}>
        <GarrinchaLogo />
        <div style={{ color: "var(--green)", fontSize: "clamp(5rem,20vw,11rem)", fontFamily: "var(--font-heading)", fontWeight: 800, fontStyle: "italic", lineHeight: 0.85, letterSpacing: "-0.06em" }}>
          404
        </div>
        <h1 style={{ color: "white", margin: 0, fontSize: "clamp(1.4rem,4vw,2.2rem)", fontWeight: 700 }}>
          Page not found
        </h1>
        <p style={{ color: "rgba(255,255,255,0.68)", maxWidth: 420, margin: 0 }}>
          This page doesn&apos;t exist or has been moved. Head back to the homepage to keep predicting.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
          <Link className="button primary" href="/">Back to home</Link>
          <Link className="button" href="/dashboard">My matches</Link>
        </div>
      </div>
    </main>
  );
}
