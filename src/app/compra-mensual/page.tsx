import type { Metadata } from "next";
import { getToolCoins } from "@/lib/tools";
import { DcaCalculator } from "@/components/dca";
import { AdSlot, Breadcrumbs, Unavailable } from "@/components/ui";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Calculadora de compra mensual de bitcoin (DCA): cuánto tendrías hoy",
  description: "Calculá cuánto tendrías hoy si hubieras comprado un monto fijo de bitcoin, ethereum o solana cada semana o cada mes, con precios reales.",
  alternates: { canonical: "/compra-mensual" },
};

export default async function CompraMensualPage() {
  const coins = await getToolCoins();
  const dca = coins.map(({ id, name, symbol, image, price, series }) => ({ id, name, symbol, image, price, series }));
  return (
    <>
      <Breadcrumbs items={[{ name: "Compra mensual", href: "/compra-mensual" }]} />
      <p className="eyebrow">Herramientas</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">¿Y si hubieras comprado un poco cada mes?</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Comprar un monto fijo cada tanto, sin mirar el precio, es la forma más común de ahorrar en cripto. Elegí cuánto y cada cuánto, y mirá cómo te hubiera ido con los precios reales.
      </p>
      <section className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-6">{dca.length ? <DcaCalculator coins={dca} /> : <Unavailable what="el historial de precios" />}</section>
      <AdSlot slot="compra-mensual-mid" minHeight={120} />
      <p className="mt-8 rounded-lg border border-border p-4 text-xs leading-relaxed text-muted">
        Cálculo con el precio de cierre de cada día de compra, sin comisiones. Que haya salido bien en el pasado no quiere decir que vuelva a pasar. No es una recomendación de compra.
      </p>
    </>
  );
}
