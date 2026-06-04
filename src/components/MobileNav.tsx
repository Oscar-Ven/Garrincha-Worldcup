"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, LogIn, LogOut } from "lucide-react";

type Props = {
  isLoggedIn: boolean;
};

export function MobileNav({ isLoggedIn }: Props) {
  const pathname = usePathname();

  // Desktop-only pages — hide bottom nav
  if (pathname.startsWith("/admin") || pathname.startsWith("/owner")) return null;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    // DaisyUI btm-nav — mobile-only via CSS
    <nav className="btm-nav btm-nav-garrincha" aria-label="Mobile navigation">
      <Link
        href="/"
        className={isActive("/") ? "active" : ""}
        aria-label="Home"
      >
        <Home size={22} strokeWidth={2} />
        <span className="btm-nav-label">Home</span>
      </Link>

      <Link
        href="/dashboard"
        className={isActive("/dashboard") ? "active" : ""}
        aria-label="Predict"
      >
        <span className="btm-nav-emoji" aria-hidden>⚽</span>
        <span className="btm-nav-label">Predict</span>
      </Link>

      <Link
        href="/leaderboards"
        className={isActive("/leaderboards") ? "active" : ""}
        aria-label="Rankings"
      >
        <Trophy size={22} strokeWidth={2} />
        <span className="btm-nav-label">Rankings</span>
      </Link>

      {isLoggedIn ? (
        <form action="/api/auth/logout" method="post" className="btm-nav-form">
          <button type="submit" aria-label="Log out">
            <LogOut size={22} strokeWidth={2} />
            <span className="btm-nav-label">Logout</span>
          </button>
        </form>
      ) : (
        <Link
          href="/login"
          className={isActive("/login") ? "active" : ""}
          aria-label="Log in"
        >
          <LogIn size={22} strokeWidth={2} />
          <span className="btm-nav-label">Login</span>
        </Link>
      )}
    </nav>
  );
}
