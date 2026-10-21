import Link from "next/link";
import type { Coin } from "@/lib/data";
import { slugForCoin } from "@/lib/catalog";
import { compact, price } from "@/lib/format";
import { Sparkline } from "./charts";
import { Change } from "./ui";

export function CoinTable({ coins }: { coins: Coin[] }) {
  return (
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
          {coins.map((c) => (
            <tr key={c.id} className="border-b border-border last:border-0 hover:bg-brand-soft/50">
              <td className="hidden py-2.5 pr-2 text-muted sm:table-cell">{c.market_cap_rank}</td>
              <td className="py-2.5 pr-2">
                <Link href={`/precio/${slugForCoin(c.id)}`} className="flex items-center gap-2 font-medium hover:underline">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" width={20} height={20} loading="lazy" className="h-5 w-5 rounded-full" />
                  ) : (
                    <span className="h-5 w-5 rounded-full bg-border" />
                  )}
                  <span className="truncate">{c.name}</span> <span className="text-xs uppercase text-muted">{c.symbol}</span>
                </Link>
              </td>
              <td className="py-2.5 pr-2 text-right tabular-nums">{price(c.current_price)}</td>
              <td className="py-2.5 pr-2 text-right"><Change value={c.price_change_percentage_24h} /></td>
              <td className="hidden py-2.5 pr-2 text-right sm:table-cell"><Change value={c.price_change_percentage_7d_in_currency} /></td>
              <td className="hidden py-2.5 pr-2 text-right tabular-nums md:table-cell">{compact(c.market_cap)}</td>
              <td className="hidden py-2.5 text-right lg:table-cell">
                <span className="inline-block">
                  <Sparkline data={(c.sparkline_in_7d?.price ?? []).filter((_, i) => i % 4 === 0)} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
