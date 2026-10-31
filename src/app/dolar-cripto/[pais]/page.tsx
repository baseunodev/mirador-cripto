import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArDollars, getArGapHistory, getOfficialFx, getUsdtQuote } from "@/lib/data";
import { diario, diarioLink } from "@/lib/site";
import { countries, countryBySlug, fiatByCode, pairSlug } from "@/lib/catalog";
import { exchangeName, pct, price } from "@/lib/format";
import { Converter } from "@/components/converter";
import { GapChart } from "@/components/gap-chart";
import { AdSlot, Breadcrumbs, Card, Disclaimer, Unavailable, Updated } from "@/components/ui";

export const revalidate = 600;
export const dynamicParams = false;

export function generateStaticParams() {
  return countries.map((c) => ({ pais: c.slug }));
}

type Props = { params: Promise<{ pais: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pais } = await params;
  const c = countryBySlug(pais);
  if (!c) return {};
  const q = await getUsdtQuote(c.fiat);
  const sym = fiatByCode(c.fiat)?.symbol ?? "$";
  return {
    title: `Dólar cripto hoy en ${c.name}: precio del USDT${c.slug === "argentina" ? " vs. blue y MEP" : " y brecha con el oficial"}`,
    description: `El USDT cotiza a ${price(q?.buy, `${sym} `)} en ${c.name}. Compra y venta en cada exchange, brecha con el dólar oficial y calculadora.`,
    alternates: { canonical: `/dolar-cripto/${pais}` },
  };
}

const gap = (a?: number | null, b?: number | null) => (a && b ? ((a - b) / b) * 100 : null);

export default async function DolarCriptoPage({ params }: Props) {
  const { pais } = await params;
  const country = countryBySlug(pais);
  if (!country) notFound();
  const fiat = fiatByCode(country.fiat)!;
  const isAr = country.slug === "argentina";
  const [q, fx, ar, gapHist] = await Promise.all([getUsdtQuote(country.fiat), getOfficialFx(), isAr ? getArDollars() : Promise.resolve([]), isAr ? getArGapHistory(180) : Promise.resolve([])]);
  const oficial = isAr ? ar.find((d) => d.casa === "oficial")?.venta : fx[country.fiat];
  const blue = ar.find((d) => d.casa === "blue")?.venta;
  const mep = ar.find((d) => d.casa === "bolsa")?.venta;
  const s = `${fiat.symbol} `;

  return (
    <>
      <Breadcrumbs items={[{ name: "Dólar cripto", href: "/dolar-cripto/argentina" }, { name: country.name, href: `/dolar-cripto/${pais}` }]} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dólar cripto hoy en {country.name}</h1>
      <p className="mt-1 text-muted">Cuánto cuesta 1 USDT (dólar digital) en {fiat.name}, comparado con el dólar oficial.</p>

      {q ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card>
              <p className="text-xs text-muted">USDT: comprás a</p>
              <p className="text-2xl font-bold tabular-nums">{price(q.buy, s)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted">USDT: vendés a</p>
              <p className="text-2xl font-bold tabular-nums">{price(q.sell, s)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted">Dólar oficial</p>
              <p className="text-2xl font-bold tabular-nums">{price(oficial, s)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted">Brecha cripto vs. oficial</p>
              <p className="text-2xl font-bold tabular-nums">{pct(gap(q.mid, oficial))}</p>
            </Card>
          </div>
          <div className="mt-2">
            <Updated at={q.updatedAt} source={isAr ? "CriptoYa y DolarApi" : "CriptoYa y ExchangeRate-API"} />
          </div>
        </>
      ) : (
        <div className="mt-5">
          <Unavailable what="el precio del USDT" />
        </div>
      )}

      {isAr && ar.length > 0 && (
        <Card className="mt-4">
          <h2 className="mb-3 font-bold">Todos los dólares en Argentina</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr className="border-b border-border">
                <th className="py-2 font-medium">Tipo</th>
                <th className="py-2 text-right font-medium">Compra</th>
                <th className="py-2 text-right font-medium">Venta</th>
                <th className="py-2 text-right font-medium">vs. cripto</th>
              </tr>
            </thead>
            <tbody>
              {ar.map((d) => (
                <tr key={d.casa} className="border-b border-border last:border-0">
                  <td className="py-2">{d.nombre}</td>
                  <td className="py-2 text-right tabular-nums">{price(d.compra, "$ ")}</td>
                  <td className="py-2 text-right tabular-nums">{price(d.venta, "$ ")}</td>
                  <td className="py-2 text-right tabular-nums text-muted">{pct(gap(q?.mid, d.venta))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {blue && mep && q && (
            <p className="mt-3 text-sm text-muted">
              Hoy el USDT está {pct(gap(q.mid, blue))} respecto del blue y {pct(gap(q.mid, mep))} respecto del MEP.
            </p>
          )}
        </Card>
      )}

      {isAr && gapHist.length > 10 && (
        <Card className="mt-4">
          <h2 className="font-bold">Brecha entre el dólar cripto y el blue, últimos 6 meses</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Por encima de 0%, el USDT sale más caro que el blue; por debajo, más barato. Valores de venta de cada día.</p>
          <GapChart points={gapHist} />
          <p className="mono mt-3 text-[11px] uppercase tracking-wider text-faint">Fuente: ArgentinaDatos</p>
        </Card>
      )}

      <AdSlot slot="dolar-cripto-mid" minHeight={120} />

      {q && (
        <Card className="mt-4">
          <h2 className="mb-3 font-bold">Calculadora de {fiat.name} a USDT</h2>
          <Converter unitPrice={q.buy} coinSymbol="USDT" fiatSymbol={fiat.symbol} fiatName={fiat.name} />
          <p className="mt-2 text-xs text-muted">Usa el precio de compra de referencia (mediana de los exchanges). Cada plataforma cobra comisiones distintas.</p>
        </Card>
      )}

      {q && q.exchanges.length > 0 && (
        <Card className="mt-4">
          <h2 className="mb-3 font-bold">Precio del USDT por exchange</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted">
                <tr className="border-b border-border">
                  <th className="py-2 font-medium">Plataforma</th>
                  <th className="py-2 text-right font-medium">Comprás a</th>
                  <th className="py-2 text-right font-medium">Vendés a</th>
                </tr>
              </thead>
              <tbody>
                {q.exchanges.map((e) => (
                  <tr key={e.name} className="border-b border-border last:border-0">
                    <td className="py-2">{exchangeName(e.name)}</td>
                    <td className="py-2 text-right tabular-nums">{price(e.buy, s)}</td>
                    <td className="py-2 text-right tabular-nums">{price(e.sell, s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">Precios con comisiones incluidas, para operar 1 USDT. Mostramos los datos a modo informativo: no recomendamos ninguna plataforma.</p>
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="mb-2 font-bold">Por qué el dólar cripto es distinto al oficial</h2>
        <p className="text-sm text-muted">{country.context}</p>
        <p className="mt-2 text-sm">
          <a href={diarioLink("/guias/que-es-el-dolar-cripto", "dolar-cripto")} target="_blank" rel="noopener" className="text-brand hover:underline">
            Qué es el dólar cripto y qué riesgos tiene, en {diario.name} ↗
          </a>
        </p>
        <p className="mt-2 text-sm">
          Conversores:{" "}
          <Link href={`/convertir/${pairSlug("tether", fiat)}`} className="text-brand hover:underline">
            USDT a {fiat.name}
          </Link>{" "}
          ·{" "}
          <Link href={`/convertir/${pairSlug("bitcoin", fiat)}`} className="text-brand hover:underline">
            Bitcoin a {fiat.name}
          </Link>
        </p>
      </Card>

      <Card className="mt-4">
        <h2 className="mb-2 font-bold">Dólar cripto en otros países</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {countries
            .filter((c) => c.slug !== pais)
            .map((c) => (
              <li key={c.slug}>
                <Link href={`/dolar-cripto/${c.slug}`} className="rounded-md border border-border px-2 py-1 hover:bg-brand-soft">
                  {c.name}
                </Link>
              </li>
            ))}
        </ul>
      </Card>
      <Disclaimer />
    </>
  );
}
