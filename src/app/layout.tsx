import type { Metadata, Viewport } from "next";
import { Saira_Condensed, Saira, Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MobileNav } from "@/components/MobileNav";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0D0A",
};

/* next/font self-hosts the regular weights — zero external requests at runtime.
   The @import in globals.css adds the italic Saira Condensed variant only.     */
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

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const user = hasDatabaseConfig() ? await getCurrentUser() : null;
  const isAdmin = user?.role === "ADMIN" || user?.role === "CENTER_ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <html
      lang={locale}
      className={`${sairaCondensed.variable} ${saira.variable} ${hankenGrotesk.variable}`}
    >
      <body>
        <div className="app-shell">
          {/* ── Desktop topbar — hidden on mobile (bottom nav replaces it) ── */}
          <header className="site-topbar">
            <div className="site-topbar-inner">
              {/* Brand */}
              <Link href="/" className="site-topbar-brand" aria-label="GARRINCHA home">
                <Image
                  src="/garrincha-white.png"
                  alt="GARRINCHA"
                  height={18}
                  width={108}
                  style={{ height: 18, width: "auto" }}
                  priority
                />
              </Link>

              {/* Desktop nav links */}
              <nav className="site-topbar-nav" aria-label="Primary navigation">
                <Link href="/dashboard" className="site-nav-link">{t(locale, "nav.matches")}</Link>
                <Link href="/leaderboards" className="site-nav-link">{t(locale, "nav.leaderboards")}</Link>
                {isAdmin && (
                  <Link href="/admin" className="site-nav-link">{t(locale, "nav.admin")}</Link>
                )}
              </nav>

              {/* Right side: auth + language */}
              <div className="site-topbar-right">
                {user ? (
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" className="site-nav-btn site-nav-btn-ghost">
                      {t(locale, "nav.logout")}
                    </button>
                  </form>
                ) : (
                  <>
                    <Link href="/login" className="site-nav-btn site-nav-btn-ghost">{t(locale, "nav.login")}</Link>
                    <Link href="/register" className="site-nav-btn site-nav-btn-primary">{t(locale, "nav.register")}</Link>
                  </>
                )}
                <LanguageSwitcher locale={locale} />
              </div>
            </div>
          </header>

          {children}

          {/* Footer — only visible on public/player pages, not admin */}
          <footer className="site-footer-wrap">
            <div className="site-footer-inner">
              <Image
                src="/garrincha-white.png"
                alt="GARRINCHA"
                height={16}
                width={96}
                style={{ height: 16, width: "auto", opacity: 0.55 }}
              />
              <p className="site-footer-copy">{t(locale, "footer.text")}</p>
              <div className="site-footer-links">
                <Link href="/privacy">{t(locale, "footer.privacy")}</Link>
                <Link href="/terms">{t(locale, "footer.terms")}</Link>
                <Link href="/admin/login">{t(locale, "nav.admin")}</Link>
                <a href="https://www.garrincha.be" target="_blank" rel="noopener noreferrer">garrincha.be</a>
              </div>
              <p className="site-footer-legal">Kempes BV · BE0635670989 · ©2026 All rights reserved</p>
            </div>
          </footer>

          {/* Mobile bottom nav — auto-hides on /admin and /owner */}
          <MobileNav isLoggedIn={!!user} locale={locale} />
        </div>
      </body>
    </html>
  );
}
