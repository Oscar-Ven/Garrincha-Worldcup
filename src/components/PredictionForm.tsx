"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, CheckCircle } from "lucide-react";
import { type Locale, t } from "@/lib/translations";

// ─── Score stepper using DaisyUI join ────────────────────────────────────────

function ScoreStep({
  value,
  onChange,
  label,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="score-step-label">{label}</span>
      {/* DaisyUI join: connected group of controls */}
      <div className="join w-full">
        <button
          type="button"
          className="btn btn-square join-item score-step-minus"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
        >
          <Minus size={20} strokeWidth={2.5} />
        </button>
        <span
          className="join-item score-step-value"
          aria-live="polite"
          aria-atomic
        >
          {value}
        </span>
        <button
          type="button"
          className="btn btn-square join-item score-step-plus"
          onClick={() => onChange(Math.min(30, value + 1))}
          disabled={disabled || value >= 30}
          aria-label={`Increase ${label}`}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const [home, setHome] = useState(initialHome ?? 0);
  const [away, setAway] = useState(initialAway ?? 0);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit() {
    if (locked || pending) return;
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
      <div className="prediction-locked">
        {hasExisting ? (
          <span className="prediction-locked-score">
            {initialHome} – {initialAway}
          </span>
        ) : null}
        <span className="badge locked">{t(locale, "match.predictionLocked")}</span>
      </div>
    );
  }

  return (
    <div className="prediction-stepper">
      {/* Score steppers */}
      <div className="prediction-stepper-scores">
        <ScoreStep
          value={home}
          onChange={setHome}
          label={t(locale, "prediction.home")}
          disabled={pending}
        />
        <span className="prediction-stepper-sep">–</span>
        <ScoreStep
          value={away}
          onChange={setAway}
          label={t(locale, "prediction.away")}
          disabled={pending}
        />
      </div>

      {/* Save button */}
      <button
        type="button"
        className={`prediction-stepper-save${saved ? " saved" : ""}${pending ? " saving" : ""}`}
        onClick={submit}
        disabled={pending}
      >
        <CheckCircle size={18} strokeWidth={2.5} />
        {pending
          ? t(locale, "prediction.saving")
          : hasExisting
            ? t(locale, "prediction.update")
            : t(locale, "prediction.submit")}
      </button>

      {message ? (
        <p className={`prediction-stepper-msg${saved ? " ok" : " err"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
