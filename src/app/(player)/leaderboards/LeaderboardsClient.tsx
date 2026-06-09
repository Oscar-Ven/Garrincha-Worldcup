"use client";

import { useRouter } from "next/navigation";
import { Crown, MapPin } from "lucide-react";

type LeaderboardRow = {
  id: string;
  name: string;
  center: string;
  nationality: string;
  points: number;
  predictionCount: number;
};

type Center = {
  id: string;
  name: string;
  city: string;
};

type Props = {
  globalRows: LeaderboardRow[];
  centerRows: LeaderboardRow[];
  centers: Center[];
  selectedCenterId: string | null;
  currentUserId: string;
};

function LeaderboardRows({
  rows,
  currentUserId,
  emptyMessage,
}: {
  rows: LeaderboardRow[];
  currentUserId: string;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm text-zinc-400">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {rows.slice(0, 25).map((row, index) => {
        const active = row.id === currentUserId;
        return (
          <div
            key={row.id}
            className={`flex min-w-0 items-center justify-between gap-3 rounded-3xl border px-4 py-4 ${
              active
                ? "border-lime-400/40 bg-lime-400/10"
                : "border-white/8 bg-white/[0.03]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${
                  active ? "bg-lime-400 text-zinc-950" : "bg-white/5 text-zinc-300"
                }`}
              >
                #{index + 1}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{row.name}</div>
                <div className="truncate text-xs text-zinc-500">
                  {row.center.replace("GARRINCHA ", "")}
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-semibold text-lime-300">{row.points} pts</div>
              <div className="text-xs text-zinc-500">{row.predictionCount} preds</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LeaderboardsClient({
  globalRows,
  centerRows,
  centers,
  selectedCenterId,
  currentUserId,
}: Props) {
  const router = useRouter();

  function handleCenterChange(id: string) {
    if (id === "") {
      router.push("/leaderboards");
    } else {
      router.push(`/leaderboards?center=${id}`);
    }
  }

  const selectedCenter = centers.find((c) => c.id === selectedCenterId);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {/* Global leaderboard */}
      <section className="rounded-[28px] border border-white/8 bg-black/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-5 w-5 text-lime-400" />
          <h2 className="text-base font-semibold text-white">Global leaderboard</h2>
        </div>
        <LeaderboardRows
          rows={globalRows}
          currentUserId={currentUserId}
          emptyMessage="No ranked players yet."
        />
      </section>

      {/* Center leaderboard */}
      <section className="rounded-[28px] border border-white/8 bg-black/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-lime-400" />
            <h2 className="text-base font-semibold text-white">
              {selectedCenter
                ? selectedCenter.name.replace("GARRINCHA ", "")
                : "Center leaderboard"}
            </h2>
          </div>
          <select
            value={selectedCenterId ?? ""}
            onChange={(e) => handleCenterChange(e.target.value)}
            className="rounded-2xl border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none focus:border-lime-400"
            aria-label="Select center"
          >
            <option value="">All centers…</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.replace("GARRINCHA ", "")} · {c.city}
              </option>
            ))}
          </select>
        </div>

        {selectedCenterId === null ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm text-zinc-400">
            Select a center to view the center leaderboard.
          </div>
        ) : (
          <LeaderboardRows
            rows={centerRows}
            currentUserId={currentUserId}
            emptyMessage="No ranked players for this center yet."
          />
        )}
      </section>
    </div>
  );
}
