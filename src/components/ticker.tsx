"use client";
import Link from "next/link";
import { LiveChange, LivePrice } from "./live";

export type TickerItem = { slug: string; symbol: string; image: string; price: number; change: number | null };

/** Cinta de precios que corre de forma continua (la lista va duplicada para que el loop no se note). */
export function Ticker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null;
  return (
    <div className="overflow-hidden border-b border-border bg-surface/70 [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]">
      <div className="marquee flex w-max">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-6 px-3 py-2 text-xs">
            {items.map((c) => (
              <li key={c.slug}>
                <Link href={`/precio/${c.slug}`} tabIndex={copy ? -1 : undefined} className="flex items-center gap-1.5 hover:text-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" width={16} height={16} className="h-4 w-4 rounded-full" />
                  <span className="font-semibold uppercase">{c.symbol}</span>
                  <LivePrice symbol={c.symbol} initial={c.price} className="text-fg/90" />
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
