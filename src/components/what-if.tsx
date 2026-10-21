"use client";
import { useState } from "react";
import { pct, price } from "@/lib/format";
import { useLive } from "./live";

export type WhatIfCoin = { id: string; symbol: string; name: string; image: string; series: [number, number][] };

const periods = [
  { key: 7, label: "1 semana" },
  { key: 30, label: "1 mes" },
  { key: 180, label: "6 meses" },
  { key: 365, label: "1 año" },
];
const amounts = [100, 500, 1000];

/** "¿Y si hubieras invertido…?": calculadora para jugar con el pasado (solo informativa). */
export function WhatIf({ coins }: { coins: WhatIfCoin[] }) {
  const usable = coins.filter((c) => c.series.length > 1);
  const [coinId, setCoinId] = useState(usable[0]?.id);
  const [days, setDays] = useState(365);
  const [amount, setAmount] = useState(100);
  const coin = usable.find((c) => c.id === coinId) ?? usable[0];
  const live = useLive(coin?.symbol ?? "");
  if (!coin) return null;

  const s = coin.series;
  const nowPrice = live?.price ?? s[s.length - 1][1];
  const from = s[s.length - 1][0] - days * 864e5;
  const start = s.find((p) => p[0] >= from) ?? s[0];
  const value = (amount / start[1]) * nowPrice;
  const change = ((nowPrice - start[1]) / start[1]) * 100;
  const up = value >= amount;

  // Mini gráfico de cómo habría evolucionado la inversión.
  const pts = s.filter((p) => p[0] >= start[0]);
  const ys = pts.map((p) => p[1]);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${((i / Math.max(pts.length - 1, 1)) * 300).toFixed(1)} ${(60 - ((p[1] - min) / (max - min || 1)) * 56).toFixed(1)}`).join("");

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Si hubieras puesto</p>
          <div className="flex flex-wrap items-center gap-2">
            {amounts.map((a) => (
              <button key={a} onClick={() => setAmount(a)} className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${amount === a ? "bg-brand text-white" : "bg-surface-2 text-muted hover:text-fg"}`}>
                US$ {a}
              </button>
            ))}
            <label className="flex items-center gap-1 rounded-full border border-border bg-surface-2 px-3 py-1 text-sm">
              <span className="text-muted">US$</span>
              <input
                type="number"
                min={1}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                aria-label="Monto en dólares"
                className="w-20 bg-transparent outline-none"
              />
            </label>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">en</p>
          <div className="flex flex-wrap gap-2">
            {usable.map((c) => (
              <button
                key={c.id}
                onClick={() => setCoinId(c.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${c.id === coin.id ? "bg-brand text-white" : "bg-surface-2 text-muted hover:text-fg"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt="" width={18} height={18} className="h-[18px] w-[18px] rounded-full" />
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">hace</p>
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <button key={p.key} onClick={() => setDays(p.key)} className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${days === p.key ? "bg-brand text-white" : "bg-surface-2 text-muted hover:text-fg"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`relative overflow-hidden rounded-2xl border p-5 ${up ? "border-up/30 bg-up/[0.07]" : "border-down/30 bg-down/[0.07]"}`}>
        <p className="text-sm text-muted">Hoy tendrías</p>
        <p key={`${coin.id}-${days}-${amount}`} className={`rise mt-1 text-4xl font-extrabold tabular-nums sm:text-5xl ${up ? "text-up" : "text-down"}`}>
          {price(value)}
        </p>
        <p className="mt-1 text-sm">
          <span className={up ? "text-up" : "text-down"}>
            {up ? "Ganancia" : "Pérdida"} de {price(Math.abs(value - amount))} ({pct(change)})
          </span>
        </p>
        <p className="mt-1 text-xs text-muted">
          {coin.symbol.toUpperCase()} pasó de {price(start[1])} a {price(nowPrice)}
        </p>
        <svg viewBox="0 0 300 62" className="mt-4 h-16 w-full" aria-hidden>
          <path d={d} fill="none" stroke={up ? "var(--up)" : "var(--down)"} strokeWidth="2" />
        </svg>
        <p className="mt-2 text-[11px] text-muted">Cuenta hecha con precios pasados. No es una recomendación ni anticipa lo que va a pasar.</p>
      </div>
    </div>
  );
}
