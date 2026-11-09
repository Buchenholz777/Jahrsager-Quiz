import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { absoluteUrl, OG_IMAGE_PATH, SITE_DESCRIPTION, SITE_TITLE, siteUrl } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { Beacon } from "@/components/beacon";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import "./globals.css";

// Schriften werden beim Build lokal eingebunden (keine Anfragen an Google Fonts, datenschutzfreundlich).
const outfit = localFont({
  variable: "--font-outfit",
  display: "swap",
  src: [
    { path: "../../node_modules/@fontsource/outfit/files/outfit-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/outfit/files/outfit-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/outfit/files/outfit-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../node_modules/@fontsource/outfit/files/outfit-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
});

const inter = localFont({
  variable: "--font-inter",
  display: "swap",
  src: [
    { path: "../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_TITLE, template: "%s – JAHRSAGER" },
  description: SITE_DESCRIPTION,
  applicationName: "JAHRSAGER",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "JAHRSAGER",
    locale: "de_DE",
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: "JAHRSAGER – Das tägliche Geschichtsquiz" }],
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION, images: [OG_IMAGE_PATH] },
  // Marken-Favicons unter stabilen Pfaden (Vielfaches von 48 px für Google, plus klassisches .ico)
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined },
};

export const viewport: Viewport = {
  themeColor: "#f7f5ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${outfit.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <JsonLd
          data={[
            { "@context": "https://schema.org", "@type": "WebSite", name: "JAHRSAGER", alternateName: "Jahrsager Quiz", url: absoluteUrl("/"), inLanguage: "de-DE", description: SITE_DESCRIPTION },
            { "@context": "https://schema.org", "@type": "Organization", name: "JAHRSAGER", url: absoluteUrl("/"), logo: absoluteUrl("/apple-touch-icon.png") },
          ]}
        />
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Zum Inhalt springen
        </a>
        <SiteHeader />
        <main id="inhalt" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <Beacon />
        <AnalyticsProvider />
      </body>
    </html>
  );
}
