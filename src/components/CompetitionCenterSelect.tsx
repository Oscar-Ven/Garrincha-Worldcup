"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Locale, t } from "@/lib/translations";

interface Center {
  id: string;
  name: string;
  city: string;
  country: string;
}

interface CompetitionCenterSelectProps {
  centers: Center[];
  activationCenterName: string;
  locale: Locale;
}

export default function CompetitionCenterSelect({
  centers,
  activationCenterName,
  locale,
}: CompetitionCenterSelectProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(centerId: string) {
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
    <div className="competition-center-select">
      <div className="competition-center-select__header">
        <h2 className="competition-center-select__title">{t(locale, "competition.title")}</h2>
        <p className="competition-center-select__subtitle">{t(locale, "competition.copy")}</p>
        {activationCenterName && (
          <p className="competition-center-select__activation-note">
            {t(locale, "competition.activationNote", { center: activationCenterName })}
          </p>
        )}
        <p className="competition-center-select__lock-note">{t(locale, "competition.lock")}</p>
      </div>

      {error && (
        <div className="competition-center-select__error" role="alert">
          {error}
        </div>
      )}

      <ul className="competition-center-select__list" role="list">
        {centers.map((center) => {
          const isSelected = selectedId === center.id;
          const isDisabled = pending;

          return (
            <li key={center.id} className="competition-center-select__item">
              <button
                type="button"
                className={[
                  "competition-center-select__card",
                  isSelected ? "competition-center-select__card--selected" : "",
                  isDisabled ? "competition-center-select__card--disabled" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleSelect(center.id)}
                disabled={isDisabled}
                aria-pressed={isSelected}
              >
                <span className="competition-center-select__card-name">{center.name}</span>
                <span className="competition-center-select__card-location">
                  {center.city}, {center.country}
                </span>
                {isSelected && pending && (
                  <span className="competition-center-select__card-saving" aria-live="polite">
                    {t(locale, "competition.choosing")}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
