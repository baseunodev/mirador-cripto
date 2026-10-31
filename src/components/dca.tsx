"use client";
import { useMemo, useState } from "react";
import { pct, price as fmt } from "@/lib/format";
import { simulateDca, type Point } from "@/lib/stats";
import { CoinIcon } from "./coin-icon";

export type DcaCoin = { id: string; name: string; symbol: string; image: string; price: number; series: Point[] };

const PERIODS = [
  { months: 3, label: "3 meses" },
  { months: 6, label: "6 meses" },
  { months: 12, label: "1 año" },
];
const FREQ = [
  { days: 7, label: "Semanal" },
  { days: 30, label: "Mensual" },
];
const parse = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;
const W = 800;
const H = 200;

/** "Si hubieras comprado X por mes": simulación con precios reales del último año. */
export function DcaCalculator({ coins }: { coins: DcaCoin[] }) {
  const [id, setId] = useState(coins[0]?.id);
  const [amount, setAmount] = useState("50");
  const [months, setMonths] = useState(12);
  const [every, setEvery] = useState(30);
  const coin = coins.find((c) => c.id === id) ?? coins[0];

  const r = useMemo(() => {
    if (!coin) return null;
    const from = Date.now() - months * 30.44 * 864e5;
    const series = coin.series.filter((p) => p[0] >= from);
    const res = simulateDca(series, parse(amount), every, coin.price);
    if (res.curve.length < 2) return { res, value: "", invested: "" };
    const t0 = res.curve[0][0];
    const t1 = res.curve[res.curve.length - 1][0];
    // Línea de lo invertido (escalones) para comparar con el valor.
    let inv = 0;
    let next = t0;
    const invCurve: Point[] = res.curve.map(([t]) => {
      while (t >= next) {
        inv += parse(amount);
        next += every * 864e5;
      }
      return [t, inv];
    });
    const max = Math.max(...res.curve.map((p) => p[1]), ...invCurve.map((p) => p[1])) * 1.05 || 1;
    const X = (t: number) => ((t - t0) / (t1 - t0 || 1)) * W;
    const Y = (v: number) => H - (v / max) * H;
    const path = (c: Point[]) => c.map(([t, v], i) => `${i ? "L" : "M"}${X(t).toFixed(1)} ${Y(v).toFixed(1)}`).join("");
    return { res, value: path(res.curve), invested: path(invCurve) };
  }, [coin, amount, months, every]);

  if (!coin || !r) return null;
  const { res } = r;
  const up = res.pnl >= 0;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="eyebrow">Moneda</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {coins.map((c) => (
              <button key={c.id} onClick={() => setId(c.id)} aria-pressed={c.id === coin.id} className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] transition ${c.id === coin.id ? "border-brand text-fg" : "border-border text-muted hover:text-fg"}`}>
                <CoinIcon src={c.image} symbol={c.symbol} size={16} />
                {c.symbol.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="eyebrow">Cada compra (US$)</span>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="mono mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-brand" />
        </label>
        <div>
          <p className="eyebrow">Frecuencia</p>
          <div className="mt-2 flex gap-1">
            {FREQ.map((f) => (
              <button key={f.days} onClick={() => setEvery(f.days)} aria-pressed={f.days === every} className={`flex-1 rounded-md border px-2 py-2 text-xs transition ${f.days === every ? "border-brand text-fg" : "border-border text-muted hover:text-fg"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-0.5 self-start rounded-lg border border-border p-[3px]" role="group" aria-label="Desde hace">
        {PERIODS.map((p) => (
          <button key={p.months} onClick={() => setMonths(p.months)} aria-pressed={p.months === months} className={`mono flex-1 rounded-md px-3 py-1.5 text-xs transition sm:flex-none ${p.months === months ? "bg-border text-fg" : "text-muted hover:text-fg"}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        <div className="bg-surface p-4">
          <p className="eyebrow">Pusiste</p>
          <p className="mt-1.5 text-xl tabular-nums">{fmt(res.invested)}</p>
          <p className="mono mt-1 text-[11px] text-muted">{res.buys} compras</p>
        </div>
        <div className="bg-surface p-4">
          <p className="eyebrow">Hoy tendrías</p>
          <p className="mt-1.5 text-xl tabular-nums">{fmt(res.value)}</p>
          <p className="mono mt-1 text-[11px] text-muted">
            {res.units.toLocaleString("es-AR", { maximumFractionDigits: 6 })} {coin.symbol.toUpperCase()}
          </p>
        </div>
        <div className="bg-surface p-4">
          <p className="eyebrow">Resultado</p>
          <p className={`mt-1.5 text-xl tabular-nums ${up ? "text-up" : "text-down"}`}>
            {up ? "+" : "−"}
            {fmt(Math.abs(res.pnl))}
          </p>
          <p className={`mono mt-1 text-[11px] ${up ? "text-up" : "text-down"}`}>{pct(res.pnlPct)}</p>
        </div>
      </div>

      {r.value && (
        <div className="mt-6">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[200px] w-full" role="img" aria-label="Valor de la compra periódica comparado con lo invertido">
            <defs>
              <linearGradient id="dca-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={up ? "var(--up)" : "var(--down)"} stopOpacity="0.35" />
                <stop offset="1" stopColor={up ? "var(--up)" : "var(--down)"} stopOpacity="0" />
              </linearGradient>
            </defs>
            <g key={`${r.value.length}-${r.invested.length}`} className="reveal">
              <path d={`${r.value}L${W} ${H}L0 ${H}Z`} fill="url(#dca-fill)" />
              <path d={r.invested} fill="none" stroke="#5c636d" strokeDasharray="4 4" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <path d={r.value} fill="none" stroke={up ? "var(--up)" : "var(--down)"} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className={up ? "glow-up" : "glow-down"} />
            </g>
          </svg>
          <div className="mono mt-2 flex gap-5 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-px w-4" style={{ background: up ? "var(--up)" : "var(--down)" }} /> Valor de lo comprado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-px w-4 bg-faint" /> Lo que pusiste
            </span>
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-muted">Calculado con precios reales de CoinGecko, sin comisiones. Lo que pasó antes no asegura lo que va a pasar.</p>
    </div>
  );
}
