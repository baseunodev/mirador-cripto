"use client";
// Cartera personal guardada solo en el navegador: sin cuenta, sin servidor, nadie más la ve.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { pct, price as fmt } from "@/lib/format";
import { CoinIcon } from "./coin-icon";
import { useLive } from "./live";

export type PfCoin = { slug: string; name: string; symbol: string; image: string; price: number; ch24: number | null };
type Holding = { slug: string; amount: number };

const KEY = "mc:cartera";
const COLORS = ["#c8f031", "#8ea2ff", "#f7931a", "#3ddc97", "#ff8fb1", "#5cc8ff", "#f5a524", "#b98cff"];
const parse = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;

function load(): Holding[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((h) => typeof h?.slug === "string" && h.amount > 0) : [];
  } catch {
    return [];
  }
}

function Row({ coin, amount, total, color, onRemove, onPrice }: { coin: PfCoin; amount: number; total: number; color: string; onRemove: () => void; onPrice: (slug: string, p: number) => void }) {
  const live = useLive(coin.symbol);
  const p = live?.price ?? coin.price;
  const ch = live?.change ?? coin.ch24;
  const value = amount * p;
  useEffect(() => onPrice(coin.slug, p), [coin.slug, p, onPrice]);
  return (
    <tr className="border-t border-line">
      <td className="py-3 pr-2">
        <Link href={`/precio/${coin.slug}`} className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          <CoinIcon src={coin.image} symbol={coin.symbol} size={24} />
          <span className="font-medium">{coin.name}</span>
          <span className="mono text-[11px] uppercase text-faint">{coin.symbol}</span>
        </Link>
      </td>
      <td className="py-3 pr-2 text-right text-[13px] tabular-nums text-muted">{amount.toLocaleString("es-AR", { maximumFractionDigits: 8 })}</td>
      <td className="hidden py-3 pr-2 text-right text-[13px] tabular-nums sm:table-cell">{fmt(p)}</td>
      <td className={`py-3 pr-2 text-right text-[13px] tabular-nums ${(ch ?? 0) >= 0 ? "text-up" : "text-down"}`}>{pct(ch)}</td>
      <td className="py-3 pr-2 text-right text-[13px] tabular-nums">{fmt(value)}</td>
      <td className="hidden py-3 pr-2 text-right text-[13px] tabular-nums text-muted md:table-cell">{total ? `${((value / total) * 100).toFixed(1).replace(".", ",")}%` : "—"}</td>
      <td className="py-3 text-right">
        <button onClick={onRemove} aria-label={`Quitar ${coin.name}`} className="rounded p-1 text-faint transition hover:text-down">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

export function Portfolio({ coins, arsRate }: { coins: PfCoin[]; arsRate: number | null }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [ready, setReady] = useState(false);
  const [slug, setSlug] = useState(coins[0]?.slug ?? "");
  const [amount, setAmount] = useState("");
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    setHoldings(load());
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(holdings));
    } catch {}
  }, [holdings, ready]);

  const onPrice = useMemo(() => (s: string, p: number) => setPrices((prev) => (prev[s] === p ? prev : { ...prev, [s]: p })), []);
  const bySlug = useMemo(() => new Map(coins.map((c) => [c.slug, c])), [coins]);
  const rows = holdings.flatMap((h, i) => {
    const c = bySlug.get(h.slug);
    return c ? [{ h, c, color: COLORS[i % COLORS.length] }] : [];
  });
  const values = rows.map(({ h, c }) => h.amount * (prices[c.slug] ?? c.price));
  const total = values.reduce((a, b) => a + b, 0);
  const prevTotal = rows.reduce((a, { c }, i) => a + values[i] / (1 + (c.ch24 ?? 0) / 100), 0);
  const ch = prevTotal ? (total / prevTotal - 1) * 100 : 0;

  const add = () => {
    const n = parse(amount);
    if (!slug || n <= 0) return;
    setHoldings((prev) => {
      const ex = prev.find((h) => h.slug === slug);
      return ex ? prev.map((h) => (h.slug === slug ? { ...h, amount: h.amount + n } : h)) : [...prev, { slug, amount: n }];
    });
    setAmount("");
  };

  return (
    <div>
      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        <div className="bg-surface p-5 sm:col-span-2">
          <p className="eyebrow">Tu cartera vale</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{fmt(total)}</p>
          <p className="mono mt-1 text-sm text-muted">
            {arsRate ? fmt(total * arsRate, "$ ") : "—"} <span className="text-faint">al dólar cripto</span>
          </p>
          {rows.length > 0 && (
            <div className="mt-5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
              {rows.map(({ c, color }, i) => (
                <span key={c.slug} title={c.name} style={{ width: `${total ? (values[i] / total) * 100 : 0}%`, background: color }} />
              ))}
            </div>
          )}
        </div>
        <div className="bg-surface p-5">
          <p className="eyebrow">Últimas 24 h</p>
          <p className={`mt-2 text-2xl tabular-nums ${ch >= 0 ? "text-up" : "text-down"}`}>{pct(ch)}</p>
          <p className={`mono mt-1 text-sm ${ch >= 0 ? "text-up" : "text-down"}`}>
            {total - prevTotal >= 0 ? "+" : "−"}
            {fmt(Math.abs(total - prevTotal))}
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="mt-6 flex flex-col gap-2 sm:flex-row"
      >
        <label className="sr-only" htmlFor="pf-coin">
          Moneda
        </label>
        <select id="pf-coin" value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand sm:w-64">
          {coins.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.symbol.toUpperCase()})
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="pf-amount">
          Cantidad
        </label>
        <input id="pf-amount" inputMode="decimal" placeholder="Cantidad, ej. 0,05" value={amount} onChange={(e) => setAmount(e.target.value)} className="mono flex-1 rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand" />
        <button type="submit" className="btn-primary">
          Agregar
        </button>
      </form>

      {ready && rows.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          Cargá las monedas que tenés para ver cuánto vale tu cartera en dólares y en pesos. Se guarda solo en este dispositivo: no necesitás cuenta y nadie más la ve.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="mono text-left text-[11px] uppercase tracking-wider text-faint">
              <tr>
                <th className="py-2 pr-2 font-normal">Moneda</th>
                <th className="py-2 pr-2 text-right font-normal">Cantidad</th>
                <th className="hidden py-2 pr-2 text-right font-normal sm:table-cell">Precio</th>
                <th className="py-2 pr-2 text-right font-normal">24 h</th>
                <th className="py-2 pr-2 text-right font-normal">Valor</th>
                <th className="hidden py-2 pr-2 text-right font-normal md:table-cell">Peso</th>
                <th className="py-2">
                  <span className="sr-only">Quitar</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ h, c, color }) => (
                <Row key={c.slug} coin={c} amount={h.amount} total={total} color={color} onPrice={onPrice} onRemove={() => setHoldings((prev) => prev.filter((x) => x.slug !== h.slug))} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
