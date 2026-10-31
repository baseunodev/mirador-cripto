import Link from "next/link";
import { getArDollars, getChart, getDiarioHeadlines, getFearGreed, getGlobal, getMarkets, getUsdtQuote, REVALIDATE } from "@/lib/data";
import { countries, slugForCoin } from "@/lib/catalog";
import { compact, fngLabel, pct, price } from "@/lib/format";
import { isStable, toRow } from "@/lib/view";
import { downsample } from "@/components/charts";
import { InteractiveChart } from "@/components/interactive-chart";
import { LiveChange, LivePrice } from "@/components/live";
import { MarketTable } from "@/components/market-table";
import { WhatIf } from "@/components/what-if";
import { DominanceBar, Gauge, Heatmap } from "@/components/visuals";
import { AdSlot, Card, Change, Unavailable, Updated } from "@/components/ui";
import { CoinIcon } from "@/components/coin-icon";
import { Headlines } from "@/components/headlines";
import { diario, diarioLink } from "@/lib/site";
import type { Coin } from "@/lib/data";

export const revalidate = 900;

function Movers({ title, coins }: { title: string; coins: Coin[] }) {
  return (
    <Card>
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      <ul className="space-y-1">
        {coins.map((c) => (
          <li key={c.id}>
            <Link href={`/precio/${slugForCoin(c.id)}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5">
              <CoinIcon src={c.image} symbol={c.symbol} size={24} />
              <span className="flex-1 truncate text-sm font-medium">
                {c.name} <span className="text-xs uppercase text-muted">{c.symbol}</span>
              </span>
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
  const [coins, global, fng, ar, usdtAr, btc30, btc365, eth365, sol365, headlines] = await Promise.all([
    getMarkets(),
    getGlobal(),
    getFearGreed(1),
    getArDollars(),
    getUsdtQuote("ars"),
    getChart("bitcoin", 30),
    getChart("bitcoin", 365),
    getChart("ethereum", 365),
    getChart("solana", 365),
    getDiarioHeadlines(5),
  ]);
  const btc = coins.find((c) => c.id === "bitcoin");
  const blue = ar.find((d) => d.casa === "blue");
  const oficial = ar.find((d) => d.casa === "oficial");
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
      <section className="rise grid items-end gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow">Mercado cripto · {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" })}</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-5xl">
            Precios cripto <span className="text-gradient">en vivo</span>
          </h1>
          <p className="mt-3 max-w-xl text-muted sm:text-lg">Bitcoin, el dólar cripto y las 100 monedas más grandes, en tu moneda y explicado sin humo.</p>
        </div>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[700px]">
          {[
            { k: "Mercado total", v: compact(global?.total_market_cap_usd), d: global?.market_cap_change_24h },
            { k: "Volumen 24 h", v: compact(global?.total_volume_usd) },
            { k: "Dominancia BTC", v: global ? `${global.btc_dominance.toFixed(1).replace(".", ",")}%` : "—" },
            { k: "Miedo y codicia", v: today ? `${today.value} · ${fngLabel(today.label)}` : "—", href: "/indice-miedo-codicia" },
          ].map((x) => (
            <div key={x.k} className="rounded-xl border border-border bg-surface/70 px-3 py-2.5">
              <dt className="text-[11px] text-muted">{x.k}</dt>
              <dd className="mt-0.5 flex flex-wrap items-baseline text-sm font-semibold">
                {x.href ? (
                  <Link href={x.href} className="hover:text-brand-2">
                    {x.v}
                  </Link>
                ) : (
                  x.v
                )}
                {x.d != null && <span className={`ml-1.5 text-xs ${x.d >= 0 ? "text-up" : "text-down"}`}>{pct(x.d)}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="rise lg:col-span-2">
          {btc ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <CoinIcon src={btc.image} symbol="btc" size={44} className="shadow-[0_0_24px_rgba(247,147,26,0.45)]" />
                <div>
                  <Link href="/precio/bitcoin" className="text-sm font-semibold text-muted hover:text-fg">
                    Bitcoin · BTC · ver ficha →
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

      <Card className="mt-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Las 100 criptomonedas más grandes</h2>
          <p className="text-xs text-muted">Tocá ☆ para seguir una moneda: queda guardada en este dispositivo.</p>
        </div>
        {coins.length ? <MarketTable rows={coins.slice(0, 100).map(toRow)} /> : <Unavailable what="los precios" />}
        <div className="mt-3">
          <Updated at={btc?.last_updated ?? Date.now()} source="CoinGecko y Binance" />
        </div>
      </Card>

      {whatIf.length > 0 && (
        <Card className="mt-4">
          <h2 className="mb-4 text-lg font-bold">¿Y si hubieras invertido? 🤔</h2>
          <WhatIf coins={whatIf} />
        </Card>
      )}

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="eyebrow">Noticias · {diario.name}</p>
            <h2 className="mt-1 text-2xl font-bold">Qué está moviendo el mercado</h2>
          </div>
          <a href={diarioLink("/", "home-noticias")} target="_blank" rel="noopener" className="text-sm font-medium text-brand hover:underline">
            Todas las noticias en {diario.name} ↗
          </a>
        </div>
        <Headlines items={headlines} campaign="home-noticias" />
      </section>

      <AdSlot slot="home-bottom" />
      <p className="sr-only">Los precios base se actualizan cada {REVALIDATE.markets / 60} minutos y en vivo desde el navegador.</p>
    </>
  );
}
