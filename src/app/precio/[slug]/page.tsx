import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChart, getCoin, getConversionRate, getMarkets } from "@/lib/data";
import { coinIdForSlug, converterCoins, fiats, pairSlug, slugForCoin } from "@/lib/catalog";
import { compact, date, number, pct, price } from "@/lib/format";
import { postsForCoin } from "@/lib/content";
import { site } from "@/lib/site";
import { AreaChart, downsample } from "@/components/charts";
import { RangeChart } from "@/components/range-chart";
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Precio de {coin.name} ({sym}) hoy
          </h1>
          <p className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums sm:text-4xl">{price(coin.current_price)}</span>
            <Change value={coin.price_change_percentage_24h} className="text-lg" />
            <span className="text-sm text-muted">en 24 h</span>
          </p>
          <Updated at={coin.last_updated} source="CoinGecko" />
        </div>
        <p className="text-sm text-muted">Puesto #{coin.market_cap_rank} por capitalización</p>
      </div>

      <Card className="mt-5">
        <RangeChart
          ranges={[
            { key: "7d", label: "7 días", node: d7.length > 1 ? <AreaChart points={d7} label={`Precio de ${coin.name} en los últimos 7 días`} /> : null },
            { key: "30d", label: "30 días", node: d30.length > 1 ? <AreaChart points={downsample(d30)} label={`Precio de ${coin.name} en los últimos 30 días`} /> : null },
            { key: "1a", label: "1 año", node: d365.length > 1 ? <AreaChart points={downsample(d365)} label={`Precio de ${coin.name} en el último año`} /> : null },
          ]}
        />
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
