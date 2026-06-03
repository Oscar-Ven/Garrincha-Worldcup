"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { type Locale, t } from "@/lib/translations";

export function PredictionForm({
  matchId,
  locked,
  homeScore,
  awayScore,
  locale,
}: {
  matchId: string;
  locked: boolean;
  homeScore?: number;
  awayScore?: number;
  locale: Locale;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (locked || pending) return;
    setPending(true);
    setMessage(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        matchId: data.get("matchId"),
        homeScore: Number(data.get("homeScore")),
        awayScore: Number(data.get("awayScore")),
      }),
    });
    const body = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setMessage(body.error ?? "Prediction could not be saved.");
      return;
    }
    setMessage(t(locale, "prediction.saved"));
    router.refresh();
  }

  const isUpdate = homeScore !== undefined && awayScore !== undefined;

  return (
    <form className="prediction-entry" onSubmit={handleSubmit}>
      <input type="hidden" name="matchId" value={matchId} />
      <div className="prediction-scores">
        <label>
          <span>{t(locale, "prediction.home")}</span>
          <input
            type="number"
            name="homeScore"
            min={0}
            max={30}
            required
            defaultValue={homeScore}
            disabled={locked}
          />
        </label>
        <label>
          <span>{t(locale, "prediction.away")}</span>
          <input
            type="number"
            name="awayScore"
            min={0}
            max={30}
            required
            defaultValue={awayScore}
            disabled={locked}
          />
        </label>
      </div>
      <button
        type="submit"
        className="prediction-save-btn"
        disabled={locked || pending}
      >
        <Save size={16} />
        {pending
          ? t(locale, "prediction.saving")
          : isUpdate
            ? t(locale, "prediction.update")
            : t(locale, "prediction.submit")}
      </button>
      {message ? <span className="muted">{message}</span> : null}
    </form>
  );
}
