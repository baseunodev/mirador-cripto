import type { Metadata } from "next";
import Link from "next/link";
import { getPredictionMarkets, getUsdtQuote } from "@/lib/data";
import { getToolCoins } from "@/lib/tools";
import { compact } from "@/lib/format";
import { ProjectionFan } from "@/components/projection-fan";
import { ScenarioSim } from "@/components/scenario-sim";
import { AdSlot, Breadcrumbs, Unavailable } from "@/components/ui";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Proyecciones de bitcoin: rango probable, escenarios y apuestas del mercado",
  description:
    "Hasta dónde se puede mover bitcoin según su volatilidad real, un simulador de escenarios para tu inversión y lo que apuestan los mercados de predicción. Sin promesas ni recomendaciones.",
  alternates: { canonical: "/proyecciones" },
};

function Section({ n, title, sub, children }: { n: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 rounded-xl border border-border bg-surface p-5 sm:p-6">
      <p className="eyebrow">
        <span className="text-brand">{n}</span> · {title}
      </p>
      <p className="mt-1.5 max-w-2xl text-sm text-muted">{sub}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function ProyeccionesPage() {
  const [coins, markets, q] = await Promise.all([getToolCoins(), getPredictionMarkets(6), getUsdtQuote("ars")]);
  const fan = coins.map(({ id, name, symbol, image, price, vol, history, hit }) => ({ id, name, symbol, image, price, vol, history, hit }));
  const sim = coins.map(({ id, name, symbol, image, price, ath }) => ({ id, name, symbol, image, price, ath }));

  return (
    <>
      <Breadcrumbs items={[{ name: "Proyecciones", href: "/proyecciones" }]} />
      <p className="eyebrow">Herramientas</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">¿Hasta dónde puede llegar?</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Nadie sabe el precio de mañana. Lo que sí se puede medir es cuánto se suele mover cada moneda. Con eso armamos rangos y escenarios para que pienses tu inversión con números, no con promesas.
      </p>

      <Section n="01" title="Rango probable" sub="Calculado con la volatilidad real del último año. No es un pronóstico: muestra hasta dónde llegó el precio en movimientos normales.">
        {fan.length ? <ProjectionFan coins={fan} /> : <Unavailable what="el historial de precios" />}
      </Section>

      <Section n="02" title="Simulador de escenarios" sub="¿Qué pasa con tu plata si sube o baja tanto? Mové la barra y miralo en dólares y en pesos.">
        {sim.length ? <ScenarioSim coins={sim} arsRate={q?.mid ?? null} /> : <Unavailable what="los precios" />}
      </Section>

      <AdSlot slot="proyecciones-mid" minHeight={120} />

      <Section
        n="03"
        title="Qué apuesta el mercado"
        sub="Probabilidades de Polymarket, un mercado de predicción donde la gente apuesta dinero real. Son la opinión de sus apostadores, no la nuestra, y pueden equivocarse."
      >
        {markets.length ? (
          <ul className="divide-y divide-line">
            {markets.map((m) => {
              const p = Math.round(m.yes * 100);
              return (
                <li key={m.url} className="grid items-center gap-3 py-3.5 sm:grid-cols-[1fr_220px]">
                  <a href={m.url} target="_blank" rel="noopener nofollow" className="text-sm leading-snug transition hover:text-brand">
                    {m.question}
                  </a>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${p}%` }} />
                    </div>
                    <span className="mono w-12 text-right text-sm tabular-nums">{p}%</span>
                    <span className="mono hidden w-16 text-right text-[11px] text-faint sm:inline">{compact(m.volume)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Unavailable what="los mercados de predicción" />
        )}
        <p className="mono mt-4 text-[11px] uppercase tracking-wider text-faint">Fuente: Polymarket · % = probabilidad de que pase según los apostadores · volumen apostado en USD</p>
      </Section>

      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
        <Link href="/compra-mensual" className="group bg-surface p-5 transition hover:bg-surface-2">
          <p className="eyebrow">Otra herramienta</p>
          <p className="mt-1.5 font-semibold">Calculadora de compra mensual</p>
          <p className="mt-1 text-sm text-muted">¿Cuánto tendrías si hubieras comprado un poco cada mes?</p>
        </Link>
        <Link href="/mi-cartera" className="group bg-surface p-5 transition hover:bg-surface-2">
          <p className="eyebrow">Otra herramienta</p>
          <p className="mt-1.5 font-semibold">Mi cartera</p>
          <p className="mt-1 text-sm text-muted">Cargá lo que tenés y mirá cuánto vale en dólares y pesos, sin crear cuenta.</p>
        </Link>
      </div>

      <p className="mt-8 rounded-lg border border-border p-4 text-xs leading-relaxed text-muted">
        Todo lo de esta página es educativo. Los rangos usan estadística sobre el pasado, y el pasado no garantiza nada: puede haber movimientos mucho más grandes. No es una recomendación de compra ni de venta. Antes de invertir, informate y no pongas plata que no puedas perder.
      </p>
    </>
  );
}
