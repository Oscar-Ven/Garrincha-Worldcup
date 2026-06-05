import type { Metadata, Viewport } from "next";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0d0a",
};

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
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
