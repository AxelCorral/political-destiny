import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { LocalPreferences } from "@/components/local-preferences";
import { PwaRegistrar } from "@/components/pwa-registrar";
import { BRANDING } from "@/config/branding";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://political-destiny.vercel.app"),
  title: {
    default: BRANDING.name,
    template: `%s — ${BRANDING.name}`,
  },
  description: BRANDING.description,
  applicationName: BRANDING.name,
  manifest: "/manifest.webmanifest",
  icons: [
    { rel: "icon", url: "/icons/emblem.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", url: "/icons/icon-192.svg" },
  ],
  openGraph: {
    title: BRANDING.name,
    description: BRANDING.description,
    siteName: BRANDING.name,
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: BRANDING.name }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#071426",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col antialiased">
        <LocalPreferences />
        <PwaRegistrar />
        <AnalyticsProvider />
        <a
          href="#contenu"
          className="sr-only z-[100] rounded-lg bg-white px-4 py-3 text-[var(--navy-950)] focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          Aller au contenu
        </a>
        <SiteHeader />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
