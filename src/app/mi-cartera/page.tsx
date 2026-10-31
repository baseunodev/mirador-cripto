import type { Metadata } from "next";
import { getMarkets, getUsdtQuote } from "@/lib/data";
import { slugForCoin } from "@/lib/catalog";
import { Portfolio } from "@/components/portfolio";
import { Breadcrumbs } from "@/components/ui";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Mi cartera cripto: cuánto valen tus monedas hoy, en dólares y pesos",
  description: "Cargá las criptomonedas que tenés y mirá cuánto valen en vivo, en dólares y al dólar cripto. Sin cuenta: se guarda solo en tu dispositivo.",
  alternates: { canonical: "/mi-cartera" },
};

export default async function MiCarteraPage() {
  const [markets, q] = await Promise.all([getMarkets(), getUsdtQuote("ars")]);
  const coins = markets.slice(0, 100).map((c) => ({ slug: slugForCoin(c.id), name: c.name, symbol: c.symbol, image: c.image, price: c.current_price, ch24: c.price_change_percentage_24h }));
  return (
    <>
      <Breadcrumbs items={[{ name: "Mi cartera", href: "/mi-cartera" }]} />
      <p className="eyebrow">Herramientas</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Mi cartera</h1>
      <p className="mt-2 max-w-2xl text-muted">Lo que tenés, en vivo. Sin cuenta, sin mail y sin conectar ninguna billetera.</p>
      <div className="mt-8">
        <Portfolio coins={coins} arsRate={q?.mid ?? null} />
      </div>
    </>
  );
}
