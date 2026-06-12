"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CircleUserRound,
  Coins,
  Gift,
  House,
  Landmark,
  LogOut,
  Menu,
  Target,
  Trophy,
  X,
} from "lucide-react";

type PlayerNavLabels = {
  home: string;
  predictions: string;
  matches: string;
  leaderboard: string;
  profile: string;
  points: string;
  center: string;
  logout: string;
};

type PlayerShellProps = {
  user: {
    fullName: string;
    nickname: string;
    email: string;
    centerName: string;
    avatarUrl: string | null;
  };
  labels: PlayerNavLabels;
  hasLiveMatch: boolean;
  children: React.ReactNode;
};

export default function PlayerShell({ user, labels, hasLiveMatch, children }: PlayerShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-refresh: 30 s during a live match, 2 min otherwise.
  // Pages are force-dynamic so every refresh fetches fresh scores + leaderboard.
  useEffect(() => {
    const intervalMs = hasLiveMatch ? 30_000 : 120_000;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [hasLiveMatch, router]);

  const links = [
    { href: "/dashboard", label: labels.home, icon: House },
    { href: "/predictions", label: labels.predictions, icon: Target },
    { href: "/matches", label: labels.matches, icon: CalendarDays },
    { href: "/leaderboards", label: labels.leaderboard, icon: Trophy },
    { href: "/my-points", label: labels.points, icon: Coins },
    { href: "/center", label: labels.center, icon: Landmark },
    { href: "/prizes", label: "Prizes", icon: Gift },
    { href: "/profile", label: labels.profile, icon: CircleUserRound },
  ];

  async function handleLogout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1b2a17_0%,#0a0d0a_30%,#09090b_100%)] text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-360">
        <aside className="hidden w-72 shrink-0 border-r border-white/6 bg-black/20 backdrop-blur xl:flex xl:flex-col">
          <div className="border-b border-white/6 px-6 py-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-lime-400">GARRINCHA</div>
            <div className="mt-2 text-xl font-semibold tracking-tight text-white">World Cup Challenge</div>
            <div className="mt-1 text-sm text-zinc-400">Player app</div>
          </div>

          <div className="flex-1 px-4 py-5">
            <nav className="space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-w-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-lime-400 text-zinc-950"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/6 px-4 py-4">
            <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-400/15 text-sm font-bold uppercase text-lime-300">
                  {user.nickname.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{user.nickname}</div>
                  <div className="truncate text-xs text-zinc-400">{user.centerName}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-zinc-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                <span>{labels.logout}</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/6 bg-zinc-950/80 px-4 py-3 backdrop-blur md:px-6 xl:hidden">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-400">GARRINCHA</div>
              <div className="truncate text-sm font-semibold text-white">{user.centerName}</div>
            </div>
            <button
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-zinc-100"
              aria-label="Toggle player navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </header>

          {mobileOpen && (
            <div className="border-b border-white/6 bg-zinc-950 px-4 py-4 xl:hidden">
              <nav className="grid grid-cols-2 gap-2">
                {links.map((link) => {
                  const Icon = link.icon;
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-w-0 items-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium ${
                        active ? "bg-lime-400 text-zinc-950" : "bg-white/5 text-zinc-300"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300"
              >
                <LogOut className="h-4 w-4" />
                <span>{labels.logout}</span>
              </button>
            </div>
          )}

          <main className="min-w-0 flex-1 px-4 py-5 pb-28 md:px-6 md:py-6 xl:px-8 xl:pb-8">{children}</main>

          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/6 bg-zinc-950/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur xl:hidden">
            <div className="grid grid-cols-4 gap-1">
              {links.slice(0, 4).map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium ${
                      active ? "bg-lime-400/15 text-lime-300" : "text-zinc-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}