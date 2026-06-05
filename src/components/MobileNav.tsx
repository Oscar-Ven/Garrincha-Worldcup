"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { type Locale } from "@/lib/translations";

type Props = {
  isLoggedIn: boolean;
  locale: Locale;
};

const ON = "#5FE090";
const OFF = "rgba(241,245,238,0.42)";

function HomeIcon({ on }: { on: boolean }) {
  const c = on ? ON : OFF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-5h-6v5H4a1 1 0 01-1-1z"
        stroke={c} strokeWidth="2" strokeLinejoin="round"
        fill={on ? "rgba(95,224,144,0.12)" : "none"} />
    </svg>
  );
}

function LeaderboardIcon({ on }: { on: boolean }) {
  const c = on ? ON : OFF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4h10v3a5 5 0 01-10 0z" stroke={c} strokeWidth="2" strokeLinejoin="round" fill={on ? "rgba(95,224,144,0.12)" : "none"} />
      <path d="M5 5H3v1a3 3 0 003 3" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 5h2v1a3 3 0 01-3 3" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h6l-1 4H10l-1-4z" stroke={c} strokeWidth="2" strokeLinejoin="round" fill={on ? "rgba(95,224,144,0.12)" : "none"} />
      <path d="M9 20h6M12 16v4" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FixturesIcon({ on }: { on: boolean }) {
  const c = on ? ON : OFF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth="2" fill={on ? "rgba(95,224,144,0.12)" : "none"} />
      <path d="M3 9h18M8 4v5M16 4v5" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14h2M11 14h2M15 14h2" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RewardsIcon({ on }: { on: boolean }) {
  const c = on ? ON : OFF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={c} strokeWidth="1.8" strokeLinejoin="round"
        fill={on ? "rgba(95,224,144,0.12)" : "none"} />
    </svg>
  );
}

function StatsIcon({ on }: { on: boolean }) {
  const c = on ? ON : OFF;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="13" width="4" height="8" rx="1" stroke={c} strokeWidth="2" fill={on ? "rgba(95,224,144,0.12)" : "none"} />
      <rect x="10" y="8" width="4" height="13" rx="1" stroke={c} strokeWidth="2" fill={on ? "rgba(95,224,144,0.12)" : "none"} />
      <rect x="18" y="3" width="4" height="18" rx="1" stroke={c} strokeWidth="2" fill={on ? "rgba(95,224,144,0.12)" : "none"} />
    </svg>
  );
}

export function MobileNav({ isLoggedIn, locale: _locale }: Props) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/owner")) return null;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href.split("#")[0]));

  const items = [
    { k: "home",        href: "/",             icon: "home",        label: "HOME" },
    { k: "leaderboard", href: "/leaderboards",  icon: "leaderboard", label: "LEADERBOARD" },
    { k: "fixtures",    href: "/matches",       icon: "fixtures",    label: "FIXTURES" },
    { k: "rewards",     href: isLoggedIn ? "/dashboard#rewards" : "/register", icon: "rewards", label: "REWARDS" },
    { k: "stats",       href: isLoggedIn ? "/dashboard#stats"   : "/register", icon: "stats",   label: "STATS" },
  ];

  return (
    <div className="bottom-nav" aria-label="Mobile navigation">
      <nav className="bottom-nav-inner">
        {items.map((item) => {
          const on = isActive(item.href);
          return (
            <Link key={item.k} href={item.href} className={`bottom-nav-item${on ? " active" : ""}`}>
              {item.icon === "home"        && <HomeIcon on={on} />}
              {item.icon === "leaderboard" && <LeaderboardIcon on={on} />}
              {item.icon === "fixtures"    && <FixturesIcon on={on} />}
              {item.icon === "rewards"     && <RewardsIcon on={on} />}
              {item.icon === "stats"       && <StatsIcon on={on} />}
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
