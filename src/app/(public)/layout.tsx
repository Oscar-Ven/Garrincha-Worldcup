import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";
import { NavLink } from "@/components/NavLink";
import { PublicFooter } from "@/components/PublicFooter";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

function UserAvatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  return (
    <Link
      href="/dashboard"
      className="topbar-user-avatar"
      aria-label={`Dashboard — ${name}`}
      title={name}
    >
      {initials}
    </Link>
  );
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const user = hasDatabaseConfig() ? await getCurrentUser() : null;
  const isAdmin =
    user?.role === "ADMIN" ||
    user?.role === "CENTER_ADMIN" ||
    user?.role === "SUPER_ADMIN";
  const displayName = user
    ? ((user as { nickname?: string | null }).nickname ?? user.fullName ?? user.email ?? "")
    : "";

  return (
    <>
      <header className="site-nav">
        <div className="container site-nav-inner">
          <Link href="/" className="site-nav-brand" aria-label="GARRINCHA home">
            <Image
              src="/branding/garrincha-white.png"
              alt=""
              width={270}
              height={66}
              className="site-nav-brand-logo"
              style={{ width: "auto", height: 26 }}
              priority
            />
            <div className="site-nav-brand-text">
              <span className="site-nav-brand-name">GARRINCHA</span>
              <span className="site-nav-brand-sub">World Cup 2026</span>
            </div>
          </Link>

          <nav aria-label="Primary navigation" className="site-nav-desktop-only">
            <ul className="site-nav-links">
              <li><NavLink href="/matches">Matches</NavLink></li>
              <li><NavLink href="/leaderboards">Leaderboard</NavLink></li>
              {user && (
                <li><NavLink href="/dashboard">{t(locale, "nav.predict")}</NavLink></li>
              )}
              {isAdmin && (
                <li><NavLink href="/admin">{t(locale, "nav.admin")}</NavLink></li>
              )}
            </ul>
          </nav>

          <div className="site-nav-right">
            {user ? (
              <>
                <UserAvatar name={displayName} />
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm site-nav-desktop-only"
                  >
                    {t(locale, "nav.logout")}
                  </button>
                </form>
              </>
            ) : (
              <Link href="/register" className="btn btn-primary btn-sm">
                {t(locale, "nav.register")}
              </Link>
            )}
          </div>
        </div>
      </header>

      {children}

      <PublicFooter />

      <MobileNav isLoggedIn={!!user} locale={locale} />
    </>
  );
}
