import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Space_Grotesk } from "next/font/google";
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
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap", weight: ["500", "600", "700"] });

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
  { href: "/", label: "Mercado", match: "/", icon: "📊" },
  { href: "/dolar-cripto/argentina", label: "Dólar cripto", match: "/dolar-cripto", icon: "💵" },
  { href: "/convertir", label: "Conversores", match: "/convertir", icon: "🔁" },
  { href: "/indice-miedo-codicia", label: "Miedo y codicia", match: "/indice-miedo-codicia", icon: "🧭" },
];

const footerCols = [
  {
    title: "Datos",
    links: [
      { href: "/", label: "Precios en vivo" },
      { href: "/dolar-cripto/argentina", label: "Dólar cripto" },
      { href: "/convertir", label: "Conversores" },
      { href: "/indice-miedo-codicia", label: "Índice de miedo y codicia" },
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
      <span aria-hidden className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 shadow-[0_0_24px_rgba(124,92,255,0.45)]">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l5-6 4 3 6-8" />
          <circle cx="18" cy="6" r="1.6" fill="white" />
        </svg>
      </span>
      <span className="font-display text-lg font-bold leading-none tracking-tight">
        Mirador <span className="text-gradient">Cripto</span>
        <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-muted">por {diario.name}</span>
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
    ...countries.map((c) => ({ kind: "page" as const, href: `/dolar-cripto/${c.slug}`, title: `Dólar cripto en ${c.name}`, subtitle: "USDT vs. dólar oficial", image: "💵", keywords: `usdt ${c.demonym}` })),
    ...converterPairs.map((p) => {
      const c = coins.find((x) => x.id === p.id);
      const name = c?.name ?? p.id;
      return { kind: "page" as const, href: `/convertir/${pairSlug(p.id, p.fiat)}`, title: `${name} a ${p.fiat.name}`, subtitle: "Conversor", image: "🔁", keywords: `convertir ${c?.symbol ?? ""}` };
    }),
    { kind: "page", href: "/indice-miedo-codicia", title: "Índice de miedo y codicia", subtitle: "El humor del mercado hoy", image: "🧭", keywords: "fear greed sentimiento" },
  ];
  return (
    <html lang="es" className={`${inter.variable} ${grotesk.variable}`}>
      <body className="min-h-screen pb-16 antialiased md:pb-0">
        <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-white">
          Saltar al contenido
        </a>
        <FavoritesProvider>
          <SearchProvider items={searchIndex}>
            <LiveProvider symbols={coins.slice(0, 60).map((c) => c.symbol)} updatedAt={updatedAt}>
              <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
                  <Logo />
                  <nav aria-label="Principal" className="ml-4 hidden flex-1 items-center gap-1 text-sm md:flex">
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

              <main id="contenido" className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
                {children}
              </main>
              <MobileTabBar items={nav} newsHref={diarioLink("/", "tabbar")} />
            </LiveProvider>
          </SearchProvider>
        </FavoritesProvider>

        <footer className="mt-20 border-t border-border bg-surface/60">
          <div className="mx-auto max-w-7xl px-4">
            <div className="relative -mt-10 overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-[#1a1440] via-surface to-[#0b2530] p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-2">El diario hermano</p>
                <p className="mt-1 font-display text-xl font-bold sm:text-2xl">Entendé por qué se mueve el mercado</p>
                <p className="mt-1 max-w-xl text-sm text-muted">Las noticias cripto del día, explicadas en español, en {diario.name}. Gratis, en tu mail cada mañana.</p>
              </div>
              <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">
                <a href={diarioLink("/newsletter", "footer")} target="_blank" rel="noopener" className="btn-primary">
                  Suscribirme gratis
                </a>
                <a href={diarioLink("/", "footer")} target="_blank" rel="noopener" className="btn-ghost">
                  Leer {diario.name} ↗
                </a>
              </div>
            </div>
          </div>
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-muted">{site.tagline}. Solo consulta: acá no se compra ni se vende nada.</p>
            </div>
            {footerCols.map((col) => (
              <div key={col.title}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg/80">{col.title}</p>
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
            <p className="mx-auto max-w-7xl px-4 py-5 text-xs leading-relaxed text-muted">
              {disclaimer} Datos de precios:{" "}
              <a href="https://www.coingecko.com" rel="noopener" className="underline hover:text-fg">
                CoinGecko
              </a>
              , Binance, CriptoYa, DolarApi y Alternative.me. © {new Date().getFullYear()} {site.name}.
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
