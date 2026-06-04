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

const sairaCondensed = Saira_Condensed({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-saira-condensed",
  display: "swap",
});

const saira = Saira({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
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
      style={{ background: "var(--bg)" }}
    >
      <body>
        <div className="app-shell">
          {/* Top nav — hidden on mobile (replaced by bottom nav) */}
          <header className="topbar" style={{ display: "none" }} aria-hidden="true">
            <div className="topbar-inner">
              <Link href="/" style={{ display: "flex", alignItems: "center" }}>
                <Image src="/garrincha-white.png" alt="GARRINCHA" height={20} width={120} style={{ height: 20, width: "auto" }} />
              </Link>
              <nav style={{ display: "flex", alignItems: "center", gap: 12 }} aria-label="Primary navigation">
                <Link href="/dashboard" style={{ color: "var(--ink-dim)", fontFamily: "var(--f-disp)", fontStyle: "italic", fontWeight: 900, textTransform: "uppercase", fontSize: 14 }}>{t(locale, "nav.matches")}</Link>
                <Link href="/leaderboards" style={{ color: "var(--ink-dim)", fontFamily: "var(--f-disp)", fontStyle: "italic", fontWeight: 900, textTransform: "uppercase", fontSize: 14 }}>{t(locale, "nav.leaderboards")}</Link>
                {isAdmin && (
                  <Link href="/admin" style={{ color: "var(--ink-dim)", fontFamily: "var(--f-disp)", fontStyle: "italic", fontWeight: 900, textTransform: "uppercase", fontSize: 14 }}>{t(locale, "nav.admin")}</Link>
                )}
                {user ? (
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" style={{ background: "none", border: "1.5px solid var(--line-2)", borderRadius: 8, color: "var(--ink-dim)", cursor: "pointer", padding: "8px 14px", fontFamily: "var(--f-disp)", fontStyle: "italic", fontWeight: 900, textTransform: "uppercase", fontSize: 13 }}>{t(locale, "nav.logout")}</button>
                  </form>
                ) : (
                  <Link href="/register" style={{ background: "var(--green)", color: "#06210F", borderRadius: 8, padding: "8px 16px", fontFamily: "var(--f-disp)", fontStyle: "italic", fontWeight: 900, textTransform: "uppercase", fontSize: 13 }}>{t(locale, "nav.register")}</Link>
                )}
                <LanguageSwitcher locale={locale} />
              </nav>
            </div>
          </header>

          {children}

          {/* Footer */}
          <footer style={{ background: "var(--bg-2)", borderTop: "1px solid var(--line)", padding: "32px 22px 120px", marginTop: 32 }}>
            <div style={{ maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
              <Image src="/garrincha-white.png" alt="GARRINCHA" height={18} width={120} style={{ height: 18, width: "auto", opacity: 0.7 }} />
              <p style={{ fontSize: 13, color: "var(--ink-faint)", lineHeight: 1.5, margin: 0 }}>
                {t(locale, "footer.text")}
              </p>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <Link href="/privacy" style={{ fontSize: 12, color: "var(--ink-faint)" }}>{t(locale, "footer.privacy")}</Link>
                <Link href="/terms" style={{ fontSize: 12, color: "var(--ink-faint)" }}>{t(locale, "footer.terms")}</Link>
                <Link href="/admin/login" style={{ fontSize: 12, color: "var(--ink-faint)" }}>{t(locale, "nav.admin")}</Link>
              </div>
              <p style={{ fontSize: 11, color: "var(--ink-faint)", opacity: 0.5, margin: 0 }}>
                Kempes BV · BE0635670989 · ©2026
              </p>
            </div>
          </footer>

          <MobileNav isLoggedIn={!!user} locale={locale} />
        </div>
      </body>
    </html>
  );
}
