"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";
import { t, type Locale } from "@/lib/translations";
import LanguageSwitcher from "./LanguageSwitcher";
import { usePathname } from "next/navigation";

export default function Navbar({ locale }: { locale: Locale }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === `/${locale}` || pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const anchorLinks = [
    { label: t(locale, "how_title_label"), href: isHome ? "#how-it-works" : `/${locale}#how-it-works` },
    { label: t(locale, "nav_scoring"), href: isHome ? "#scoring" : `/${locale}#scoring` },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center group">
          <Image
            src="/branding/garrincha-white.png"
            alt="GARRINCHA"
            width={140}
            height={36}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {anchorLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-bold tracking-wide text-zinc-300 hover:text-lime-400 transition-colors uppercase"
            >
              {link.label}
            </a>
          ))}
          <Link
            href={`/${locale}/matches`}
            className={`text-sm font-bold tracking-wide uppercase transition-colors ${
              pathname?.includes("/matches") ? "text-lime-400" : "text-zinc-300 hover:text-lime-400"
            }`}
          >
            {t(locale, "nav.matches")}
          </Link>
          <Link
            href={`/${locale}/leaderboards`}
            className={`text-sm font-bold tracking-wide uppercase transition-colors ${
              pathname?.includes("/leaderboards") ? "text-lime-400" : "text-zinc-300 hover:text-lime-400"
            }`}
          >
            {t(locale, "nav.leaderboards")}
          </Link>
          <Link
            href={`/${locale}/prizes`}
            className={`text-sm font-bold tracking-wide uppercase transition-colors ${
              pathname?.includes("/prizes") ? "text-lime-400" : "text-zinc-300 hover:text-lime-400"
            }`}
          >
            {t(locale, "nav_prize")}
          </Link>
        </div>

        {/* Desktop right: language + CTA */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher locale={locale} />
          <Link
            href={`/${locale}/login`}
            className="text-sm font-bold tracking-wide text-zinc-400 hover:text-white transition-colors uppercase"
          >
            Login
          </Link>
          <Link
            href={`/${locale}/register`}
            className="flex items-center gap-2 px-5 py-2.5 bg-lime-400 text-zinc-950 font-black uppercase tracking-wider text-sm hover:bg-lime-300 transition-colors shadow-[0_0_15px_rgba(10,238,150,0.4)]"
          >
            {t(locale, "nav_register")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white p-3"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden absolute top-full left-0 w-full bg-zinc-950 border-b border-zinc-800 p-6 flex flex-col gap-5 shadow-2xl">
          {anchorLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-base font-bold tracking-wide text-zinc-300 hover:text-lime-400 transition-colors uppercase"
            >
              {link.label}
            </a>
          ))}
          <Link
            href={`/${locale}/matches`}
            onClick={() => setOpen(false)}
            className="text-base font-bold tracking-wide text-zinc-300 hover:text-lime-400 transition-colors uppercase"
          >
            {t(locale, "nav.matches")}
          </Link>
          <Link
            href={`/${locale}/leaderboards`}
            onClick={() => setOpen(false)}
            className="text-base font-bold tracking-wide text-zinc-300 hover:text-lime-400 transition-colors uppercase"
          >
            {t(locale, "nav.leaderboards")}
          </Link>
          <Link
            href={`/${locale}/prizes`}
            onClick={() => setOpen(false)}
            className="text-base font-bold tracking-wide text-zinc-300 hover:text-lime-400 transition-colors uppercase"
          >
            {t(locale, "nav_prize")}
          </Link>
          <div className="h-px bg-zinc-800 w-full" />
          <LanguageSwitcher locale={locale} />
          <Link
            href={`/${locale}/login`}
            onClick={() => setOpen(false)}
            className="text-center px-6 py-3 border border-zinc-700 text-zinc-300 font-bold uppercase tracking-wider hover:border-zinc-500 transition-colors text-sm"
          >
            Login
          </Link>
          <Link
            href={`/${locale}/register`}
            className="text-center px-6 py-3 bg-lime-400 text-zinc-950 font-black uppercase tracking-wider hover:bg-lime-300 transition-colors"
            onClick={() => setOpen(false)}
          >
            {t(locale, "cta_register")}
          </Link>
        </div>
      )}
    </nav>
  );
}
