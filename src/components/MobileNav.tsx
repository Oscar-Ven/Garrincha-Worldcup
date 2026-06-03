"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, LogIn, LogOut } from "lucide-react";

type Props = {
  isLoggedIn: boolean;
};

export function MobileNav({ isLoggedIn }: Props) {
  const pathname = usePathname();

  // Hide on all admin / owner pages — desktop-only
  if (pathname.startsWith("/admin") || pathname.startsWith("/owner")) return null;

  const active = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href))
      ? " active"
      : "";

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link href="/" className={`mobile-nav-item${active("/")}`}>
        <Home size={22} strokeWidth={2} />
        <span>Home</span>
      </Link>

      <Link href="/dashboard" className={`mobile-nav-item${active("/dashboard")}`}>
        {/* Football icon via emoji — Lucide doesn't have one */}
        <span className="mobile-nav-icon-emoji" aria-hidden>⚽</span>
        <span>Predict</span>
      </Link>

      <Link href="/leaderboards" className={`mobile-nav-item${active("/leaderboards")}`}>
        <Trophy size={22} strokeWidth={2} />
        <span>Rankings</span>
      </Link>

      {isLoggedIn ? (
        <form action="/api/auth/logout" method="post" className="mobile-nav-item-form">
          <button type="submit" className="mobile-nav-item">
            <LogOut size={22} strokeWidth={2} />
            <span>Logout</span>
          </button>
        </form>
      ) : (
        <Link href="/login" className={`mobile-nav-item${active("/login")}`}>
          <LogIn size={22} strokeWidth={2} />
          <span>Login</span>
        </Link>
      )}
    </nav>
  );
}
