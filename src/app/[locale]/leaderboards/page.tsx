import { redirect } from "next/navigation";
import { isLocale, type Locale, t } from "@/lib/translations";
import { isPreviewMode } from "@/lib/app-mode";
import { demoLeaderboard } from "@/lib/ui-demo-data";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 300;

type LeaderRow = {
  id: string;
  nickname: string;
  center: string;
  nationality: string;
  points: number;
};

async function getLeaderboard(): Promise<LeaderRow[]> {
  if (isPreviewMode()) {
    return demoLeaderboard.map((p) => ({
      id: p.id,
      nickname: p.name,
      center: p.center.replace("GARRINCHA ", ""),
      nationality: p.nationality,
      points: p.points,
    }));
  }

  const { getLeaderboard } = await import("@/lib/leaderboards");
  const rows = await getLeaderboard({}, 50);
  return rows.map((r) => ({
    id: r.id,
    nickname: r.name,
    center: r.center.replace("GARRINCHA ", ""),
    nationality: r.nationality,
    points: r.points,
  }));
}

export default async function LeaderboardsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: lp } = await params;
  if (!isLocale(lp)) redirect("/en");
  const locale = lp as Locale;

  const players = await getLeaderboard();

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-10">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm uppercase tracking-wider mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t(locale, "nav.home")}
          </Link>
          <p className="text-lime-400 font-bold uppercase tracking-[0.15em] text-xs mb-3">
            {t(locale, "leaderboard.eyebrow")}
          </p>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">
            {t(locale, "leaderboard.title")}
          </h1>
          <p className="text-zinc-400">{t(locale, "leaderboard.copy")}</p>
        </div>

        {/* Table */}
        {players.length === 0 ? (
          <div className="border border-zinc-800 p-16 text-center text-zinc-500">
            {t(locale, "leaderboard.noPlayers")}
          </div>
        ) : (
          <div className="border border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-[3rem_1fr_auto_auto] gap-4 px-6 py-3 bg-zinc-900 border-b border-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <span>#</span>
              <span>{t(locale, "table.player")}</span>
              <span className="hidden md:block">{t(locale, "table.center")}</span>
              <span>{t(locale, "table.points")}</span>
            </div>
            {players.map((player, i) => (
              <div
                key={player.id}
                className={`grid grid-cols-[3rem_1fr_auto_auto] gap-4 px-6 py-4 items-center border-b border-zinc-800/50 last:border-b-0 transition-colors ${
                  i < 3 ? "hover:bg-lime-400/5" : "hover:bg-zinc-900/30"
                }`}
              >
                <span
                  className={`font-black text-lg ${
                    i === 0
                      ? "text-lime-400"
                      : i === 1
                        ? "text-zinc-300"
                        : i === 2
                          ? "text-amber-600"
                          : "text-zinc-600"
                  }`}
                >
                  {i + 1}
                </span>
                <div>
                  <div className="font-bold text-white text-sm">{player.nickname}</div>
                  <div className="text-xs text-zinc-500">{player.nationality}</div>
                </div>
                <div className="hidden md:block text-xs text-zinc-500 max-w-[200px] truncate">
                  {player.center}
                </div>
                <div className="text-lime-400 font-black text-xl tabular-nums">
                  {player.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
