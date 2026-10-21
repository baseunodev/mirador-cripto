import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { adsenseClient, disclaimer, gaId, site } from "@/lib/site";
import { JsonLd } from "@/components/ui";
import { LiveBadge, LiveProvider } from "@/components/live";
import { Ticker } from "@/components/ticker";
import { getMarkets } from "@/lib/data";
import { tickerItems } from "@/lib/view";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: precios cripto en vivo y dólar cripto hoy`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
  openGraph: { type: "website", siteName: site.name, locale: "es_419" },
  twitter: { card: "summary_large_image" },
  // max-image-preview:large es clave para aparecer en Google Discover
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export const viewport: Viewport = {
  themeColor: "#070a12",
};

const nav = [
  { href: "/", label: "Mercado" },
  { href: "/dolar-cripto/argentina", label: "Dólar cripto" },
  { href: "/noticias", label: "Noticias" },
  { href: "/aprende", label: "Aprendé" },
  { href: "/indice-miedo-codicia", label: "Miedo y codicia" },
];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const coins = await getMarkets();
  const ticker = tickerItems(coins);
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <LiveProvider symbols={coins.slice(0, 60).map((c) => c.symbol)}>
          <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
              <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight">
                <span aria-hidden className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-base text-white shadow-[0_0_20px_rgba(124,92,255,0.5)]">
                  ◉
                </span>
                <span>
                  Mirador <span className="text-gradient">Cripto</span>
                </span>
              </Link>
              <nav aria-label="Principal" className="-mx-1 flex flex-1 gap-1 overflow-x-auto text-sm">
                {nav.map((n) => (
                  <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-muted transition hover:bg-white/5 hover:text-fg">
                    {n.label}
                  </Link>
                ))}
              </nav>
              <span className="hidden md:block">
                <LiveBadge />
              </span>
            </div>
            <Ticker items={ticker} />
          </header>

          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </LiveProvider>

        <footer className="mt-16 border-t border-border bg-surface/60">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
            <div>
              <p className="font-bold">{site.name}</p>
              <p className="mt-1 text-muted">{site.tagline}. Solo consulta: acá no se compra ni se vende nada.</p>
            </div>
            <ul className="space-y-1 text-muted">
              <li><Link href="/sobre-nosotros" className="hover:text-fg">Sobre nosotros</Link></li>
              <li><Link href="/politica-editorial" className="hover:text-fg">Política editorial y uso de IA</Link></li>
              <li><Link href="/como-nos-financiamos" className="hover:text-fg">Cómo nos financiamos</Link></li>
              <li><Link href="/metodologia" className="hover:text-fg">Metodología y fuentes de datos</Link></li>
              <li><Link href="/contacto" className="hover:text-fg">Contacto</Link></li>
            </ul>
            <ul className="space-y-1 text-muted">
              <li><Link href="/privacidad" className="hover:text-fg">Privacidad</Link></li>
              <li><Link href="/cookies" className="hover:text-fg">Cookies</Link></li>
              <li><Link href="/aviso-legal" className="hover:text-fg">Aviso legal</Link></li>
              <li><a href="https://www.coingecko.com" rel="noopener" className="hover:text-fg">Datos de precios: CoinGecko</a></li>
            </ul>
          </div>
          <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted">{disclaimer}</p>
        </footer>

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "NewsMediaOrganization",
                "@id": `${site.url}/#org`,
                name: site.name,
                url: site.url,
                logo: `${site.url}/icon.svg`,
                sameAs: Object.values(site.social),
                publishingPrinciples: `${site.url}/politica-editorial`,
                correctionsPolicy: `${site.url}/politica-editorial#correcciones`,
                ownershipFundingInfo: `${site.url}/como-nos-financiamos`,
              },
              { "@type": "WebSite", "@id": `${site.url}/#web`, name: site.name, url: site.url, inLanguage: "es", publisher: { "@id": `${site.url}/#org` } },
            ],
          }}
        />

        {adsenseClient && (
          <Script
            id="adsense"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          />
        )}
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
