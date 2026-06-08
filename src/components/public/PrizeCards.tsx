import Link from "next/link";
import { ArrowRight, Trophy, Medal } from "lucide-react";

const JUSTPADEL_URL = "https://justpadel.com/en";

const CENTRE_PRIZES = [
  {
    rank: "1st Place",
    prize: "€60 JustPadel gift card",
    perPerson: true,
    sponsored: true,
    accent: "border-lime-400/60 bg-lime-400/5",
    rankStyle: "bg-lime-400 text-zinc-950",
    num: "01",
  },
  {
    rank: "2nd Place",
    prize: "€40 JustPadel gift card",
    perPerson: true,
    sponsored: true,
    accent: "border-zinc-700 bg-white/[0.02]",
    rankStyle: "bg-zinc-700 text-zinc-200",
    num: "02",
  },
  {
    rank: "3rd Place",
    prize: "GARRINCHA T-shirt",
    perPerson: true,
    sponsored: false,
    accent: "border-zinc-700 bg-white/[0.02]",
    rankStyle: "bg-zinc-800 text-zinc-300",
    num: "03",
  },
];

interface Props {
  preview?: boolean;
  prizesHref?: string;
}

export default function PrizeCards({ preview = false, prizesHref = "/en/prizes" }: Props) {
  if (preview) {
    return (
      <div className="border border-zinc-800 bg-zinc-900/50 p-6 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-lime-400 font-bold uppercase tracking-[0.15em] text-xs mb-1">Prizes</p>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">What you can win</h2>
          </div>
          <Link
            href={prizesHref}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-lime-400 hover:text-lime-300 transition-colors whitespace-nowrap"
          >
            View all prizes
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CENTRE_PRIZES.map((p) => (
            <div key={p.rank} className={`border ${p.accent} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{p.rank}</p>
              <p className="text-sm font-bold text-white leading-snug">{p.prize}</p>
              {p.sponsored && (
                <p className="text-[10px] text-zinc-600 mt-1.5">
                  Sponsored by{" "}
                  <a href={JUSTPADEL_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-lime-400 transition-colors">
                    JustPadel
                  </a>
                </p>
              )}
            </div>
          ))}
          <div className="border border-lime-400/30 bg-lime-400/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-lime-400/70 mb-2">Overall Winner</p>
            <p className="text-sm font-bold text-white leading-snug">Belgium Team Adidas racket</p>
            <p className="text-[10px] text-zinc-500 mt-1.5">Across all centres</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Centre Winners */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Medal className="w-5 h-5 text-lime-400" />
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Centre Winners</h2>
        </div>
        <p className="text-zinc-400 text-sm mb-8 max-w-xl">
          The top 3 players at each GARRINCHA centre win prizes. Rankings are based on total prediction points at the end of the tournament.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CENTRE_PRIZES.map((p) => (
            <div key={p.rank} className={`border ${p.accent} p-6`}>
              <div className={`inline-flex px-3 py-1 text-xs font-black uppercase tracking-widest mb-4 ${p.rankStyle}`}>
                {p.rank}
              </div>
              <p className="text-xl font-black text-white mb-1">{p.prize}</p>
              <p className="text-sm text-zinc-500 mb-4">per person</p>
              {p.sponsored && (
                <p className="text-xs text-zinc-600 border-t border-zinc-800 pt-3 mt-3">
                  Gift card sponsored by{" "}
                  <a
                    href={JUSTPADEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-lime-400 transition-colors underline underline-offset-2"
                  >
                    JustPadel
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Overall Winner */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-5 h-5 text-lime-400" />
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Overall Winner</h2>
        </div>
        <div className="border border-lime-400/40 bg-lime-400/5 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-lime-400/5 blur-[80px] pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-lime-400 text-zinc-950 text-xs font-black uppercase tracking-widest mb-6">
              <Trophy className="w-3.5 h-3.5" />
              Overall Winner
            </div>
            <p className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">
              Limited-edition branded<br />Belgium Team Adidas racket
            </p>
            <p className="text-zinc-400 text-sm max-w-md">
              Awarded to the highest-scoring player across all GARRINCHA centres at the end of the World Cup.
            </p>
          </div>
        </div>
      </section>

      {/* Sponsor line */}
      <p className="text-xs text-zinc-600 border-t border-zinc-900 pt-6">
        Gift cards sponsored by{" "}
        <a
          href={JUSTPADEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-lime-400 transition-colors underline underline-offset-2"
        >
          JustPadel
        </a>
        .
      </p>
    </div>
  );
}
