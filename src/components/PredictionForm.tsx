"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Locale, t } from "@/lib/translations";

function Chevron({ dir = "down", s = 16, c = "currentColor" }: { dir?: string; s?: number; c?: string }) {
  const r = { up: "180deg", down: "0deg", left: "90deg", right: "-90deg" }[dir] ?? "0deg";
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" style={{ transform: `rotate(${r})` }}>
      <path d="M3 6l5 5 5-5" stroke={c} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScoreBox({
  value,
  onChange,
  disabled,
  dim,
}: {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
  dim?: boolean;
}) {
  const v = value ?? 0;
  const set = (n: number) => { if (!disabled) onChange(Math.max(0, Math.min(20, n))); };

  return (
    <div className="score-box-wrap" style={{ opacity: dim ? 0.5 : 1 }}>
      <button
        type="button"
        className="score-box-btn"
        aria-label="increase"
        disabled={disabled}
        onClick={() => set(v + 1)}
      >
        <Chevron dir="up" s={16} />
      </button>
      <div className={`score-box-value${value !== null ? " has-value" : ""}`}>
        <span className={`score-box-num${value === null ? " empty" : ""}`}>
          {value === null ? "–" : v}
        </span>
      </div>
      <button
        type="button"
        className="score-box-btn"
        aria-label="decrease"
        disabled={disabled || v <= 0}
        onClick={() => set(v - 1)}
      >
        <Chevron dir="down" s={16} />
      </button>
    </div>
  );
}

export function PredictionForm({
  matchId,
  locked,
  homeScore: initialHome,
  awayScore: initialAway,
  locale,
}: {
  matchId: string;
  locked: boolean;
  homeScore?: number;
  awayScore?: number;
  locale: Locale;
}) {
  const router = useRouter();
  const hasExisting = initialHome !== undefined && initialAway !== undefined;
  const [home, setHome] = useState<number | null>(initialHome ?? null);
  const [away, setAway] = useState<number | null>(initialAway ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const both = home !== null && away !== null;
  const dirty = home !== (initialHome ?? null) || away !== (initialAway ?? null);

  async function submit() {
    if (locked || pending || !both) return;
    setPending(true);
    setMessage(null);
    setSaved(false);
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ matchId, homeScore: home, awayScore: away }),
    });
    const body = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setMessage(body.error ?? "Prediction could not be saved.");
      return;
    }
    setSaved(true);
    setMessage(t(locale, "prediction.saved"));
    router.refresh();
  }

  if (locked) {
    return (
      <div className="prediction-steppers">
        {hasExisting && (
          <div className="prediction-steppers-row">
            <span className="num" style={{ fontSize: 34, color: "var(--ink)" }}>{initialHome}</span>
            <span className="prediction-sep">:</span>
            <span className="num" style={{ fontSize: 34, color: "var(--ink)" }}>{initialAway}</span>
          </div>
        )}
        <div className="prediction-locked-display">🔒 {t(locale, "match.predictionLocked")}</div>
      </div>
    );
  }

  return (
    <div className="prediction-steppers">
      <div className="prediction-your-pred">{t(locale, "match.yourPrediction")}</div>
      <div className="prediction-steppers-row">
        <ScoreBox value={home} onChange={setHome} disabled={pending} />
        <span className="prediction-sep">:</span>
        <ScoreBox value={away} onChange={setAway} disabled={pending} />
      </div>

      {both && dirty ? (
        <button
          type="button"
          className="btn btn-green"
          style={{ height: 48, marginTop: 14, fontSize: 16 }}
          onClick={submit}
          disabled={pending}
        >
          {pending
            ? t(locale, "prediction.saving")
            : hasExisting
              ? t(locale, "prediction.update")
              : t(locale, "prediction.submit")}
        </button>
      ) : (
        <div className="prediction-lock-note">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2" />
          </svg>
          {t(locale, "prediction.lockNotice")}
        </div>
      )}

      {message && (
        <p style={{ textAlign: "center", fontSize: 13, fontWeight: 700, marginTop: 6, color: saved ? "var(--green)" : "var(--live)" }}>
          {saved ? "✓ " : "⚠ "}{message}
        </p>
      )}
    </div>
  );
}
