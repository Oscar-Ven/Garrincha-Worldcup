import { redirect } from "next/navigation";
import { isLocale } from "@/lib/translations";
import PrizeCards from "@/components/public/PrizeCards";

export const metadata = {
  title: "Prizes — GARRINCHA World Cup",
  description: "Win JustPadel gift cards, GARRINCHA T-shirts, and a limited-edition Belgium Team Adidas racket.",
};

export default async function PrizesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: lp } = await params;
  if (!isLocale(lp)) redirect("/en");

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <p className="text-lime-400 font-bold uppercase tracking-[0.15em] text-xs mb-3">
            GARRINCHA World Cup 2026
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
            Prizes
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-xl">
            Compete with players from your GARRINCHA centre and across all centres.
            The top players win exclusive prizes.
          </p>
        </div>

        <PrizeCards />
      </div>
    </div>
  );
}
