import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { getLocale } from "@/lib/i18n";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
import AddToHomeScreenPrompt from "@/components/pwa/AddToHomeScreenPrompt";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: {
    default: "GARRINCHA® World Cup Pronostiek 2026",
    template: "%s — GARRINCHA® World Cup",
  },
  description:
    "The official World Cup 2026 prediction campaign for GARRINCHA Centers. Predict scores, earn points, represent your center. Free to play.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  appleWebApp: {
    capable: true,
    title: "GARRINCHA",
    statusBarStyle: "default",
  },
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
    <html lang={locale} className={inter.variable}>
      <body className="bg-zinc-950 text-white antialiased">
        {children}
        <ServiceWorkerRegistration />
        <AddToHomeScreenPrompt />
      </body>
    </html>
  );
}
