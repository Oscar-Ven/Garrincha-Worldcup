"use client";

import { useCallback, useEffect, useState } from "react";

function pad(n: number) { return String(n).padStart(2, "0"); }

interface Team { name: string; isoCode?: string | null; flagUrl?: string | null; }

function TeamFlag({ team }: { team: Team }) {
  const src = team.flagUrl || (team.isoCode ? `/flags/countries/${team.isoCode}.svg` : null);
  return (
    <div className="db-feat-flag">
      {src
        ? <img src={src} alt={team.name} width={72} height={54} />
        : <span className="db-feat-flag-code">{team.name.slice(0, 3).toUpperCase()}</span>}
    </div>
  );
}

export function FeaturedMatchCard({
  matchId, homeTeam, awayTeam, stage, venue, kickoffAt,
  existingHome, existingAway, locked,
}: {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  stage: string;
  venue: string | null;
  kickoffAt: string;
  existingHome?: number | null;
  existingAway?: number | null;
  locked: boolean;
}) {
  const [home, setHome] = useState(existingHome ?? 1);
  const [away, setAway] = useState(existingAway ?? 0);
  const [cd, setCd] = useState({ h: 0, m: 0, s: 0 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(existingHome != null);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(kickoffAt).getTime() - Date.now();
      if (diff <= 0) { setCd({ h: 0, m: 0, s: 0 }); return; }
      setCd({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [kickoffAt]);

  const submit = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ matchId, homeScore: home, awayScore: away }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }, [matchId, home, away]);

  return (
    <div className="db-feat">
      <div className="db-feat-header">
        <span className="db-feat-badge">FEATURED MATCH</span>
        <span className="db-feat-stage">{stage}</span>
      </div>

      <div className="db-feat-matchup">
        <div className="db-feat-team">
          <TeamFlag team={homeTeam} />
          <span className="db-feat-tname">{homeTeam.name.toUpperCase()}</span>
        </div>

        <span className="db-feat-vs">VS</span>

        <div className="db-feat-team db-feat-team--away">
          <TeamFlag team={awayTeam} />
          <span className="db-feat-tname">{awayTeam.name.toUpperCase()}</span>
        </div>
      </div>

      {venue && (
        <div className="db-feat-venue">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          {venue}
        </div>
      )}

      <div className="db-cd-section">
        <div className="db-cd-label">KICKOFF IN</div>
        <div className="db-cd-row">
          <div className="db-cd-unit"><span className="db-cd-n">{pad(cd.h)}</span><span className="db-cd-s">HRS</span></div>
          <span className="db-cd-sep">:</span>
          <div className="db-cd-unit"><span className="db-cd-n">{pad(cd.m)}</span><span className="db-cd-s">MINS</span></div>
          <span className="db-cd-sep">:</span>
          <div className="db-cd-unit"><span className="db-cd-n">{pad(cd.s)}</span><span className="db-cd-s">SECS</span></div>
        </div>
      </div>

      {!locked ? (
        <>
          <div className="db-score-label">PREDICT THE SCORE</div>
          <div className="db-score-row">
            <button className="db-sc-btn" onClick={() => setHome(v => Math.max(0, v - 1))} aria-label="Decrease home score">−</button>
            <div className="db-sc-val" onClick={() => setHome(v => v + 1)} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && setHome(v => v + 1)} aria-label={`Home score: ${home}`}>{home}</div>
            <span className="db-sc-sep">—</span>
            <div className="db-sc-val" onClick={() => setAway(v => v + 1)} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && setAway(v => v + 1)} aria-label={`Away score: ${away}`}>{away}</div>
            <button className="db-sc-btn" onClick={() => setAway(v => Math.max(0, v - 1))} aria-label="Decrease away score">−</button>
          </div>
          <div className="db-score-clubs">
            <span>{homeTeam.name.toUpperCase()}</span>
            <span>{awayTeam.name.toUpperCase()}</span>
          </div>
          <button className="db-predict-cta" onClick={submit} disabled={saving || saved}>
            {saved ? "PREDICTED ✓" : saving ? "SAVING…" : "PREDICT NOW →"}
          </button>
          <p className="db-feat-notice">PREDICTIONS CLOSE 15 MIN BEFORE KICKOFF</p>
        </>
      ) : (
        <div className="db-feat-locked">Predictions are closed for this match</div>
      )}
    </div>
  );
}
