import type { Metadata, Viewport } from "next";
import { Saira_Condensed, Saira, Roboto } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { MobileNav } from "@/components/MobileNav";
import { NavLink } from "@/components/NavLink";
import { PublicFooter } from "@/components/PublicFooter";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

const sairaCondensed = Saira_Condensed({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-saira-condensed",
  display: "swap",
});

const saira = Saira({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-saira",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GARRINCHA® World Cup Pronostiek 2026",
    template: "%s — GARRINCHA® World Cup",
  },
  description:
    "The official World Cup 2026 prediction campaign for GARRINCHA Centers. Predict scores, earn points, represent your center. Free to play.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: "GARRINCHA® World Cup Pronostiek",
    title: "GARRINCHA® World Cup Pronostiek 2026",
    description:
      "Predict World Cup 2026 scores, earn points, and represent your GARRINCHA Center. Scan the QR code to join.",
  },
  twitter: {
    card: "summary",
    title: "GARRINCHA® World Cup Pronostiek 2026",
    description: "Predict World Cup 2026 scores and compete across GARRINCHA Centers.",
  },
  robots: { index: true, follow: true },
  authors: [{ name: "Kempes BV", url: "https://www.garrincha.be" }],
};

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
    <html
      lang={locale}
      className={`${sairaCondensed.variable} ${saira.variable} ${roboto.variable}`}
    >
      <body>
        {/* ── Site nav ── */}
        <header className="site-nav">
          <div className="container site-nav-inner">
            {/* Brand */}
            <Link href="/" className="site-nav-brand" aria-label="GARRINCHA home">
              <div className="site-nav-logo">
                <Image
                  src="/images/player-medal.png"
                  alt="GARRINCHA logo"
                  width={44}
                  height={44}
                  priority
                />
              </div>
              <div className="site-nav-brand-text">
                <span className="site-nav-brand-name">GARRINCHA</span>
                <span className="site-nav-brand-sub">World Cup 2026</span>
              </div>
            </Link>

            {/* Center links */}
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

            {/* Right */}
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
      </body>
    </html>
  );
}
