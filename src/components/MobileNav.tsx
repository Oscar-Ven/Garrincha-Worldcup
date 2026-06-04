"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { type Locale, t } from "@/lib/translations";

type Props = {
  isLoggedIn: boolean;
  locale: Locale;
};

function NavIcon({ name, on }: { name: string; on: boolean }) {
  const c = on ? "var(--green)" : "var(--ink-faint)";
  const sw = on ? 2.3 : 2;

  const paths: Record<string, React.ReactNode> = {
    home: (
      <path
        d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"
        stroke={c}
        strokeWidth={sw}
        fill={on ? "rgba(95,224,144,0.12)" : "none"}
        strokeLinejoin="round"
      />
    ),
    ball: (
      <g>
        <circle cx="12" cy="12" r="9" stroke={c} strokeWidth={sw} fill={on ? "rgba(95,224,144,0.12)" : "none"} />
        <path d="M12 7l3 2-1 4h-4l-1-4z" stroke={c} strokeWidth={sw * 0.8} fill="none" strokeLinejoin="round" />
      </g>
    ),
    chart: (
      <g>
        <path d="M5 21V10M12 21V4M19 21v-7" stroke={c} strokeWidth={sw} strokeLinecap="round" />
      </g>
    ),
    trophy: (
      <path
        d="M7 4h10v3a5 5 0 01-10 0zM5 5H3v1a3 3 0 003 3M19 5h2v1a3 3 0 01-3 3M9 14h6l-1 4h-4z"
        stroke={c}
        strokeWidth={sw}
        fill={on ? "rgba(95,224,144,0.12)" : "none"}
        strokeLinejoin="round"
      />
    ),
    user: (
      <g>
        <circle cx="12" cy="8" r="4" stroke={c} strokeWidth={sw} fill={on ? "rgba(95,224,144,0.12)" : "none"} />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
      </g>
    ),
    logout: (
      <g>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" />
        <polyline points="16,17 21,12 16,7" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="21" y1="12" x2="9" y2="12" stroke={c} strokeWidth={sw} strokeLinecap="round" />
      </g>
    ),
  };

  return (
    <svg width="23" height="23" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

export function MobileNav({ isLoggedIn, locale }: Props) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/owner")) return null;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const items = [
    { k: "home",    href: "/",            icon: "home",  label: t(locale, "nav.home") },
    { k: "matches", href: "/matches",     icon: "ball",  label: t(locale, "nav.matches") },
    { k: "ranks",   href: "/leaderboards",icon: "chart", label: t(locale, "nav.rankings") },
    ...(isLoggedIn ? [{ k: "predict", href: "/dashboard", icon: "user", label: t(locale, "nav.predict") }] : []),
  ];

  return (
    <div className="btm-nav-garrincha" aria-label="Mobile navigation">
      <nav className="btm-nav-pill">
        {items.map((item) => {
          const on = isActive(item.href);
          return (
            <Link key={item.k} href={item.href} className={`btm-nav-item${on ? " active" : ""}`}>
              {on && <span className="btm-nav-dot" />}
              <NavIcon name={item.icon} on={on} />
              <span className="btm-nav-label">{item.label}</span>
            </Link>
          );
        })}

        {isLoggedIn ? (
          <div className="btm-nav-form">
            <form action="/api/auth/logout" method="post">
              <button type="submit" aria-label={t(locale, "nav.logout")}>
                <NavIcon name="logout" on={false} />
                <span className="btm-nav-label">{t(locale, "nav.logout")}</span>
              </button>
            </form>
          </div>
        ) : (
          <Link href="/register" className={`btm-nav-item${isActive("/register") ? " active" : ""}`}>
            {isActive("/register") && <span className="btm-nav-dot" />}
            <NavIcon name="user" on={isActive("/register")} />
            <span className="btm-nav-label">{t(locale, "nav.register")}</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
