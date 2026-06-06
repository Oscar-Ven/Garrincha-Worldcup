import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { isLocale, type Locale, t } from "@/lib/translations";
import { isPreviewMode } from "@/lib/app-mode";

type MatchRow = {
  id: string;
  stage: string;
  venue: string;
  kickoffAt: Date;
  status: "SCHEDULED" | "LIVE" | "FINAL";
  homeTeam: string;
  homeFlag: string | null;
  awayTeam: string;
  awayFlag: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

const STAGE_LABELS: Record<string, string> = {
  GROUP: "Group Stage",
  ROUND_OF_32: "Round of 32",
  ROUND_OF_16: "Round of 16",
  QUARTER_FINAL: "Quarter-Final",
  SEMI_FINAL: "Semi-Final",
  THIRD_PLACE: "Third Place",
  FINAL: "Final",
};

const DEMO_MATCHES: MatchRow[] = [
  {
    id: "demo-1",
    stage: "GROUP",
    venue: "MetLife Stadium, New York",
    kickoffAt: new Date("2026-06-11T21:00:00Z"),
    status: "SCHEDULED",
    homeTeam: "Mexico",
    homeFlag: null,
    awayTeam: "Ecuador",
    awayFlag: null,
    homeScore: null,
    awayScore: null,
  },
  {
    id: "demo-2",
    stage: "GROUP",
    venue: "SoFi Stadium, Los Angeles",
    kickoffAt: new Date("2026-06-12T00:00:00Z"),
    status: "SCHEDULED",
    homeTeam: "USA",
    homeFlag: null,
    awayTeam: "Canada",
    awayFlag: null,
    homeScore: null,
    awayScore: null,
  },
];

async function getMatches(): Promise<MatchRow[]> {
  if (isPreviewMode()) return DEMO_MATCHES;

  const { prisma } = await import("@/lib/prisma");
  const matches = await prisma.match.findMany({
    select: {
      id: true,
      stage: true,
      venue: true,
      kickoffAt: true,
      status: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: { name: true, flagUrl: true } },
      awayTeam: { select: { name: true, flagUrl: true } },
    },
    orderBy: { kickoffAt: "asc" },
  });

  return matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    venue: m.venue,
    kickoffAt: m.kickoffAt,
    status: m.status as "SCHEDULED" | "LIVE" | "FINAL",
    homeTeam: m.homeTeam.name,
    homeFlag: m.homeTeam.flagUrl,
    awayTeam: m.awayTeam.name,
    awayFlag: m.awayTeam.flagUrl,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
  }));
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === "nl" ? "nl-BE" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: lp } = await params;
  if (!isLocale(lp)) redirect("/en");
  const locale = lp as Locale;

  const matches = await getMatches();

  // Group by date string
  const byDate = new Map<string, MatchRow[]>();
  for (const m of matches) {
    const key = m.kickoffAt.toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(m);
  }

  const dateGroups = [...byDate.entries()];

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
            FIFA World Cup 2026
          </p>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">
            {t(locale, "nav.matches")}
          </h1>
          <p className="text-zinc-400">
            {locale === "nl"
              ? "Alle wedstrijden van het WK 2026. Voorspel voor de aftrap."
              : "All 104 matches of the 2026 World Cup. Predict before kickoff."}
          </p>
        </div>

        {/* No matches yet */}
        {matches.length === 0 && (
          <div className="border border-zinc-800 p-16 text-center">
            <p className="text-zinc-500 text-sm uppercase tracking-widest">
              {locale === "nl"
                ? "De wedstrijden worden binnenkort geladen."
                : "Fixtures will be loaded shortly."}
            </p>
          </div>
        )}

        {/* Date groups */}
        <div className="space-y-10">
          {dateGroups.map(([dateKey, dayMatches]) => (
            <div key={dateKey}>
              {/* Date heading */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-white font-black uppercase tracking-tight text-sm">
                  {formatDate(dayMatches[0].kickoffAt, locale)}
                </span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* Matches for this day */}
              <div className="space-y-2">
                {dayMatches.map((match) => (
                  <div
                    key={match.id}
                    className="border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 transition-colors"
                  >
                    {/* Stage + status strip */}
                    <div className="flex items-center justify-between px-4 pt-3 pb-1">
                      <span className="text-zinc-600 text-xs uppercase tracking-widest font-mono">
                        {STAGE_LABELS[match.stage] ?? match.stage}
                      </span>
                      {match.status === "LIVE" && (
                        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          Live
                        </span>
                      )}
                      {match.status === "FINAL" && (
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                          FT
                        </span>
                      )}
                    </div>

                    {/* Teams + score row */}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 pb-4 pt-1">
                      {/* Home team */}
                      <div className="flex items-center gap-3">
                        {match.homeFlag ? (
                          <Image
                            src={match.homeFlag}
                            alt={match.homeTeam}
                            width={28}
                            height={20}
                            className="object-cover rounded-sm shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-5 bg-zinc-800 rounded-sm shrink-0" />
                        )}
                        <span className="text-white font-bold text-sm truncate">
                          {match.homeTeam}
                        </span>
                      </div>

                      {/* Score / time */}
                      <div className="flex items-center gap-2 shrink-0">
                        {match.status === "SCHEDULED" ? (
                          <span className="text-zinc-400 font-mono text-sm font-bold">
                            {formatTime(match.kickoffAt)}
                          </span>
                        ) : (
                          <>
                            <span
                              className={`text-2xl font-black tabular-nums ${match.status === "LIVE" ? "text-white" : "text-zinc-300"}`}
                            >
                              {match.homeScore ?? "—"}
                            </span>
                            <span className="text-zinc-600 font-black">:</span>
                            <span
                              className={`text-2xl font-black tabular-nums ${match.status === "LIVE" ? "text-white" : "text-zinc-300"}`}
                            >
                              {match.awayScore ?? "—"}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Away team */}
                      <div className="flex items-center gap-3 justify-end">
                        <span className="text-white font-bold text-sm truncate text-right">
                          {match.awayTeam}
                        </span>
                        {match.awayFlag ? (
                          <Image
                            src={match.awayFlag}
                            alt={match.awayTeam}
                            width={28}
                            height={20}
                            className="object-cover rounded-sm shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-5 bg-zinc-800 rounded-sm shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Venue */}
                    <div className="px-4 pb-3 -mt-1">
                      <span className="text-zinc-600 text-xs font-mono">
                        {match.venue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
