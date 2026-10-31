"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { compact, pct, trendClass } from "@/lib/format";
import { Sparkline } from "./charts";
import { LiveChange, LivePrice } from "./live";
import { CoinIcon } from "./coin-icon";
import { FavButton, useFavorites } from "./favorites";

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
  { key: "fav", label: "Favoritas" },
  { key: "up", label: "Suben" },
  { key: "down", label: "Bajan" },
  { key: "stable", label: "Stablecoins" },
] as const;
type Tab = (typeof tabs)[number]["key"];

/** Tabla del mercado con buscador, filtros y precios en vivo. */
export function MarketTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [limit, setLimit] = useState(25);
  const { favs } = useFavorites();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = rows.filter((x) => !term || x.name.toLowerCase().includes(term) || x.symbol.toLowerCase().includes(term));
    if (tab === "up") r = r.filter((x) => (x.ch24 ?? 0) > 0).sort((a, b) => (b.ch24 ?? 0) - (a.ch24 ?? 0));
    if (tab === "down") r = r.filter((x) => (x.ch24 ?? 0) < 0).sort((a, b) => (a.ch24 ?? 0) - (b.ch24 ?? 0));
    if (tab === "stable") r = r.filter((x) => x.stable);
    if (tab === "fav") r = r.filter((x) => favs.includes(x.slug));
    return r;
  }, [rows, q, tab, favs]);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs transition ${tab === t.key ? "border-brand bg-brand text-on-brand" : "border-border text-muted hover:text-fg"}`}
            >
              {t.label}
              {t.key === "fav" && favs.length > 0 && <span className="mono ml-1.5 opacity-70">{favs.length}</span>}
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
            className="w-full rounded-md border border-border bg-transparent py-1.5 pl-8 pr-3 text-[13px] outline-none placeholder:text-muted focus:border-brand"
          />
        </label>
      </div>

      <div className="-mx-1 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="mono text-left text-[11px] uppercase tracking-wider text-faint">
            <tr className="border-b border-border">
              <th className="w-8 py-2 font-medium"><span className="sr-only">Favorita</span></th>
              <th className="hidden py-2 pr-2 font-normal sm:table-cell">#</th>
              <th className="py-2 pr-2 font-normal">Moneda</th>
              <th className="py-2 pr-2 text-right font-normal">Precio</th>
              <th className="py-2 pr-2 text-right font-normal">24 h</th>
              <th className="hidden py-2 pr-2 text-right font-normal sm:table-cell">7 d</th>
              <th className="hidden py-2 pr-2 text-right font-normal md:table-cell">Capitalización</th>
              <th className="hidden py-2 text-right font-normal lg:table-cell">Últimos 7 días</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map((c) => (
              <tr key={c.slug} className="group border-t border-line transition-colors hover:bg-surface-2">
                <td className="py-3">
                  <FavButton slug={c.slug} name={c.name} />
                </td>
                <td className="mono hidden py-3 pr-2 text-xs text-faint sm:table-cell">{c.rank}</td>
                <td className="py-3 pr-2">
                  <Link href={`/precio/${c.slug}`} className="flex items-center gap-3">
                    <CoinIcon src={c.image} symbol={c.symbol} size={26} className="transition group-hover:scale-110" />
                    <span className="truncate font-medium">{c.name}</span>
                    <span className="mono text-[11px] uppercase text-faint">{c.symbol}</span>
                  </Link>
                </td>
                <td className="py-3 pr-2 text-right font-normal">
                  <LivePrice symbol={c.symbol} initial={c.price} />
                </td>
                <td className="py-3 pr-2 text-right">
                  <LiveChange symbol={c.symbol} initial={c.ch24} badge />
                </td>
                <td className="hidden py-3 pr-2 text-right sm:table-cell">
                  <span className={`text-[13px] tabular-nums ${trendClass(c.ch7)}`}>{pct(c.ch7)}</span>
                </td>
                <td className="hidden py-3 pr-2 text-right text-[13px] tabular-nums text-muted md:table-cell">{compact(c.cap)}</td>
                <td className="hidden py-3 text-right lg:table-cell">
                  <span className="inline-block">
                    <Sparkline data={c.spark} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
            {tab === "fav" && !q ? "Todavía no seguís ninguna moneda. Tocá la estrella al lado de cualquiera para tenerla acá." : `No encontramos “${q}” en el top ${rows.length}.`}
          </p>
        )}
      </div>
      {filtered.length > limit && (
        <button onClick={() => setLimit((l) => l + 25)} className="mt-3 w-full rounded-lg border border-border py-2.5 text-sm text-muted transition hover:border-[#3a414b] hover:text-fg">
          Ver más monedas ({filtered.length - limit} más)
        </button>
      )}
    </div>
  );
}
