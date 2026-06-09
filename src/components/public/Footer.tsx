import Link from "next/link";
import Image from "next/image";
import { t, type Locale } from "@/lib/translations";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Footer({ locale }: { locale: Locale }) {
  const navLinks = [
    { label: t(locale, "how_title_label"), href: "#how-it-works" },
    { label: t(locale, "nav_scoring"), href: "#scoring" },
    { label: t(locale, "nav_centers"), href: "#centers" },
    { label: t(locale, "nav_prize"), href: `/${locale}/prizes` },
  ];

  return (
    <footer className="bg-zinc-950 pt-20 pb-12 border-t border-zinc-900 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-full h-96 bg-lime-400/5 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand column */}
          <div className="col-span-1 md:col-span-2">
            <Link href={`/${locale}`} className="inline-flex items-center gap-3 mb-6 group">
              <Image
                src="/branding/garrincha-white.png"
                alt="GARRINCHA"
                width={140}
                height={36}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-zinc-500 text-sm max-w-sm mb-6 leading-relaxed">
              {t(locale, "ft_about")}
            </p>
            <LanguageSwitcher locale={locale} />
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">
              {t(locale, "ft_play")}
            </h4>
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-zinc-400 hover:text-lime-400 transition-colors text-sm uppercase tracking-wide"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={`/${locale}/leaderboards`}
                  className="text-zinc-400 hover:text-lime-400 transition-colors text-sm uppercase tracking-wide"
                >
                  {t(locale, "nav.leaderboards")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">
              {t(locale, "ft_legal")}
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="text-zinc-400 hover:text-lime-400 transition-colors text-sm uppercase tracking-wide"
                >
                  {t(locale, "footer.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="text-zinc-400 hover:text-lime-400 transition-colors text-sm uppercase tracking-wide"
                >
                  {t(locale, "footer.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/cookies`}
                  className="text-zinc-400 hover:text-lime-400 transition-colors text-sm uppercase tracking-wide"
                >
                  Cookies
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/login"
                  className="text-zinc-600 hover:text-zinc-400 transition-colors text-sm uppercase tracking-wide"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">
            {t(locale, "ft_copy")}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-zinc-600 text-xs font-mono uppercase tracking-widest">
              Systems Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
