"use client";
import { useMemo, useState } from "react";
import { price as fmt } from "@/lib/format";
import { projectionBands, type Point } from "@/lib/stats";
import { CoinIcon } from "./coin-icon";

export type FanCoin = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  price: number;
  vol: number; // volatilidad diaria
  history: Point[]; // últimos ~90 días
  hit: Record<string, number | null>; // % real de ventanas que cayeron dentro de la banda 2/3
};

const HORIZONS = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
  { days: 365, label: "1A" },
];

const W = 800;
const H = 300;

/** Abanico de escenarios: historia real a la izquierda, rango probable a la derecha. */
export function ProjectionFan({ coins }: { coins: FanCoin[] }) {
  const [id, setId] = useState(coins[0]?.id);
  const [days, setDays] = useState(30);
  const coin = coins.find((c) => c.id === id) ?? coins[0];

  const g = useMemo(() => {
    if (!coin) return null;
    const bands = projectionBands(coin.price, coin.vol, days, 40);
    const hist = coin.history;
    const histW = W * 0.45; // la historia ocupa el 45% izquierdo
    const all = [...hist.map((p) => p[1]), ...bands.flatMap((b) => [b.p05, b.p95])];
    const min = Math.min(...all) * 0.98;
    const max = Math.max(...all) * 1.02;
    const Y = (v: number) => H - ((v - min) / (max - min || 1)) * H;
    const t0 = hist[0]?.[0] ?? 0;
    const t1 = hist[hist.length - 1]?.[0] ?? 1;
    const hx = (t: number) => ((t - t0) / (t1 - t0 || 1)) * histW;
    const fx = (d: number) => histW + (d / days) * (W - histW);
    const line = hist.map((p, i) => `${i ? "L" : "M"}${hx(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join("");
    const band = (lo: keyof (typeof bands)[0], hi: keyof (typeof bands)[0]) =>
      bands.map((b, i) => `${i ? "L" : "M"}${fx(b.day).toFixed(1)} ${Y(b[hi]).toFixed(1)}`).join("") +
      [...bands].reverse().map((b) => `L${fx(b.day).toFixed(1)} ${Y(b[lo]).toFixed(1)}`).join("") +
      "Z";
    const last = bands[bands.length - 1];
    return { line, outer: band("p05", "p95"), inner: band("p16", "p84"), mid: `M${histW} ${Y(coin.price)}L${W} ${Y(coin.price)}`, last, histW, Y, min, max };
  }, [coin, days]);

  if (!coin || !g) return null;
  const hl = HORIZONS.find((h) => h.days === days)!;
  const hit = coin.hit[String(days)];
  const pct = (v: number) => `${v >= coin.price ? "+" : "−"}${Math.abs((v / coin.price - 1) * 100).toFixed(0)}%`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Moneda">
          {coins.map((c) => (
            <button
              key={c.id}
              onClick={() => setId(c.id)}
              aria-pressed={c.id === coin.id}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] transition ${c.id === coin.id ? "border-brand text-fg" : "border-border text-muted hover:text-fg"}`}
            >
              <CoinIcon src={c.image} symbol={c.symbol} size={16} />
              {c.name}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Plazo" className="flex gap-0.5 rounded-lg border border-border p-[3px]">
          {HORIZONS.map((h) => (
            <button key={h.days} onClick={() => setDays(h.days)} aria-pressed={h.days === days} className={`mono rounded-md px-3 py-1.5 text-xs transition ${h.days === days ? "bg-border text-fg" : "text-muted hover:text-fg"}`}>
              {h.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-6" style={{ height: H }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="img" aria-label={`Rango de escenarios para ${coin.name} a ${hl.label}`}>
          <defs>
            <linearGradient id="fan-in" x1="0" x2="1">
              <stop offset={g.histW / W} stopColor="var(--brand)" stopOpacity="0.55" />
              <stop offset="1" stopColor="var(--brand)" stopOpacity="0.16" />
            </linearGradient>
            <linearGradient id="fan-out" x1="0" x2="1">
              <stop offset={g.histW / W} stopColor="var(--cyan)" stopOpacity="0.28" />
              <stop offset="1" stopColor="var(--cyan)" stopOpacity="0.07" />
            </linearGradient>
          </defs>
          <line x1={g.histW} x2={g.histW} y1="0" y2={H} stroke="#2a2f36" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          <g key={`${coin.id}-${days}`} className="reveal">
            <path d={g.outer} fill="url(#fan-out)" />
            <path d={g.inner} fill="url(#fan-in)" />
            <path d={g.mid} stroke="var(--fg)" strokeOpacity="0.35" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            <path d={g.line} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="glow-brand" />
          </g>
        </svg>
        <span aria-hidden className="ping absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" style={{ left: `${(g.histW / W) * 100}%`, top: `${(g.Y(coin.price) / H) * 100}%` }} />
        <span aria-hidden className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand shadow-[0_0_10px_var(--brand)]" style={{ left: `${(g.histW / W) * 100}%`, top: `${(g.Y(coin.price) / H) * 100}%` }} />
        <span className="mono absolute left-0 top-0 text-[11px] text-faint">ÚLTIMOS 90 DÍAS</span>
        <span className="mono absolute top-0 text-[11px] text-faint" style={{ left: `${(g.histW / W) * 100 + 1}%` }}>
          ESCENARIOS A {hl.label}
        </span>
        {(["p95", "p84", "p16", "p05"] as const).map((k) => (
          <span key={k} className={`mono absolute right-0 -translate-y-1/2 text-[11px] ${k === "p84" || k === "p16" ? "text-brand" : "text-cyan"}`} style={{ top: `${(g.Y(g.last[k]) / H) * 100}%` }}>
            {fmt(g.last[k])}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        <div className="bg-surface p-4">
          <p className="eyebrow">Hoy</p>
          <p className="mt-1.5 text-xl tabular-nums">{fmt(coin.price)}</p>
        </div>
        <div className="bg-surface p-4">
          <p className="eyebrow text-brand">2 de cada 3 escenarios</p>
          <p className="mt-1.5 text-xl tabular-nums">
            {fmt(g.last.p16)} – {fmt(g.last.p84)}
          </p>
          <p className="mono mt-1 text-[11px] text-muted">
            {pct(g.last.p16)} / {pct(g.last.p84)}
          </p>
        </div>
        <div className="bg-surface p-4">
          <p className="eyebrow text-cyan">9 de cada 10 escenarios</p>
          <p className="mt-1.5 text-xl tabular-nums">
            {fmt(g.last.p05)} – {fmt(g.last.p95)}
          </p>
          <p className="mono mt-1 text-[11px] text-muted">
            {pct(g.last.p05)} / {pct(g.last.p95)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Si {coin.name} se sigue moviendo como en el último año, en {hl.days === 365 ? "un año" : `${hl.days} días`} lo más común sería que termine entre {fmt(g.last.p16)} y {fmt(g.last.p84)}.
        {hit != null && ` En el último año, eso pasó de verdad en el ${Math.round(hit * 100)}% de los períodos de ${hl.days === 365 ? "un año" : `${hl.days} días`}.`} No dice si va a subir o bajar: el centro del abanico es el precio de hoy.
      </p>
    </div>
  );
}
