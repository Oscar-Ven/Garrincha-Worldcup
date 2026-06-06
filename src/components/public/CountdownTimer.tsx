"use client";

import { useState, useEffect } from "react";

// June 11 2026 21:00 UTC — opening match kickoff
const TARGET = new Date("2026-06-11T21:00:00Z").getTime();

function getTimeLeft() {
  const diff = TARGET - Date.now();
  if (diff <= 0) return null;
  return {
    d: Math.floor(diff / (1000 * 60 * 60 * 24)),
    h: Math.floor((diff / (1000 * 60 * 60)) % 24),
    m: Math.floor((diff / (1000 * 60)) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownTimer() {
  const [time, setTime] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const tick = () => setTime(getTimeLeft());
    // Initial tick via setTimeout to satisfy react-hooks/set-state-in-effect rule
    const init = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(init);
      clearInterval(id);
    };
  }, []);

  if (!time) return null;

  return (
    <div className="hidden lg:flex items-center gap-1 border border-lime-400/20 bg-lime-400/5 px-3 py-1.5">
      {[
        { value: time.d, label: "D" },
        { value: time.h, label: "H" },
        { value: time.m, label: "M" },
        { value: time.s, label: "S" },
      ].map(({ value, label }, i) => (
        <span key={label} className="flex items-center">
          {i > 0 && (
            <span className="text-lime-400/40 font-black text-xs mx-0.5 tabular-nums">:</span>
          )}
          <span className="flex flex-col items-center min-w-8">
            <span className="text-white font-black text-sm tabular-nums leading-none">
              {pad(value)}
            </span>
            <span className="text-lime-400/50 font-bold text-[9px] uppercase tracking-widest leading-none mt-0.5">
              {label}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
