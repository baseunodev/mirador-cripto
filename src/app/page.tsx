import Link from "next/link";
import { getArDollars, getChart, getFearGreed, getGlobal, getMarkets, getUsdtQuote, REVALIDATE } from "@/lib/data";
import { getPosts } from "@/lib/content";
import { countries, slugForCoin } from "@/lib/catalog";
import { compact, price } from "@/lib/format";
import { isStable, toRow } from "@/lib/view";
import { downsample } from "@/components/charts";
import { InteractiveChart } from "@/components/interactive-chart";
import { LiveChange, LivePrice } from "@/components/live";
import { MarketTable } from "@/components/market-table";
import { WhatIf } from "@/components/what-if";
import { DominanceBar, Gauge, Heatmap } from "@/components/visuals";
import { AdSlot, Card, Change, Unavailable, Updated } from "@/components/ui";
import { PostList } from "@/components/posts";
import type { Coin } from "@/lib/data";

export const revalidate = 900;

function Movers({ title, coins }: { title: string; coins: Coin[] }) {
  return (
    <Card>
      <h2 className="mb-3 font-bold">{title}</h2>
      <ul className="space-y-1">
        {coins.map((c) => (
          <li key={c.id}>
            <Link href={`/precio/${slugForCoin(c.id)}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" width={22} height={22} loading="lazy" className="h-[22px] w-[22px] rounded-full" />
              <span className="flex-1 truncate text-sm font-medium">{c.name}</span>
              <LivePrice symbol={c.symbol} initial={c.current_price} className="text-sm text-muted" />
              <LiveChange symbol={c.symbol} initial={c.price_change_percentage_24h} badge />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default async function Home() {
  const [coins, global, fng, ar, usdtAr, btc30, btc365, eth365, sol365] = await Promise.all([
    getMarkets(),
    getGlobal(),
    getFearGreed(1),
    getArDollars(),
    getUsdtQuote("ars"),
    getChart("bitcoin", 30),
    getChart("bitcoin", 365),
    getChart("ethereum", 365),
    getChart("solana", 365),
  ]);
  const btc = coins.find((c) => c.id === "bitcoin");
  const blue = ar.find((d) => d.casa === "blue");
  const oficial = ar.find((d) => d.casa === "oficial");
  const news = getPosts("noticias").slice(0, 4);
  const today = fng[0];

  const spark = btc?.sparkline_in_7d?.price ?? [];
  const now = Date.now();
  const btc7: [number, number][] = spark.map((p, i) => [now - (spark.length - i) * 36e5, p]);
  const volatile = coins.slice(0, 100).filter((c) => !isStable(c) && c.price_change_percentage_24h != null);
  const byChange = [...volatile].sort((a, b) => b.price_change_percentage_24h! - a.price_change_percentage_24h!);
  const withNow = (series: [number, number][], c?: Coin): [number, number][] => (c && series.length ? [...downsample(series, 180), [now, c.current_price]] : []);
  const whatIf = [
    { id: "bitcoin", series: withNow(btc365, btc) },
    { id: "ethereum", series: withNow(eth365, coins.find((c) => c.id === "ethereum")) },
    { id: "solana", series: withNow(sol365, coins.find((c) => c.id === "solana")) },
  ].flatMap(({ id, series }) => {
    const c = coins.find((x) => x.id === id);
    return c ? [{ id, symbol: c.symbol, name: c.name, image: c.image, series }] : [];
  });

  return (
    <>
      <div className="rise">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Precios de criptomonedas <span className="text-gradient">hoy, en vivo</span>
        </h1>
        <p className="mt-2 text-muted">Mirá cómo se mueve el mercado segundo a segundo, en tu moneda y explicado sin humo.</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="rise lg:col-span-2">
          {btc ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={btc.image} alt="" width={40} height={40} className="h-10 w-10 rounded-full shadow-[0_0_24px_rgba(247,147,26,0.45)]" />
                <div>
                  <Link href="/precio/bitcoin" className="text-sm font-semibold text-muted hover:text-fg">
                    Bitcoin · BTC
                  </Link>
                  <p className="flex flex-wrap items-center gap-2">
                    <LivePrice symbol="btc" initial={btc.current_price} className="text-3xl font-extrabold sm:text-4xl" />
                    <LiveChange symbol="btc" initial={btc.price_change_percentage_24h} badge />
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <InteractiveChart
                  ranges={[
                    { key: "7d", label: "7 días", data: downsample(btc7, 168) },
                    { key: "30d", label: "30 días", data: downsample(btc30, 180) },
                    { key: "1a", label: "1 año", data: downsample(btc365, 180) },
                  ]}
                  height={280}
                />
              </div>
            </>
          ) : (
            <Unavailable what="el precio de bitcoin" />
          )}
        </Card>

        <div className="grid gap-4">
          <Card className="rise">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Mercado cripto total</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">{compact(global?.total_market_cap_usd)}</p>
            <p className="text-sm">
              <Change value={global?.market_cap_change_24h} /> <span className="text-muted">en 24 h</span>
            </p>
            <p className="mt-1 text-xs text-muted">Volumen 24 h: {compact(global?.total_volume_usd)}</p>
            {global && (
              <div className="mt-3">
                <DominanceBar btc={global.btc_dominance} eth={global.eth_dominance} />
              </div>
            )}
          </Card>
          <Card className="rise">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Miedo y codicia</p>
              <Link href="/indice-miedo-codicia" className="text-xs text-brand hover:underline">
                Qué es →
              </Link>
            </div>
            {today ? <Gauge value={today.value} label={today.label} size={200} /> : <p className="py-6 text-center text-muted">—</p>}
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Movers title="🚀 Las que más suben hoy" coins={byChange.slice(0, 5)} />
        <Movers title="📉 Las que más caen hoy" coins={byChange.slice(-5).reverse()} />
        <Card className="md:col-span-2 lg:col-span-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-bold">🇦🇷 Dólar cripto</h2>
            <Link href="/dolar-cripto/argentina" className="text-sm text-brand hover:underline">
              Ver brecha →
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { k: "USDT", v: usdtAr?.buy, hl: true },
              { k: "Blue", v: blue?.venta },
              { k: "Oficial", v: oficial?.venta },
            ].map((x) => (
              <div key={x.k} className={`rounded-xl p-2.5 ${x.hl ? "bg-brand-soft ring-1 ring-brand/40" : "bg-surface-2"}`}>
                <p className="text-[11px] text-muted">{x.k}</p>
                <p className="text-base font-bold tabular-nums">{price(x.v, "$ ")}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            {countries
              .filter((c) => c.slug !== "argentina")
              .map((c) => (
                <Link key={c.slug} href={`/dolar-cripto/${c.slug}`} className="rounded-full bg-surface-2 px-2.5 py-1 text-muted transition hover:text-fg">
                  {c.name}
                </Link>
              ))}
          </div>
        </Card>
      </div>

      {volatile.length > 0 && (
        <Card className="mt-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-bold">Mapa de calor del mercado</h2>
            <p className="text-xs text-muted">Tamaño: capitalización · Color: variación 24 h · Tocá una para ver su ficha</p>
          </div>
          <Heatmap coins={coins.filter((c) => !isStable(c)).slice(0, 40)} />
        </Card>
      )}

      <AdSlot slot="home-top" minHeight={120} />

      {whatIf.length > 0 && (
        <Card className="mt-4">
          <h2 className="mb-4 text-lg font-bold">¿Y si hubieras invertido? 🤔</h2>
          <WhatIf coins={whatIf} />
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="mb-3 text-lg font-bold">Todas las criptomonedas</h2>
        {coins.length ? <MarketTable rows={coins.slice(0, 100).map(toRow)} /> : <Unavailable what="los precios" />}
        <div className="mt-3">
          <Updated at={btc?.last_updated ?? Date.now()} source="CoinGecko y Binance" />
        </div>
      </Card>

      {news.length > 0 && (
        <Card className="mt-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-bold">Últimas noticias</h2>
            <Link href="/noticias" className="text-sm text-brand hover:underline">
              Todas →
            </Link>
          </div>
          <PostList posts={news} />
        </Card>
      )}

      <AdSlot slot="home-bottom" />
      <p className="sr-only">Los precios base se actualizan cada {REVALIDATE.markets / 60} minutos y en vivo desde el navegador.</p>
    </>
  );
}
