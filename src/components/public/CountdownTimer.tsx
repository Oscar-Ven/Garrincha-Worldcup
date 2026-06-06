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
    const init = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(init);
      clearInterval(id);
    };
  }, []);

  if (!time) return null;

  return (
    <div className="border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-5 w-36">
      <p className="text-lime-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4 text-center">
        Kickoff in
      </p>
      <div className="flex flex-col gap-2">
        {[
          { value: time.d, label: "Days" },
          { value: time.h, label: "Hours" },
          { value: time.m, label: "Minutes" },
          { value: time.s, label: "Seconds" },
        ].map(({ value, label }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-zinc-600 text-[10px] uppercase tracking-widest font-mono">
              {label}
            </span>
            <span className="text-white font-black text-xl tabular-nums leading-none">
              {pad(value)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 h-px bg-lime-400/20" />
      <p className="text-zinc-600 font-mono text-[9px] uppercase tracking-widest mt-3 text-center">
        Jun 11 · 2026
      </p>
    </div>
  );
}
