import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import Link from "next/link";
import { GarrinchaLogo } from "@/components/GarrinchaLogo";
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
  themeColor: "#08eb9a",
};

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GARRINCHA® World Cup Pronostiek 2026",
    template: "%s — GARRINCHA® World Cup",
  },
  description:
    "De officiële World Cup 2026 pronostiek voor GARRINCHA Centers. Voorspel de matchen, verzamel punten en strijd voor je center. Gratis te spelen.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: "GARRINCHA® World Cup Pronostiek",
    title: "GARRINCHA® World Cup Pronostiek 2026",
    description:
      "Voorspel WK 2026 scores, verdien punten en strijdt voor jouw GARRINCHA Center. Scan de QR-code en speel mee.",
    locale: "nl_BE",
  },
  twitter: {
    card: "summary",
    title: "GARRINCHA® World Cup Pronostiek 2026",
    description: "Predict World Cup 2026 scores and compete across GARRINCHA Centers.",
  },
  robots: { index: true, follow: true },
  authors: [{ name: "Kempes BV", url: "https://www.garrincha.be" }],
  creator: "Kempes BV",
  publisher: "Kempes BV",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const user = hasDatabaseConfig() ? await getCurrentUser() : null;

  return (
    <html lang={locale} className={`${barlowCondensed.variable} ${inter.variable}`}>
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="brand-lockup" href="/">
                <GarrinchaLogo compact />
                <span className="brand-subtitle">{t(locale, "nav.pronostiek")}</span>
              </Link>
              <nav className="nav" aria-label="Primary navigation">
                <Link href="/dashboard">{t(locale, "nav.matches")}</Link>
                <Link href="/leaderboards">{t(locale, "nav.leaderboards")}</Link>
                {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? (
                  <Link href="/admin">{t(locale, "nav.admin")}</Link>
                ) : null}
                {user?.role === "SUPER_ADMIN" ? (
                  <Link className="primary" href="/owner">👑 Owner</Link>
                ) : null}
                {user ? (
                  <form action="/api/auth/logout" method="post">
                    <button type="submit">{t(locale, "nav.logout")}</button>
                  </form>
                ) : (
                  <>
                    <Link href="/login">{t(locale, "nav.login")}</Link>
                    <Link className="primary" href="/register">
                      {t(locale, "nav.register")}
                    </Link>
                  </>
                )}
                <LanguageSwitcher locale={locale} />
              </nav>
            </div>
          </header>
          {children}
          <footer className="site-footer">
            <div className="footer-brand">
              <strong>GARRINCHA<sup style={{ color: "var(--green)", fontSize: "0.55em", verticalAlign: "super" }}>®</sup> World Cup Pronostiek</strong>
              <p>{t(locale, "footer.text")}</p>
              <p className="footer-legal">
                Kempes BV · BE0635670989 · Kortrijksesteenweg 1166, 9051 Gent
              </p>
              <p className="footer-copy">©2026 Kempes BV — All rights reserved</p>
            </div>
            <div className="footer-cols">
              <div>
                <span className="footer-col-label">Platform</span>
                <div className="footer-links">
                  <Link href="/dashboard">{t(locale, "nav.matches")}</Link>
                  <Link href="/leaderboards">{t(locale, "nav.leaderboards")}</Link>
                  <Link href="/register">{t(locale, "nav.register")}</Link>
                </div>
              </div>
              <div>
                <span className="footer-col-label">Legal</span>
                <div className="footer-links">
                  <Link href="/privacy">{t(locale, "footer.privacy")}</Link>
                  <Link href="/terms">{t(locale, "footer.terms")}</Link>
                  <Link href="/admin/login">{t(locale, "nav.admin")}</Link>
                </div>
              </div>
              <div>
                <span className="footer-col-label">GARRINCHA®</span>
                <div className="footer-links">
                  <a href="https://www.garrincha.be" target="_blank" rel="noopener noreferrer">garrincha.be</a>
                  <a href="https://www.facebook.com/garrinchabelgium/" target="_blank" rel="noopener noreferrer">Facebook</a>
                  <a href="https://www.instagram.com/garrincha_belgium/" target="_blank" rel="noopener noreferrer">Instagram</a>
                  <a href="https://www.linkedin.com/company/garrincha/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                </div>
              </div>
            </div>
          </footer>
          <MobileNav isLoggedIn={!!user} />
        </div>
      </body>
    </html>
  );
}
