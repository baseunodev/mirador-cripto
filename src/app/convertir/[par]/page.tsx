import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoin, getConversionRate } from "@/lib/data";
import { converterPairs, countries, pairSlug, parsePairSlug, slugForCoin } from "@/lib/catalog";
import { number, price } from "@/lib/format";
import { Converter } from "@/components/converter";
import { AdSlot, Breadcrumbs, Card, Change, Disclaimer, Unavailable, Updated } from "@/components/ui";

export const revalidate = 900;
export const dynamicParams = false; // solo los pares con demanda comprobada (ver catálogo)

export function generateStaticParams() {
  return converterPairs.map(({ id, fiat }) => ({ par: pairSlug(id, fiat) }));
}

type Props = { params: Promise<{ par: string }> };

async function load(par: string) {
  const pair = parsePairSlug(par);
  if (!pair) return null;
  const [coin, rate] = await Promise.all([getCoin(pair.id), getConversionRate(pair.fiat.code, pair.fiat.cryptoRate)]);
  return { ...pair, coin, rate };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { par } = await params;
  const d = await load(par);
  if (!d?.coin) return {};
  const sym = d.coin.symbol.toUpperCase();
  const unit = d.rate ? d.coin.current_price * d.rate.rate : null;
  return {
    title: `${sym} a ${d.fiat.name} hoy: convertir ${d.coin.name} a ${d.fiat.code.toUpperCase()}`,
    description: `1 ${sym} = ${price(unit, `${d.fiat.symbol} `)}. Calculadora en vivo, tabla de equivalencias y precio actualizado de ${d.coin.name} en ${d.fiat.name}.`,
    alternates: { canonical: `/convertir/${par}` },
  };
}

export default async function ConvertPage({ params }: Props) {
  const { par } = await params;
  const d = await load(par);
  if (!d) notFound();
  const { coin, fiat, rate, id } = d;
  if (!coin) return <Unavailable what="el precio" />;
  const sym = coin.symbol.toUpperCase();
  const unit = rate ? coin.current_price * rate.rate : null;
  const amounts = coin.current_price > 100 ? [0.001, 0.01, 0.1, 0.5, 1, 5] : [1, 10, 50, 100, 500, 1000];
  const country = countries.find((c) => c.fiat === fiat.code);
  const siblings = converterPairs.filter((p) => p.id === id && p.fiat.code !== fiat.code);

  return (
    <>
      <Breadcrumbs items={[{ name: `Precio de ${coin.name}`, href: `/precio/${slugForCoin(id)}` }, { name: `${sym} a ${fiat.name}`, href: `/convertir/${par}` }]} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Convertir {coin.name} ({sym}) a {fiat.name}
      </h1>
      {unit ? (
        <p className="mt-2 text-lg">
          1 {sym} = <strong className="tabular-nums">{price(unit, `${fiat.symbol} `)}</strong> <Change value={coin.price_change_percentage_24h} className="text-sm" />
        </p>
      ) : null}
      <Updated at={coin.last_updated} source={rate?.source === "usdt" ? "CoinGecko y CriptoYa" : "CoinGecko y ExchangeRate-API"} />

      <Card className="mt-5">
        {unit ? <Converter unitPrice={unit} coinSymbol={sym} fiatSymbol={fiat.symbol} fiatName={fiat.name} /> : <Unavailable what="el tipo de cambio" />}
        {rate && fiat.code !== "usd" && (
          <p className="mt-3 text-sm text-muted">
            {rate.source === "usdt"
              ? `Calculado con el tipo de cambio cripto (precio del USDT en ${fiat.name}: ${price(rate.rate, `${fiat.symbol} `)}), que es el que se paga de verdad al comprar o vender.`
              : `Calculado con el tipo de cambio oficial: 1 dólar = ${price(rate.rate, `${fiat.symbol} `)}.`}
          </p>
        )}
      </Card>

      <AdSlot slot="convert-below" minHeight={120} />

      {unit && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="mb-3 font-bold">
              {sym} a {fiat.name}
            </h2>
            <table className="w-full text-sm">
              <tbody>
                {amounts.map((a) => (
                  <tr key={a} className="border-b border-border last:border-0">
                    <td className="py-2">
                      {number(a, 4)} {sym}
                    </td>
                    <td className="py-2 text-right font-medium tabular-nums">{price(a * unit, `${fiat.symbol} `)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card>
            <h2 className="mb-3 font-bold">
              {fiat.name.charAt(0).toUpperCase() + fiat.name.slice(1)} a {sym}
            </h2>
            <table className="w-full text-sm">
              <tbody>
                {[1000, 10000, 50000, 100000, 500000, 1000000].map((a) => (
                  <tr key={a} className="border-b border-border last:border-0">
                    <td className="py-2">{price(a, `${fiat.symbol} `)}</td>
                    <td className="py-2 text-right font-medium tabular-nums">
                      {number(a / unit, 8)} {sym}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {country && (
        <Card className="mt-4">
          <h2 className="mb-2 font-bold">Contexto en {country.name}</h2>
          <p className="text-sm text-muted">{country.context}</p>
          <Link href={`/dolar-cripto/${country.slug}`} className="mt-2 inline-block text-sm text-brand hover:underline">
            Ver el dólar cripto en {country.name} →
          </Link>
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="mb-2 font-bold">Otras conversiones de {sym}</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {siblings.map((p) => (
            <li key={p.fiat.code}>
              <Link href={`/convertir/${pairSlug(p.id, p.fiat)}`} className="rounded-md border border-border px-2 py-1 hover:bg-brand-soft">
                {sym} a {p.fiat.name}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <Disclaimer />
    </>
  );
}
