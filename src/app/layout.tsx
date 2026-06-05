import type { Metadata, Viewport } from "next";
import { Saira_Condensed, Saira, Roboto } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
  themeColor: "#1B4332",
};

// ── Brand display font (Saira Condensed — kept for GARRINCHA logo/headings only)
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

// ── Body/UI font — Roboto (same as www.garrincha.be)
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
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <Link
      href="/dashboard"
      className="nav-avatar"
      aria-label={`Dashboard — ${name}`}
      title={name}
    >
      {initials}
    </Link>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const user = hasDatabaseConfig() ? await getCurrentUser() : null;
  const isAdmin = user?.role === "ADMIN" || user?.role === "CENTER_ADMIN" || user?.role === "SUPER_ADMIN";
  const displayName = user
    ? ((user as { nickname?: string | null }).nickname ?? user.fullName ?? user.email ?? "")
    : "";

  // Determine the admin nav label based on role
  const adminNavLabel = user?.role === "SUPER_ADMIN"
    ? "Owner"
    : "Manager";

  return (
    <html
      lang={locale}
      className={`${sairaCondensed.variable} ${saira.variable} ${roboto.variable}`}
    >
      <body>
        <div className="app-shell">
          {/* ── Desktop nav ── */}
          <header className="nav">
            <div className="nav-inner">
              <Link href="/" className="nav-brand" aria-label="GARRINCHA home">
                <Image
                  src="/garrincha-black.png"
                  alt="GARRINCHA"
                  height={26}
                  width={156}
                  style={{ height: 26, width: "auto" }}
                  priority
                />
              </Link>

              <nav className="nav-links" aria-label="Primary navigation">
                <NavLink href="/matches" className="nav-link">{t(locale, "nav.matches")}</NavLink>
                <NavLink href="/leaderboards" className="nav-link">{t(locale, "nav.leaderboards")}</NavLink>
                {user && (
                  <NavLink href="/dashboard" className="nav-link">{t(locale, "nav.predict")}</NavLink>
                )}
                {isAdmin && (
                  <NavLink href="/admin" className="nav-link">{adminNavLabel}</NavLink>
                )}
              </nav>

              <div className="nav-right">
                {user ? (
                  <>
                    <UserAvatar name={displayName} />
                    <form action="/api/auth/logout" method="post">
                      <button type="submit" className="btn-ghost">
                        {t(locale, "nav.logout")}
                      </button>
                    </form>
                  </>
                ) : (
                  <Link href="/register" className="btn-primary">
                    {t(locale, "nav.register")}
                  </Link>
                )}
                <LanguageSwitcher locale={locale} />
              </div>
            </div>
          </header>

          {children}

          <div className="layout-footer-slot">
            <PublicFooter />
          </div>

          <MobileNav isLoggedIn={!!user} locale={locale} />
        </div>
      </body>
    </html>
  );
}
