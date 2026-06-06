import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isLocale, type Locale, t } from "@/lib/translations";

export default async function PrivacyPage({
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
          {t(locale, "footer.privacy")}
        </h1>
        <div className="border border-zinc-800 bg-zinc-900/30 p-8 text-zinc-400 text-sm leading-relaxed space-y-4">
          <p className="text-zinc-300 font-bold">GARRINCHA World Cup Pronostiek 2026</p>
          <p>
            The full privacy policy for the GARRINCHA World Cup prediction
            campaign will be published prior to the official campaign launch.
          </p>
          <p>
            We collect only the personal information needed to run the campaign:
            your name, email address, nickname, and contact number. Your data
            is stored securely and is not sold to third parties. Your email is
            used solely to send your personal access link and campaign updates.
          </p>
          <p>
            You may request deletion of your data at any time by contacting
            GARRINCHA via the official website at garrincha.be.
          </p>
          <p className="text-zinc-600 text-xs pt-4 border-t border-zinc-800">
            © 2026 GARRINCHA · Kempes BV · Belgium
          </p>
        </div>
      </div>
    </div>
  );
}
