import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { adsenseClient, diario, diarioLink, disclaimer, gaId, site } from "@/lib/site";
import { JsonLd } from "@/components/ui";
import { LiveBadge, LiveNotice, LiveProvider } from "@/components/live";
import { Ticker } from "@/components/ticker";
import { FavoritesProvider } from "@/components/favorites";
import { SearchButton, SearchProvider } from "@/components/search";
import { MobileTabBar, NavLinks, type NavItem } from "@/components/nav";
import { getMarkets } from "@/lib/data";
import { countries, converterPairs, pairSlug, slugForCoin } from "@/lib/catalog";
import type { SearchItem } from "@/lib/search";
import { tickerItems } from "@/lib/view";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-jb", display: "swap", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: precios cripto en vivo y dólar cripto hoy`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: site.name, locale: "es_419" },
  twitter: { card: "summary_large_image" },
  // max-image-preview:large es clave para aparecer en Google Discover
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export const viewport: Viewport = {
  themeColor: "#070a12",
};

const nav: NavItem[] = [
  { href: "/", label: "Mercado", match: "/", icon: "chart", tab: true },
  { href: "/proyecciones", label: "Proyecciones", match: "/proyecciones", icon: "fan", tab: true },
  { href: "/dolar-cripto/argentina", label: "Dólar cripto", match: "/dolar-cripto", icon: "dollar" },
  { href: "/mi-cartera", label: "Mi cartera", match: "/mi-cartera", icon: "wallet", short: "Cartera", tab: true },
  { href: "/convertir", label: "Conversores", match: "/convertir", icon: "swap" },
];

const footerCols = [
  {
    title: "Datos",
    links: [
      { href: "/", label: "Precios en vivo" },
      { href: "/dolar-cripto/argentina", label: "Dólar cripto" },
      { href: "/convertir", label: "Conversores" },
      { href: "/indice-miedo-codicia", label: "Índice de miedo y codicia" },
      { href: "/proyecciones", label: "Proyecciones y escenarios" },
      { href: "/compra-mensual", label: "Calculadora de compra mensual" },
      { href: "/mi-cartera", label: "Mi cartera" },
    ],
  },
  {
    title: "Sobre el sitio",
    links: [
      { href: "/sobre-nosotros", label: "Sobre nosotros" },
      { href: "/politica-editorial", label: "Política editorial y uso de IA" },
      { href: "/como-nos-financiamos", label: "Cómo nos financiamos" },
      { href: "/metodologia", label: "Metodología y fuentes" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacidad", label: "Privacidad" },
      { href: "/cookies", label: "Cookies" },
      { href: "/aviso-legal", label: "Aviso legal" },
    ],
  },
];

function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${site.name}, inicio`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 18l6-7 4 4 8-10" />
      </svg>
      <span className="text-base font-bold leading-none tracking-tight">
        mirador<span className="text-brand">/</span>cripto
      </span>
    </Link>
  );
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const coins = await getMarkets();
  const ticker = tickerItems(coins);
  const updatedAt = coins.reduce((a, c) => Math.max(a, new Date(c.last_updated).getTime() || 0), 0);
  const searchIndex: SearchItem[] = [
    ...coins.slice(0, 150).map((c) => ({
      kind: "coin" as const,
      href: `/precio/${slugForCoin(c.id)}`,
      title: c.name,
      symbol: c.symbol,
      image: c.image,
      rank: c.market_cap_rank,
      subtitle: "Precio, gráfico y datos",
    })),
    ...countries.map((c) => ({ kind: "page" as const, href: `/dolar-cripto/${c.slug}`, title: `Dólar cripto en ${c.name}`, subtitle: "USDT vs. dólar oficial", image: "dollar", keywords: `usdt ${c.demonym}` })),
    ...converterPairs.map((p) => {
      const c = coins.find((x) => x.id === p.id);
      const name = c?.name ?? p.id;
      return { kind: "page" as const, href: `/convertir/${pairSlug(p.id, p.fiat)}`, title: `${name} a ${p.fiat.name}`, subtitle: "Conversor", image: "swap", keywords: `convertir ${c?.symbol ?? ""}` };
    }),
    { kind: "page", href: "/proyecciones", title: "Proyecciones y escenarios", subtitle: "Rango probable y simulador", image: "fan", keywords: "prediccion pronostico cuanto valdra bitcoin polymarket" },
    { kind: "page", href: "/compra-mensual", title: "Calculadora de compra mensual", subtitle: "Cuánto tendrías hoy (DCA)", image: "chart", keywords: "dca ahorro mensual" },
    { kind: "page", href: "/mi-cartera", title: "Mi cartera", subtitle: "Tus monedas en vivo", image: "wallet", keywords: "portfolio portafolio" },
    { kind: "page", href: "/indice-miedo-codicia", title: "Índice de miedo y codicia", subtitle: "El humor del mercado hoy", image: "gauge", keywords: "fear greed sentimiento" },
  ];
  return (
    <html lang="es" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen pb-16 antialiased md:pb-0">
        <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-on-brand">
          Saltar al contenido
        </a>
        <FavoritesProvider>
          <SearchProvider items={searchIndex}>
            <LiveProvider symbols={coins.slice(0, 60).map((c) => c.symbol)} updatedAt={updatedAt}>
              <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-8">
                  <Logo />
                  <nav aria-label="Principal" className="ml-6 hidden flex-1 items-center gap-1 text-[13px] md:flex">
                    <NavLinks items={nav} />
                    <a href={diarioLink("/", "nav")} target="_blank" rel="noopener" className="whitespace-nowrap rounded-lg px-3 py-1.5 text-muted transition hover:bg-white/5 hover:text-fg">
                      Noticias ↗
                    </a>
                  </nav>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="hidden lg:block">
                      <SearchButton />
                    </span>
                    <span className="lg:hidden">
                      <SearchButton compact />
                    </span>
                    <LiveBadge />
                  </div>
                </div>
                <Ticker items={ticker} />
                <LiveNotice />
              </header>

              <main id="contenido" className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
                {children}
              </main>
              <MobileTabBar items={nav} newsHref={diarioLink("/", "tabbar")} />
            </LiveProvider>
          </SearchProvider>
        </FavoritesProvider>

        <footer className="mt-16 border-t border-border">
          <div className="border-b border-border">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div>
                <p className="eyebrow">El diario hermano</p>
                <p className="mt-1.5 text-lg font-semibold tracking-tight">Entendé por qué se mueve el mercado</p>
                <p className="mt-1 max-w-xl text-sm text-muted">Las noticias cripto del día, explicadas en español, en {diario.name}. Gratis, en tu mail cada mañana.</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a href={diarioLink("/newsletter", "footer")} target="_blank" rel="noopener" className="btn-primary">
                  Suscribirme gratis
                </a>
                <a href={diarioLink("/", "footer")} target="_blank" rel="noopener" className="btn-ghost">
                  Leer {diario.name} ↗
                </a>
              </div>
            </div>
          </div>
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-muted">{site.tagline}. Solo consulta: acá no se compra ni se vende nada.</p>
            </div>
            {footerCols.map((col) => (
              <div key={col.title}>
                <p className="eyebrow mb-3">{col.title}</p>
                <ul className="space-y-1.5 text-muted">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="transition hover:text-fg">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border">
            <p className="mx-auto max-w-7xl px-4 py-5 text-xs leading-relaxed text-muted sm:px-8">
              {disclaimer} Datos de precios:{" "}
              <a href="https://www.coingecko.com" rel="noopener" className="underline hover:text-fg">
                CoinGecko
              </a>
              , Binance, CriptoYa, DolarApi, ArgentinaDatos, Polymarket y Alternative.me. © {new Date().getFullYear()} {site.name}.
            </p>
          </div>
        </footer>

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
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
