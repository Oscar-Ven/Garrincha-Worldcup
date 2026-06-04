"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, LogIn, LogOut } from "lucide-react";
import { type Locale, t } from "@/lib/translations";

type Props = {
  isLoggedIn: boolean;
  locale: Locale;
};

export function MobileNav({ isLoggedIn, locale }: Props) {
  const pathname = usePathname();

  // Desktop-only pages — hide bottom nav
  if (pathname.startsWith("/admin") || pathname.startsWith("/owner")) return null;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <nav className="btm-nav btm-nav-garrincha" aria-label="Mobile navigation">
      <Link
        href="/"
        className={isActive("/") ? "active" : ""}
        aria-label={t(locale, "nav.home")}
      >
        <Home size={22} strokeWidth={2} />
        <span className="btm-nav-label">{t(locale, "nav.home")}</span>
      </Link>

      <Link
        href="/dashboard"
        className={isActive("/dashboard") ? "active" : ""}
        aria-label={t(locale, "nav.predict")}
      >
        <span className="btm-nav-emoji" aria-hidden>⚽</span>
        <span className="btm-nav-label">{t(locale, "nav.predict")}</span>
      </Link>

      <Link
        href="/leaderboards"
        className={isActive("/leaderboards") ? "active" : ""}
        aria-label={t(locale, "nav.rankings")}
      >
        <Trophy size={22} strokeWidth={2} />
        <span className="btm-nav-label">{t(locale, "nav.rankings")}</span>
      </Link>

      {isLoggedIn ? (
        <form action="/api/auth/logout" method="post" className="btm-nav-form">
          <button type="submit" aria-label={t(locale, "nav.logout")}>
            <LogOut size={22} strokeWidth={2} />
            <span className="btm-nav-label">{t(locale, "nav.logout")}</span>
          </button>
        </form>
      ) : (
        <Link
          href="/login"
          className={isActive("/login") ? "active" : ""}
          aria-label={t(locale, "nav.login")}
        >
          <LogIn size={22} strokeWidth={2} />
          <span className="btm-nav-label">{t(locale, "nav.login")}</span>
        </Link>
      )}
    </nav>
  );
}
