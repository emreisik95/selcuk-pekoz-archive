import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { Banner } from "@/components/Banner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const SITE_NAME = "Selçuk Peköz Yayın Arşivi";
const SITE_DESC =
  "Selçuk Peköz'ün YouTube canlı yayınlarını takip eden resmi olmayan fan projesi. Yaklaşan yayınlar, takvim, geçmiş arşivi, istatistikler.";

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  authors: [{ name: "Fan projesi" }],
  keywords: [
    "Selçuk Peköz",
    "YouTube canlı",
    "yayın arşivi",
    "Nintendo",
    "Pokemon",
    "Mario",
    "Zelda",
  ],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    title: SITE_NAME,
    description: SITE_DESC,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESC,
  },
  robots: { index: true, follow: true },
};

// Inline script: applies theme class before paint to avoid FOUC.
const themeInitScript = `(()=>{try{const t=localStorage.getItem('theme');const m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m))document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={`${bricolage.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          defer
          data-domain="sp.emre.zip"
          src="https://analytics.pixelgoblin.link/js/script.js"
        />
      </head>
      <body className="min-h-dvh flex flex-col">
        <Banner />
        {children}
      </body>
    </html>
  );
}
