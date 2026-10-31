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
import { DominanceBar, FearGreedBar, Heatmap } from "@/components/visuals";
import { AdSlot, Card, Unavailable, Updated } from "@/components/ui";
import { CoinIcon } from "@/components/coin-icon";
import { Headlines } from "@/components/headlines";
import { diario, diarioLink } from "@/lib/site";
import type { Coin } from "@/lib/data";

export const revalidate = 900;

function Movers({ title, coins }: { title: string; coins: Coin[] }) {
  return (
    <div className="bg-surface p-5">
      <h2 className="eyebrow mb-3">{title}</h2>
      <ul>
        {coins.map((c) => (
          <li key={c.id}>
            <Link href={`/precio/${slugForCoin(c.id)}`} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-surface-2">
              <CoinIcon src={c.image} symbol={c.symbol} size={22} />
              <span className="flex-1 truncate text-sm">
                {c.name} <span className="mono text-[11px] uppercase text-faint">{c.symbol}</span>
              </span>
              <LivePrice symbol={c.symbol} initial={c.current_price} className="text-[13px] text-muted" />
              <LiveChange symbol={c.symbol} initial={c.price_change_percentage_24h} badge className="w-16 text-right" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
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

  const stats = [
    { k: "Capitalización total", v: compact(global?.total_market_cap_usd), d: global?.market_cap_change_24h },
    { k: "Volumen 24 h", v: compact(global?.total_volume_usd) },
  ];
  const fx = [
    { k: "USDT", v: usdtAr?.buy, hl: true },
    { k: "BLUE", v: blue?.venta },
    { k: "OFICIAL", v: oficial?.venta },
  ];

  return (
    <>
      <div className="rise mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow">Mercado cripto · {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" })}</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Precios cripto en vivo</h1>
        </div>
        <p className="max-w-md text-sm text-muted">Bitcoin, el dólar cripto y las 100 monedas más grandes, en tu moneda. Solo consulta: acá no se compra ni se vende.</p>
      </div>

      <section className="rise grid gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-3">
        <div className="bg-surface p-5 sm:p-7 lg:col-span-2">
          {btc ? (
            <>
              <div className="flex items-center gap-3">
                <CoinIcon src={btc.image} symbol="btc" size={28} />
                <Link href="/precio/bitcoin" className="eyebrow hover:text-fg">
                  Bitcoin · BTC/USD →
                </Link>
              </div>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
                <LivePrice symbol="btc" initial={btc.current_price} className="text-4xl font-semibold tracking-tight sm:text-5xl" />
                <LiveChange symbol="btc" initial={btc.price_change_percentage_24h} badge className="text-sm" />
                <span className="mono text-[11px] text-faint">24 H</span>
              </p>
              <div className="mt-6">
                <InteractiveChart
                  ranges={[
                    { key: "7d", label: "7D", data: downsample(btc7, 168) },
                    { key: "30d", label: "30D", data: downsample(btc30, 180) },
                    { key: "1a", label: "1A", data: downsample(btc365, 180) },
                  ]}
                  height={260}
                />
              </div>
            </>
          ) : (
            <Unavailable what="el precio de bitcoin" />
          )}
        </div>

        <div className="flex flex-col gap-6 bg-surface p-5 sm:p-7">
          <p className="eyebrow">Mercado global</p>
          <dl className="grid gap-4">
            {stats.map((x) => (
              <div key={x.k} className="flex items-baseline justify-between gap-3 border-b border-line pb-3.5">
                <dt className="text-[13px] text-muted">{x.k}</dt>
                <dd className="text-[15px] tabular-nums">
                  {x.v}
                  {x.d != null && <span className={`ml-2 text-xs ${x.d >= 0 ? "text-up" : "text-down"}`}>{pct(x.d)}</span>}
                </dd>
              </div>
            ))}
          </dl>
          {global && <DominanceBar btc={global.btc_dominance} eth={global.eth_dominance} />}
          {today && (
            <Link href="/indice-miedo-codicia" className="group block">
              <FearGreedBar value={today.value} label={fngLabel(today.label)} />
            </Link>
          )}
          <div className="mt-auto rounded-lg border border-border p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Dólar cripto · Argentina</span>
              <Link href="/dolar-cripto/argentina" className="text-xs text-brand hover:underline">
                Ver brecha →
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {fx.map((x) => (
                <div key={x.k}>
                  <p className="eyebrow text-[10px]">{x.k}</p>
                  <p className={`mt-1 text-[17px] tabular-nums ${x.hl ? "text-brand" : ""}`}>{price(x.v, "$ ")}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
              {countries
                .filter((c) => c.slug !== "argentina")
                .map((c) => (
                  <Link key={c.slug} href={`/dolar-cripto/${c.slug}`} className="hover:text-fg">
                    {c.name}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
        <Movers title="Las que más suben hoy" coins={byChange.slice(0, 5)} />
        <Movers title="Las que más caen hoy" coins={byChange.slice(-5).reverse()} />
      </section>

      {volatile.length > 0 && (
        <Card className="mt-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[15px] font-semibold">Mapa de calor</h2>
            <p className="mono text-[11px] text-faint">TAMAÑO: CAPITALIZACIÓN · COLOR: VARIACIÓN 24 H</p>
          </div>
          <Heatmap coins={coins.filter((c) => !isStable(c)).slice(0, 40)} />
        </Card>
      )}

      <AdSlot slot="home-top" minHeight={120} />

      <section className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border bg-surface px-5 py-4">
          <h2 className="text-[15px] font-semibold">Las 100 más grandes</h2>
          <p className="text-xs text-muted">La estrella guarda la moneda en tus favoritas, en este dispositivo.</p>
        </div>
        <div className="p-3 sm:p-5">
          {coins.length ? <MarketTable rows={coins.slice(0, 100).map(toRow)} /> : <Unavailable what="los precios" />}
          <div className="mt-3">
            <Updated at={btc?.last_updated ?? Date.now()} source="CoinGecko y Binance" />
          </div>
        </div>
      </section>

      {whatIf.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-5 text-[15px] font-semibold">¿Y si hubieras invertido?</h2>
          <WhatIf coins={whatIf} />
        </Card>
      )}

      <section className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        {[
          { href: "/proyecciones", k: "Proyecciones", t: "¿Hasta dónde puede llegar bitcoin?", d: "Rango probable, escenarios y apuestas del mercado." },
          { href: "/compra-mensual", k: "Compra mensual", t: "¿Y si comprabas un poco cada mes?", d: "Calculá cuánto tendrías hoy con precios reales." },
          { href: "/mi-cartera", k: "Mi cartera", t: "Lo que tenés, en vivo", d: "En dólares y pesos. Sin cuenta ni billetera." },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="group bg-surface p-5 transition hover:bg-surface-2">
            <p className="eyebrow">{x.k}</p>
            <p className="mt-1.5 font-semibold tracking-tight">{x.t}</p>
            <p className="mt-1 text-sm text-muted">{x.d}</p>
            <p className="mono mt-3 text-[11px] uppercase tracking-wider text-brand transition group-hover:translate-x-0.5">Abrir →</p>
          </Link>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-semibold">
            Qué mueve el mercado <span className="font-normal text-muted">· en {diario.name}</span>
          </h2>
          <a href={diarioLink("/", "home-noticias")} target="_blank" rel="noopener" className="text-sm text-brand hover:underline">
            Todas las noticias ↗
          </a>
        </div>
        <Headlines items={headlines} campaign="home-noticias" />
      </section>

      <AdSlot slot="home-bottom" />
      <p className="sr-only">Los precios base se actualizan cada {REVALIDATE.markets / 60} minutos y en vivo desde el navegador.</p>
    </>
  );
}
