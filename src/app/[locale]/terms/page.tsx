import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isLocale, type Locale, t } from "@/lib/translations";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: lp } = await params;
  if (!isLocale(lp)) redirect("/en");
  const locale = lp as Locale;

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm uppercase tracking-wider mb-10 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t(locale, "nav.home")}
        </Link>
        <p className="text-lime-400 font-bold uppercase tracking-[0.15em] text-xs mb-3">
          {t(locale, "ft_legal")}
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-8">
          {t(locale, "footer.terms")}
        </h1>
        <div className="border border-zinc-800 bg-zinc-900/30 p-8 text-zinc-400 text-sm leading-relaxed space-y-4">
          <p className="text-zinc-300 font-bold">GARRINCHA World Cup Pronostiek 2026</p>
          <p>
            The full terms and conditions for the GARRINCHA World Cup prediction
            campaign will be published prior to the official campaign launch. By
            participating you agree to compete fairly and accept the campaign
            rules as published.
          </p>
          <p>
            Participation is free. No payment or registration fee is required.
            The campaign runs during the FIFA World Cup 2026 tournament period.
            Results and prizes are announced after the final on 19 July 2026.
          </p>
          <p className="text-zinc-600 text-xs pt-4 border-t border-zinc-800">
            © 2026 GARRINCHA · Kempes BV · Belgium
          </p>
        </div>
      </div>
    </div>
  );
}
