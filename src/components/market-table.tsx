"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { compact, pct, trendClass } from "@/lib/format";
import { Sparkline } from "./charts";
import { LiveChange, LivePrice } from "./live";

export type Row = {
  slug: string;
  symbol: string;
  name: string;
  image: string;
  rank: number;
  price: number;
  ch24: number | null;
  ch7: number | null;
  cap: number;
  spark: number[];
  stable: boolean;
};

const tabs = [
  { key: "all", label: "Todas" },
  { key: "up", label: "🚀 Ganadoras" },
  { key: "down", label: "📉 Perdedoras" },
  { key: "stable", label: "Stablecoins" },
] as const;
type Tab = (typeof tabs)[number]["key"];

/** Tabla del mercado con buscador, filtros y precios en vivo. */
export function MarketTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [limit, setLimit] = useState(25);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = rows.filter((x) => !term || x.name.toLowerCase().includes(term) || x.symbol.toLowerCase().includes(term));
    if (tab === "up") r = r.filter((x) => (x.ch24 ?? 0) > 0).sort((a, b) => (b.ch24 ?? 0) - (a.ch24 ?? 0));
    if (tab === "down") r = r.filter((x) => (x.ch24 ?? 0) < 0).sort((a, b) => (a.ch24 ?? 0) - (b.ch24 ?? 0));
    if (tab === "stable") r = r.filter((x) => x.stable);
    return r;
  }, [rows, q, tab]);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${tab === t.key ? "bg-brand text-white" : "bg-surface-2 text-muted hover:text-fg"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="relative sm:w-64">
          <span className="sr-only">Buscar moneda</span>
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            ⌕
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar: bitcoin, sol, pepe…"
            className="w-full rounded-full border border-border bg-surface-2 py-1.5 pl-8 pr-3 text-sm outline-none placeholder:text-muted focus:border-brand"
          />
        </label>
      </div>

      <div className="-mx-1 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-border">
              <th className="hidden py-2 pr-2 font-medium sm:table-cell">#</th>
              <th className="py-2 pr-2 font-medium">Moneda</th>
              <th className="py-2 pr-2 text-right font-medium">Precio</th>
              <th className="py-2 pr-2 text-right font-medium">24 h</th>
              <th className="hidden py-2 pr-2 text-right font-medium sm:table-cell">7 d</th>
              <th className="hidden py-2 pr-2 text-right font-medium md:table-cell">Capitalización</th>
              <th className="hidden py-2 text-right font-medium lg:table-cell">Últimos 7 días</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map((c) => (
              <tr key={c.slug} className="group border-b border-border/60 transition-colors last:border-0 hover:bg-white/[0.03]">
                <td className="hidden py-3 pr-2 text-muted sm:table-cell">{c.rank}</td>
                <td className="py-3 pr-2">
                  <Link href={`/precio/${c.slug}`} className="flex items-center gap-2.5 font-medium">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" width={24} height={24} loading="lazy" className="h-6 w-6 rounded-full transition group-hover:scale-110" />
                    <span className="truncate group-hover:text-white">{c.name}</span>
                    <span className="text-xs uppercase text-muted">{c.symbol}</span>
                  </Link>
                </td>
                <td className="py-3 pr-2 text-right font-medium">
                  <LivePrice symbol={c.symbol} initial={c.price} />
                </td>
                <td className="py-3 pr-2 text-right">
                  <LiveChange symbol={c.symbol} initial={c.ch24} badge />
                </td>
                <td className="hidden py-3 pr-2 text-right sm:table-cell">
                  <span className={`font-medium tabular-nums ${trendClass(c.ch7)}`}>{pct(c.ch7)}</span>
                </td>
                <td className="hidden py-3 pr-2 text-right tabular-nums text-muted md:table-cell">{compact(c.cap)}</td>
                <td className="hidden py-3 text-right lg:table-cell">
                  <span className="inline-block">
                    <Sparkline data={c.spark} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted">No encontramos “{q}” en el top {rows.length}.</p>}
      </div>
      {filtered.length > limit && (
        <button onClick={() => setLimit((l) => l + 25)} className="mt-3 w-full rounded-xl border border-border bg-surface-2 py-2.5 text-sm font-medium text-muted transition hover:border-brand hover:text-fg">
          Ver más monedas ({filtered.length - limit} más)
        </button>
      )}
    </div>
  );
}
