"use client";
import { useState } from "react";
import { price as fmt } from "@/lib/format";
import { CoinIcon } from "./coin-icon";
import { useLive } from "./live";

export type SimCoin = { id: string; name: string; symbol: string; image: string; price: number; ath: number };

const QUICK = [-50, -20, 20, 50, 100];
const parse = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;

/** "Si sube o baja X%, tu tenencia vale tanto": un cálculo, no una predicción. */
export function ScenarioSim({ coins, arsRate }: { coins: SimCoin[]; arsRate: number | null }) {
  const [id, setId] = useState(coins[0]?.id);
  const [amount, setAmount] = useState("0,05");
  const [move, setMove] = useState(20);
  const coin = coins.find((c) => c.id === id) ?? coins[0];
  const live = useLive(coin?.symbol ?? "");
  if (!coin) return null;
  const now = live?.price ?? coin.price;
  const units = parse(amount);
  const target = now * (1 + move / 100);
  const valueNow = units * now;
  const valueThen = units * target;
  const toAth = (coin.ath / now - 1) * 100;
  const ars = (v: number) => (arsRate ? fmt(v * arsRate, "$ ") : "—");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Moneda">
          {coins.map((c) => (
            <button key={c.id} onClick={() => setId(c.id)} aria-pressed={c.id === coin.id} className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] transition ${c.id === coin.id ? "border-brand text-fg" : "border-border text-muted hover:text-fg"}`}>
              <CoinIcon src={c.image} symbol={c.symbol} size={16} />
              {c.symbol.toUpperCase()}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="eyebrow">Cuánto {coin.name} tenés</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mono mt-2 w-full rounded-lg border border-border bg-transparent px-4 py-3 text-lg outline-none focus:border-brand"
          />
        </label>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="move" className="eyebrow">
              Si el precio se mueve
            </label>
            <span className={`text-lg tabular-nums ${move >= 0 ? "text-up" : "text-down"}`}>
              {move > 0 ? "+" : ""}
              {move}%
            </span>
          </div>
          <input id="move" type="range" min={-90} max={300} step={5} value={move} onChange={(e) => setMove(Number(e.target.value))} className="mt-3 w-full accent-[var(--brand)]" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button key={q} onClick={() => setMove(q)} className={`mono rounded-md border px-2.5 py-1 text-xs transition ${move === q ? "border-brand text-fg" : "border-border text-muted hover:text-fg"}`}>
                {q > 0 ? "+" : ""}
                {q}%
              </button>
            ))}
            {toAth > 0 && (
              <button onClick={() => setMove(Math.round(toAth))} className="mono rounded-md border border-border px-2.5 py-1 text-xs text-muted transition hover:text-fg">
                Vuelve al máximo ({`+${Math.round(toAth)}%`})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
        <div className="bg-surface p-5">
          <p className="eyebrow">Hoy vale</p>
          <p className="mt-2 text-2xl tabular-nums">{fmt(valueNow)}</p>
          <p className="mono mt-1 text-xs text-muted">{ars(valueNow)}</p>
          <p className="mono mt-4 text-[11px] text-faint">1 {coin.symbol.toUpperCase()} = {fmt(now)}</p>
        </div>
        <div className="bg-surface p-5">
          <p className="eyebrow text-brand">En ese escenario</p>
          <p className="mt-2 text-2xl tabular-nums">{fmt(valueThen)}</p>
          <p className="mono mt-1 text-xs text-muted">{ars(valueThen)}</p>
          <p className={`mono mt-4 text-[11px] ${valueThen >= valueNow ? "text-up" : "text-down"}`}>
            {valueThen >= valueNow ? "+" : "−"}
            {fmt(Math.abs(valueThen - valueNow))} · 1 {coin.symbol.toUpperCase()} = {fmt(target)}
          </p>
        </div>
        <p className="bg-surface p-4 text-xs leading-relaxed text-muted sm:col-span-2">
          Es una cuenta, no una predicción: nadie sabe si va a pasar. Los pesos usan el dólar cripto de hoy, que también cambia.
        </p>
      </div>
    </div>
  );
}
