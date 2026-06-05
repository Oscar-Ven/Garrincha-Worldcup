"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { type Locale, t } from "@/lib/translations";

type Props = {
  isLoggedIn: boolean;
  locale: Locale;
};

const ACTIVE_COLOR = "#5FE090";
const INACTIVE_COLOR = "rgba(241,245,238,0.42)";

function HomeIcon({ on }: { on: boolean }) {
  const c = on ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-5h-6v5H4a1 1 0 01-1-1z"
        stroke={c}
        strokeWidth="2"
        strokeLinejoin="round"
        fill={on ? "rgba(95,224,144,0.12)" : "none"}
      />
    </svg>
  );
}

function MatchesIcon({ on }: { on: boolean }) {
  const c = on ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth="2" fill={on ? "rgba(95,224,144,0.12)" : "none"} />
      <path d="M3 9h18" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 4v5M16 4v5" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14h2M11 14h2M15 14h2" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LeaderboardIcon({ on }: { on: boolean }) {
  const c = on ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4h10v3a5 5 0 01-10 0z"
        stroke={c}
        strokeWidth="2"
        strokeLinejoin="round"
        fill={on ? "rgba(95,224,144,0.12)" : "none"}
      />
      <path d="M5 5H3v1a3 3 0 003 3" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 5h2v1a3 3 0 01-3 3" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h6l-1 4H10l-1-4z" stroke={c} strokeWidth="2" strokeLinejoin="round" fill={on ? "rgba(95,224,144,0.12)" : "none"} />
      <path d="M9 20h6" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16v4" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function AccountIcon({ on }: { on: boolean }) {
  const c = on ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke={c}
        strokeWidth="2"
        fill={on ? "rgba(95,224,144,0.12)" : "none"}
      />
      <path
        d="M4 21c0-4 3.6-6 8-6s8 2 8 6"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function MobileNav({ isLoggedIn, locale }: Props) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/owner")) return null;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const items = [
    {
      k: "home",
      href: "/",
      icon: "home",
      label: t(locale, "nav.home"),
    },
    {
      k: "matches",
      href: "/matches",
      icon: "matches",
      label: t(locale, "nav.matches"),
    },
    {
      k: "ranks",
      href: "/leaderboards",
      icon: "leaderboard",
      label: "Leaderboard",
    },
    {
      k: "account",
      href: isLoggedIn ? "/dashboard" : "/register",
      icon: "account",
      label: "Account",
    },
  ];

  return (
    <div className="bottom-nav" aria-label="Mobile navigation">
      <nav className="bottom-nav-inner">
        {items.map((item) => {
          const on = isActive(item.href);
          return (
            <Link
              key={item.k}
              href={item.href}
              className={`bottom-nav-item${on ? " active" : ""}`}
            >
              {item.icon === "home" && <HomeIcon on={on} />}
              {item.icon === "matches" && <MatchesIcon on={on} />}
              {item.icon === "leaderboard" && <LeaderboardIcon on={on} />}
              {item.icon === "account" && <AccountIcon on={on} />}
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
