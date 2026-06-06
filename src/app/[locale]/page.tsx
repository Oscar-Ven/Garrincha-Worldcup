import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  QrCode,
  UserPlus,
  MapPin,
  Target,
  Trophy,
  Check,
  ChevronRight,
} from "lucide-react";
import { t, isLocale, type Locale } from "@/lib/translations";
import FAQAccordion from "@/components/public/FAQAccordion";
import CountdownTimer from "@/components/public/CountdownTimer";
import { prisma } from "@/lib/prisma";

async function getTopPlayers() {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    select: {
      id: true,
      nickname: true,
      nationality: true,
      competitionCenter: { select: { name: true } },
      predictions: { select: { pointsAwarded: true } },
    },
    take: 100,
  });

  return users
    .map((u) => ({
      id: u.id,
      name: u.nickname ?? "—",
      nationality: u.nationality ?? "—",
      center: (u.competitionCenter?.name ?? "—").replace("GARRINCHA ", ""),
      points: u.predictions.reduce((s, p) => s + (p.pointsAwarded ?? 0), 0),
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);
}

const CENTERS = [
  "Antwerpen Noord",
  "Antwerpen Zuid",
  "Charleroi Dampremy",
  "Charleroi Montignies",
  "Diegem",
  "Gent Arsenaal",
  "Gent The Loop",
  "Kortrijk",
  "Luik",
  "Westgate Dilbeek",
];

const STEP_ICONS = [QrCode, UserPlus, MapPin, Target, Trophy];

const SCORING = [
  { pts: "5", colorClass: "text-lime-400", bgClass: "bg-lime-400/10" },
  { pts: "3", colorClass: "text-lime-400", bgClass: "bg-lime-400/10" },
  { pts: "2", colorClass: "text-lime-400", bgClass: "bg-lime-400/10" },
  { pts: "0", colorClass: "text-zinc-500", bgClass: "bg-zinc-800/50" },
];

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: lp } = await params;
  if (!isLocale(lp)) redirect("/en");
  const locale = lp as Locale;

  const topPlayers = await getTopPlayers();

  const faqItems = [
    { q: t(locale, "faq1q"), a: t(locale, "faq1a") },
    { q: t(locale, "faq2q"), a: t(locale, "faq2a") },
    { q: t(locale, "faq3q"), a: t(locale, "faq3a") },
    { q: t(locale, "faq4q"), a: t(locale, "faq4a") },
    { q: t(locale, "faq5q"), a: t(locale, "faq5a") },
  ];

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950 pt-20"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900/70 to-zinc-950" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-lime-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center text-center py-20">
          <div className="mb-8 px-4 py-2 border border-lime-400/30 bg-lime-400/10 backdrop-blur-sm">
            <span className="text-lime-400 font-bold uppercase tracking-[0.2em] text-xs sm:text-sm">
              {t(locale, "tagline")}
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-8 drop-shadow-2xl">
            World Cup
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-400 italic pr-4">
              Challenge
            </span>
          </h1>

          {/* Belgium vs Morocco featured matchup */}
          <div className="flex items-center gap-4 mb-8 px-5 py-3 border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <Image src="https://flagcdn.com/w40/be.png" alt="Belgium" width={28} height={20} className="rounded-sm shrink-0" />
              <span className="text-white font-black uppercase tracking-tight text-sm hidden sm:block">Belgium</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Group Stage</span>
              <span className="text-lime-400 font-black text-base tracking-widest">VS</span>
              <span className="text-[9px] font-mono text-zinc-600">Jun 11 · 2026</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-white font-black uppercase tracking-tight text-sm hidden sm:block">Morocco</span>
              <Image src="https://flagcdn.com/w40/ma.png" alt="Morocco" width={28} height={20} className="rounded-sm shrink-0" />
            </div>
          </div>

          <p className="text-lg md:text-xl text-zinc-300 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            {t(locale, "hero_lead")}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href={`/${locale}/register`}
              className="w-full sm:w-auto group flex items-center justify-center gap-3 px-8 py-4 bg-lime-400 text-zinc-950 font-black uppercase tracking-widest text-base hover:bg-lime-300 transition-all shadow-[0_0_30px_rgba(163,230,53,0.3)] hover:shadow-[0_0_40px_rgba(163,230,53,0.5)]"
            >
              {t(locale, "cta_register")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900/80 border border-zinc-700 text-white font-bold uppercase tracking-widest text-base hover:bg-zinc-800 transition-colors"
            >
              {t(locale, "cta_how")}
            </a>
          </div>

          {/* Stats bar */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-16 text-center">
            {[
              { value: "10", label: t(locale, "stat_centers") },
              { value: "104", label: t(locale, "hero.matches") },
              { value: "0€", label: t(locale, "stat_free") },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-black text-lime-400 italic tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="absolute left-6 bottom-12 hidden lg:block text-zinc-600 font-mono text-xs uppercase tracking-widest"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Season 2026 // Belgium
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
          <CountdownTimer />
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-24 bg-zinc-950 relative border-t border-zinc-900"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="mb-16 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-lime-400 font-bold uppercase tracking-[0.15em] text-sm mb-4">
                {t(locale, "how_title_label")}
              </h2>
              <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                {t(locale, "how_title")}
              </h3>
            </div>
            <p className="text-zinc-400 font-medium max-w-sm text-base border-l-2 border-lime-400 pl-4">
              {t(locale, "hero_lead")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((n, index) => {
              const Icon = STEP_ICONS[index];
              return (
                <div
                  key={n}
                  className="group relative bg-zinc-900/50 border border-zinc-800 p-7 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200 flex flex-col h-full"
                >
                  <div className="text-5xl font-black text-zinc-800 mb-5 group-hover:text-lime-400/20 transition-colors leading-none">
                    0{n}
                  </div>
                  <div className="w-11 h-11 bg-lime-400/10 rounded-full flex items-center justify-center mb-5 group-hover:bg-lime-400/20 transition-colors">
                    <Icon className="w-5 h-5 text-lime-400" />
                  </div>
                  <h4 className="text-base font-black text-white uppercase tracking-tight mb-2">
                    {t(locale, `s${n}t`)}
                  </h4>
                  <p className="text-zinc-500 text-sm leading-relaxed mt-auto">
                    {t(locale, `s${n}d`)}
                  </p>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-transparent group-hover:border-lime-400 transition-colors" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-1/2 bg-gradient-to-l from-zinc-900/30 to-transparent pointer-events-none blur-3xl" />
      </section>

      {/* ── Prediction Rules ────────────────────────────────────────────── */}
      <section
        id="scoring"
        className="py-24 bg-zinc-900 relative border-y border-zinc-800"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-lime-400 via-zinc-950 to-zinc-950 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-lime-400 font-bold uppercase tracking-[0.15em] text-sm mb-4">
              The Mechanics
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-5">
              {t(locale, "sc_title")}
            </h3>
            <p className="text-zinc-400 text-base">{t(locale, "sc_lead")}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Mock prediction card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-10 shadow-2xl relative">
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-lime-400 text-zinc-950 px-4 py-1 text-xs font-black uppercase tracking-widest">
                Live Prediction
              </div>
              <div className="text-center mb-8">
                <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest block mb-2">
                  Group Stage · Matchday 1
                </span>
                <div className="inline-block bg-zinc-900 border border-zinc-800 px-4 py-1 rounded-full text-white text-sm font-bold">
                  19:45 KICKOFF
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 mb-10">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-3 border-2 border-zinc-700 overflow-hidden">
                    <Image src="https://flagcdn.com/w80/be.png" alt="Belgium" width={64} height={64} className="object-cover w-full h-full" />
                  </div>
                  <span className="text-white font-bold uppercase tracking-wide text-sm">
                    Belgium
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-16 bg-zinc-900 border-2 border-lime-400/50 rounded flex items-center justify-center text-3xl font-black text-white shadow-[0_0_15px_rgba(163,230,53,0.15)]">
                    2
                  </div>
                  <span className="text-zinc-600 font-black text-xl">:</span>
                  <div className="w-14 h-16 bg-zinc-900 border-2 border-zinc-800 rounded flex items-center justify-center text-3xl font-black text-white">
                    1
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-3 border-2 border-zinc-700 overflow-hidden">
                    <Image src="https://flagcdn.com/w80/ma.png" alt="Morocco" width={64} height={64} className="object-cover w-full h-full" />
                  </div>
                  <span className="text-white font-bold uppercase tracking-wide text-sm">
                    Morocco
                  </span>
                </div>
              </div>
              <div className="w-full bg-lime-400 text-zinc-950 py-4 text-center font-black uppercase tracking-widest text-sm rounded shadow-lg">
                Lock In Prediction
              </div>
            </div>

            {/* Scoring tiers */}
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n, idx) => {
                const s = SCORING[idx];
                return (
                  <div
                    key={n}
                    className="flex items-start gap-5 p-4 border border-zinc-800 bg-zinc-950/50 hover:border-lime-400/30 transition-colors group"
                  >
                    <div
                      className={`w-16 h-16 shrink-0 ${s.bgClass} flex items-center justify-center font-black text-2xl border border-zinc-800 group-hover:bg-lime-400/10 transition-colors ${s.colorClass}`}
                    >
                      {s.pts}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white uppercase tracking-tight mb-1 flex items-center gap-2">
                        {t(locale, `sc${n}t`)}
                        {n < 4 && <Check className="w-4 h-4 text-lime-400" />}
                      </h4>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        {t(locale, `sc${n}d`)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div className="p-4 border border-zinc-800/50 bg-zinc-950/30 text-zinc-500 text-sm leading-relaxed">
                <span className="text-lime-400 font-bold">+ Bonus points</span>{" "}
                — Check in at your GARRINCHA Center on matchdays to earn additional
                bonus points awarded by your center staff.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Belgian Centers ──────────────────────────────────────────────── */}
      <section
        id="centers"
        className="py-24 bg-zinc-950 relative border-t border-zinc-900"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-12">
            <h2 className="text-lime-400 font-bold uppercase tracking-[0.15em] text-sm mb-4">
              Belgium
            </h2>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                {t(locale, "ce_title")}
              </h3>
              <p className="text-zinc-400 max-w-sm text-base border-l-2 border-lime-400 pl-4">
                {t(locale, "ce_lead")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {CENTERS.map((center) => (
              <div
                key={center}
                className="group flex items-center gap-3 p-4 border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-700 transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-lime-400 shrink-0 group-hover:scale-125 transition-transform" />
                <span className="text-white text-sm font-medium">{center}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-zinc-500 text-sm">
              {t(locale, "competition.lock")}
            </p>
            <Link
              href={`/${locale}/register`}
              className="flex items-center gap-2 text-lime-400 font-bold text-sm uppercase tracking-wider hover:text-lime-300 transition-colors group"
            >
              {t(locale, "cta_register")}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Leaderboard Preview ──────────────────────────────────────────── */}
      <section className="py-24 bg-zinc-900 relative border-y border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="text-lime-400 font-bold uppercase tracking-[0.15em] text-sm mb-4">
              Rankings
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              {t(locale, "leaderboard.title")}
            </h3>
          </div>

          {topPlayers.length === 0 ? (
            <div className="border border-zinc-800 p-14 text-center text-zinc-600 text-sm uppercase tracking-widest font-mono">
              {locale === "nl" ? "Ranglijst verschijnt zodra de competitie begint." : "Leaderboard appears once the competition starts."}
            </div>
          ) : (
            <div className="border border-zinc-800 overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-3 bg-zinc-950 border-b border-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <span>#</span>
                <span>{t(locale, "table.player")}</span>
                <span className="hidden sm:block">{t(locale, "table.center")}</span>
                <span>{t(locale, "table.points")}</span>
              </div>
              {topPlayers.map((player, i) => (
                <div
                  key={player.id}
                  className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-4 items-center border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-950/50 transition-colors"
                >
                  <span
                    className={`text-lg font-black w-8 ${i === 0 ? "text-lime-400" : "text-zinc-600"}`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-bold text-white text-sm">{player.name}</div>
                    <div className="text-xs text-zinc-500">{player.nationality}</div>
                  </div>
                  <div className="hidden sm:block text-xs text-zinc-400 max-w-[180px] truncate">
                    {player.center}
                  </div>
                  <div className="text-lime-400 font-black text-lg">{player.points}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href={`/${locale}/leaderboards`}
              className="inline-flex items-center gap-2 px-8 py-3 border border-lime-400/50 text-lime-400 font-bold uppercase tracking-wider text-sm hover:bg-lime-400/10 transition-colors"
            >
              {t(locale, "leaders.viewAll")}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Prizes / Rewards ─────────────────────────────────────────────── */}
      <section id="prizes" className="py-24 bg-zinc-950 relative border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-lime-400 font-bold uppercase tracking-[0.15em] text-sm mb-4">
                Rewards
              </h2>
              <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-6">
                {t(locale, "pz_title")}
              </h3>
              <p className="text-zinc-400 text-base leading-relaxed mb-8">
                {t(locale, "pz_lead")}
              </p>
              <Link
                href={`/${locale}/register`}
                className="inline-flex items-center gap-3 px-8 py-4 bg-lime-400 text-zinc-950 font-black uppercase tracking-widest text-sm hover:bg-lime-300 transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)]"
              >
                {t(locale, "cta_register")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex items-center gap-6 p-6 border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors"
                >
                  <div
                    className={`text-3xl font-black italic shrink-0 ${n === 1 ? "text-lime-400" : n === 2 ? "text-zinc-300" : "text-amber-600"}`}
                  >
                    #{n}
                  </div>
                  <div>
                    <div className="text-white font-bold uppercase tracking-tight text-sm">
                      {n === 1
                        ? t(locale, "campaign.prize1")
                        : n === 2
                          ? t(locale, "campaign.prize2")
                          : t(locale, "campaign.prize3")}
                    </div>
                    <div className="text-zinc-500 text-xs mt-1">
                      {t(locale, "campaign.prizeValue")}
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-zinc-600 text-xs text-center">
                {t(locale, "campaign.prizeDeadline")} ·{" "}
                {t(locale, "campaign.freeParticipation")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-zinc-900 relative border-t border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <div className="text-center mb-14">
            <h2 className="text-lime-400 font-bold uppercase tracking-[0.15em] text-sm mb-4">
              Intel
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              {t(locale, "faq_title")}
            </h3>
          </div>
          <FAQAccordion items={faqItems} />
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-28 bg-zinc-950 relative border-t border-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-lime-400/8 via-zinc-950 to-zinc-950 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10 text-center">
          <p className="text-lime-400 font-bold uppercase tracking-[0.2em] text-xs mb-6">
            {t(locale, "fn_kicker")}
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-tight mb-8">
            {t(locale, "fn_title")}
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            {t(locale, "fn_lead")}
          </p>
          <Link
            href={`/${locale}/register`}
            className="inline-flex items-center gap-3 px-10 py-5 bg-lime-400 text-zinc-950 font-black uppercase tracking-widest text-lg hover:bg-lime-300 transition-all shadow-[0_0_40px_rgba(163,230,53,0.4)] hover:shadow-[0_0_60px_rgba(163,230,53,0.6)]"
          >
            {t(locale, "cta_register")}
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="text-zinc-600 text-xs mt-6 font-mono uppercase tracking-widest">
            {t(locale, "fn_note")}
          </p>
        </div>
      </section>
    </>
  );
}
