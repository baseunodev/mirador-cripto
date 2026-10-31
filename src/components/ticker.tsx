"use client";
import Link from "next/link";
import { LiveChange, LivePrice } from "./live";

export type TickerItem = { slug: string; symbol: string; image: string; price: number; change: number | null };

/** Cinta de precios que corre de forma continua (la lista va duplicada para que el loop no se note). */
export function Ticker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null;
  return (
    <div className="overflow-hidden border-t border-line [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]">
      <div className="marquee flex w-max">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1} className="mono flex shrink-0 items-center gap-7 px-4 py-2 text-xs text-muted">
            {items.map((c) => (
              <li key={c.slug}>
                <Link href={`/precio/${c.slug}`} tabIndex={copy ? -1 : undefined} className="flex items-center gap-1.5 hover:text-fg">
                  <span className="uppercase text-fg">{c.symbol}</span>
                  <LivePrice symbol={c.symbol} initial={c.price} prefix="" />
                  <LiveChange symbol={c.symbol} initial={c.change} />
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
