"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Locale, t } from "@/lib/translations";

interface Center { id: string; name: string; city: string; country: string; }

const CENTER_COLORS: Record<string, string> = {
  antwerp: "#ffffff", brussels: "#ffffff", ghent: "#ffffff", liege: "#ffffff",
  leuven: "#ffffff", bruges: "#ffffff",
  "antwerpen-noord": "#ffffff", "antwerpen-zuid": "#ffffff", "gent-arsenaal": "#ffffff",
  "gent-theloop": "#ffffff", charleroi: "#ffffff", kortrijk: "#ffffff",
  luik: "#ffffff", diegem: "#ffffff", "westgate-dilbeek": "#ffffff",
};

function getColor(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z-]/g, "");
  return CENTER_COLORS[key] ?? "#ffffff";
}

function getShort(name: string): string {
  return name.replace("GARRINCHA ", "").slice(0, 3).toUpperCase();
}

function CenterShield({ name, size = 32 }: { name: string; size?: number }) {
  const color = getColor(name);
  const short = getShort(name);
  return (
    <div style={{ width: size, height: size * 1.1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 40 44" width={size} height={size * 1.1} style={{ position: "absolute", inset: 0 }}>
        <path d="M20 1 L38 7 V22 C38 33 30 40 20 43 C10 40 2 33 2 22 V7 Z" fill={color} fillOpacity="0.16" stroke={color} strokeWidth="1.6" />
      </svg>
      <span style={{ position: "relative", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 900, fontStyle: "normal", fontSize: size * 0.34, color, letterSpacing: "-0.02em" }}>{short}</span>
    </div>
  );
}

export default function CompetitionCenterSelect({
  centers,
  activationCenterName,
  locale,
}: {
  centers: Center[];
  activationCenterName: string;
  locale: Locale;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(centerId: string) {
    if (pending) return;
    setSelectedId(centerId);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/competition-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? t(locale, "dashboard.noCenter"));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "dashboard.noCenter"));
      setSelectedId(null);
      setPending(false);
    }
  }

  return (
    <div className="card" style={{ padding: "18px 16px" }}>
      {/* section title */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, margin: "2px 0 12px" }}>
        <h3 className="disp" style={{ margin: 0, fontSize: 23, color: "var(--ink)" }}>{t(locale, "competition.title")}</h3>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-dim)", margin: "2px 0 6px", lineHeight: 1.4 }}>{t(locale, "competition.copy")}</p>
      {activationCenterName && (
        <p style={{ fontSize: 12, color: "var(--ink-faint)", margin: "0 0 14px" }}>
          {t(locale, "competition.activationNote", { center: activationCenterName })}
        </p>
      )}

      {error && (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,90,77,0.10)", border: "1px solid rgba(255,90,77,0.3)", color: "var(--live)", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          ⚠ {error}
        </div>
      )}

      <div className="center-choose-grid">
        {centers.map((center) => {
          const on = selectedId === center.id;
          return (
            <button
              key={center.id}
              type="button"
              className={`center-choose-btn${on ? " selected" : ""}`}
              onClick={() => handleSelect(center.id)}
              disabled={pending}
              aria-pressed={on}
            >
              <CenterShield name={center.name} size={28} />
              <div style={{ minWidth: 0 }}>
                <div className="disp" style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.1 }}>{center.name.replace("GARRINCHA ", "")}</div>
                <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 2 }}>{center.city}</div>
                {on && pending && <div style={{ fontSize: 10, color: "var(--green)", marginTop: 2 }}>{t(locale, "competition.choosing")}</div>}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, fontSize: 11, color: "var(--ink-faint)" }}>
        🔒 {t(locale, "competition.lock")}
      </div>
    </div>
  );
}
