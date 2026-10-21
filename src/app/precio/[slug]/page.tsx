import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChart, getCoin, getConversionRate, getMarkets } from "@/lib/data";
import { coinIdForSlug, converterCoins, fiats, pairSlug, slugForCoin } from "@/lib/catalog";
import { compact, date, number, pct, price } from "@/lib/format";
import { postsForCoin } from "@/lib/content";
import { site } from "@/lib/site";
import { downsample } from "@/components/charts";
import { InteractiveChart } from "@/components/interactive-chart";
import { LiveChange, LivePrice } from "@/components/live";
import { AdSlot, Breadcrumbs, Card, Change, Disclaimer, JsonLd, Updated } from "@/components/ui";
import { PostList } from "@/components/posts";

export const revalidate = 900;
export const dynamicParams = true; // monedas fuera del top 50 se generan al primer pedido

export async function generateStaticParams() {
  return (await getMarkets()).slice(0, 50).map((c) => ({ slug: slugForCoin(c.id) }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCoin(coinIdForSlug(slug));
  if (!c) return {};
  const sym = c.symbol.toUpperCase();
  return {
    title: `Precio de ${c.name} (${sym}) hoy: cotización en vivo`,
    description: `${c.name} cotiza a ${price(c.current_price)} (${pct(c.price_change_percentage_24h)} en 24 h). Gráfico en vivo, precio en pesos y euros, y qué está moviendo a ${sym}.`,
    alternates: { canonical: `/precio/${slug}` },
  };
}

export default async function CoinPage({ params }: Props) {
  const { slug } = await params;
  const id = coinIdForSlug(slug);
  if (slugForCoin(id) !== slug) notFound();
  const [coin, markets] = await Promise.all([getCoin(id), getMarkets()]);
  if (!coin) notFound();

  const [d30, d365, ...rates] = await Promise.all([
    getChart(id, 30),
    getChart(id, 365),
    ...fiats.map((f) => getConversionRate(f.code, f.cryptoRate)),
  ]);
  const sym = coin.symbol.toUpperCase();
  const spark = coin.sparkline_in_7d?.price ?? [];
  const now = Date.now();
  const d7: [number, number][] = spark.map((p, i) => [now - (spark.length - i) * 36e5, p]);
  const local = fiats.map((f, i) => ({ fiat: f, rate: rates[i] })).filter((x) => x.rate && x.fiat.code !== "usd");
  const ars = local.find((x) => x.fiat.code === "ars");
  const news = postsForCoin(id);
  const related = markets.filter((m) => m.id !== id && Math.abs(m.market_cap_rank - coin.market_cap_rank) <= 3).slice(0, 6);

  const faqs = [
    {
      q: `¿Cuánto vale 1 ${coin.name} hoy?`,
      a: `1 ${sym} vale ${price(coin.current_price)}${ars?.rate ? `, que son unos ${price(coin.current_price * ars.rate.rate, "$ ")} pesos argentinos al tipo de cambio cripto` : ""}. El precio cambia minuto a minuto.`,
    },
    {
      q: `¿Cuál es el máximo histórico de ${coin.name}?`,
      a: `El máximo histórico de ${sym} fue ${price(coin.ath)} el ${date(coin.ath_date)}. Hoy está ${pct(coin.ath_change_percentage)} respecto de ese valor.`,
    },
    ...(coin.circulating_supply
      ? [
          {
            q: `¿Cuántos ${coin.name} hay en circulación?`,
            a: `Hay unos ${number(coin.circulating_supply, 0)} ${sym} en circulación${coin.max_supply ? `, de un máximo de ${number(coin.max_supply, 0)}` : " y no tiene un límite máximo fijo"}.`,
          },
        ]
      : []),
  ];

  return (
    <>
      <Breadcrumbs items={[{ name: "Mercado", href: "/" }, { name: `Precio de ${coin.name}`, href: `/precio/${slug}` }]} />
      <Card className="rise">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coin.image} alt="" width={52} height={52} className="h-13 w-13 rounded-full shadow-[0_0_30px_rgba(124,92,255,0.35)]" />
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Precio de {coin.name} ({sym}) hoy
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <LivePrice symbol={coin.symbol} initial={coin.current_price} className="text-3xl font-extrabold sm:text-4xl" />
                <LiveChange symbol={coin.symbol} initial={coin.price_change_percentage_24h} badge />
              </p>
            </div>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-sm text-muted">Puesto #{coin.market_cap_rank}</span>
        </div>
        {coin.low_24h != null && coin.high_24h != null && coin.high_24h > coin.low_24h && (
          <div className="mt-4 max-w-md">
            <div className="flex justify-between text-xs text-muted">
              <span>Mín. 24 h {price(coin.low_24h)}</span>
              <span>Máx. 24 h {price(coin.high_24h)}</span>
            </div>
            <div className="relative mt-1.5 h-2 rounded-full bg-gradient-to-r from-down via-warn to-up">
              <span
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-fg shadow"
                style={{ left: `${Math.min(100, Math.max(0, ((coin.current_price - coin.low_24h) / (coin.high_24h - coin.low_24h)) * 100))}%` }}
              />
            </div>
          </div>
        )}
        <div className="mt-5">
          <InteractiveChart
            ranges={[
              { key: "7d", label: "7 días", data: downsample(d7, 168) },
              { key: "30d", label: "30 días", data: downsample(d30, 180) },
              { key: "1a", label: "1 año", data: downsample(d365, 180) },
            ]}
          />
        </div>
        <div className="mt-2">
          <Updated at={coin.last_updated} source="CoinGecko y Binance" />
        </div>
      </Card>

      <AdSlot slot="coin-below-chart" minHeight={120} />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 font-bold">{coin.name} en tu moneda</h2>
          <table className="w-full text-sm">
            <tbody>
              {local.map(({ fiat, rate }) => (
                <tr key={fiat.code} className="border-b border-border last:border-0">
                  <td className="py-2">{fiat.name.charAt(0).toUpperCase() + fiat.name.slice(1)}</td>
                  <td className="py-2 text-right font-medium tabular-nums">{price(coin.current_price * rate!.rate, `${fiat.symbol} `)}</td>
                  <td className="hidden py-2 pl-3 text-right text-xs text-muted sm:table-cell">{rate!.source === "usdt" ? "tipo de cambio cripto" : "tipo de cambio oficial"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {converterCoins.includes(id) && (
            <p className="mt-3 text-sm">
              Convertir:{" "}
              {fiats.slice(0, 5).map((f, i) => (
                <span key={f.code}>
                  {i > 0 && " · "}
                  <Link href={`/convertir/${pairSlug(id, f)}`} className="text-brand hover:underline">
                    {sym} a {f.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Datos clave</h2>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted">Capitalización</dt>
            <dd className="text-right tabular-nums">{compact(coin.market_cap)}</dd>
            <dt className="text-muted">Volumen 24 h</dt>
            <dd className="text-right tabular-nums">{compact(coin.total_volume)}</dd>
            <dt className="text-muted">Mín. / máx. 24 h</dt>
            <dd className="text-right tabular-nums">
              {price(coin.low_24h, "")} / {price(coin.high_24h, "")}
            </dd>
            <dt className="text-muted">Máximo histórico</dt>
            <dd className="text-right tabular-nums">{price(coin.ath)}</dd>
            <dt className="text-muted">Distancia al máximo</dt>
            <dd className="text-right">
              <Change value={coin.ath_change_percentage} />
            </dd>
            <dt className="text-muted">En circulación</dt>
            <dd className="text-right tabular-nums">{number(coin.circulating_supply, 0)}</dd>
            <dt className="text-muted">Oferta máxima</dt>
            <dd className="text-right tabular-nums">{coin.max_supply ? number(coin.max_supply, 0) : "Sin límite"}</dd>
          </dl>
        </Card>
      </div>

      {news.length > 0 && (
        <Card className="mt-4">
          <h2 className="mb-3 font-bold">Qué está pasando con {coin.name}</h2>
          <PostList posts={news} />
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="mb-3 font-bold">Preguntas frecuentes</h2>
        {faqs.map((f) => (
          <div key={f.q} className="mb-4 last:mb-0">
            <h3 className="font-semibold">{f.q}</h3>
            <p className="mt-1 text-sm text-muted">{f.a}</p>
          </div>
        ))}
      </Card>

      <AdSlot slot="coin-bottom" />

      {related.length > 0 && (
        <Card className="mt-4">
          <h2 className="mb-3 font-bold">Monedas parecidas por tamaño</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/precio/${slugForCoin(r.id)}`} className="flex justify-between gap-2 rounded-md p-2 hover:bg-brand-soft">
                  <span>{r.name}</span>
                  <Change value={r.price_change_percentage_24h} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Disclaimer />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          url: `${site.url}/precio/${slug}`,
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
    </>
  );
}
