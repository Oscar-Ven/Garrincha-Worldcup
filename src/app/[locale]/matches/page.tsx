import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isLocale, type Locale, t } from "@/lib/translations";
import { isPreviewMode } from "@/lib/app-mode";
import MatchSchedule, { type PublicMatchRow } from "@/components/public/MatchSchedule";

export const revalidate = 60;

const DEMO_MATCHES: PublicMatchRow[] = [
  {
    id: "demo-1",
    fifaMatchNo: 1,
    stage: "GROUP",
    venue: "MetLife Stadium · East Rutherford, NJ",
    kickoffAt: "2026-06-11T19:00:00.000Z",
    status: "SCHEDULED",
    homeTeam: { name: "Mexico", fifaCode: "MEX", flagUrl: "flag:MEX", groupName: "A" },
    awayTeam: { name: "South Africa", fifaCode: "RSA", flagUrl: "flag:RSA", groupName: "A" },
    homeScore: null,
    awayScore: null,
  },
  {
    id: "demo-16",
    fifaMatchNo: 16,
    stage: "GROUP",
    venue: "Lumen Field · Seattle, WA",
    kickoffAt: "2026-06-15T19:00:00.000Z",
    status: "SCHEDULED",
    homeTeam: { name: "Belgium", fifaCode: "BEL", flagUrl: "flag:BEL", groupName: "G" },
    awayTeam: { name: "Egypt", fifaCode: "EGY", flagUrl: "flag:EGY", groupName: "G" },
    homeScore: null,
    awayScore: null,
  },
];

async function getMatches(): Promise<PublicMatchRow[]> {
  if (isPreviewMode()) return DEMO_MATCHES;

  const { prisma } = await import("@/lib/prisma");
  const matches = await prisma.match.findMany({
    select: {
      id: true,
      fifaMatchNo: true,
      stage: true,
      venue: true,
      kickoffAt: true,
      status: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: { name: true, fifaCode: true, flagUrl: true, groupName: true } },
      awayTeam: { select: { name: true, fifaCode: true, flagUrl: true, groupName: true } },
    },
    orderBy: [{ kickoffAt: "asc" }, { fifaMatchNo: "asc" }],
  });

  return matches.map((m) => ({
    id: m.id,
    fifaMatchNo: m.fifaMatchNo,
    stage: m.stage,
    venue: m.venue,
    kickoffAt: m.kickoffAt.toISOString(),
    status: m.status as "SCHEDULED" | "LIVE" | "FINAL",
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
  }));
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

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
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
              ? "Alle 104 wedstrijden van het WK 2026. Voorspel voor de aftrap."
              : "All 104 FIFA World Cup 2026 fixtures. Predict before kickoff."}
          </p>
        </div>

        <MatchSchedule matches={matches} />
      </div>
    </div>
  );
}
