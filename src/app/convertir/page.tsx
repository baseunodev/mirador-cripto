import type { Metadata } from "next";
import Link from "next/link";
import { getMarkets } from "@/lib/data";
import { converterCoins, fiats, pairSlug } from "@/lib/catalog";
import { CoinIcon } from "@/components/coin-icon";
import { LivePrice } from "@/components/live";
import { Breadcrumbs, Card } from "@/components/ui";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Conversores cripto: bitcoin, USDT y más a pesos, euros y dólares",
  description: "Convertí bitcoin, ethereum, USDT y otras criptomonedas a pesos argentinos, mexicanos, colombianos, chilenos, soles, bolívares, euros y dólares, con el precio de hoy.",
  alternates: { canonical: "/convertir" },
};

export default async function ConvertHub() {
  const coins = await getMarkets();
  return (
    <>
      <Breadcrumbs items={[{ name: "Conversores", href: "/convertir" }]} />
      <div className="rise">
        <p className="eyebrow">Calculadoras</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Conversores <span className="text-gradient">cripto</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Elegí una moneda y a qué la querés pasar. En los países con brecha cambiaria usamos el precio del USDT, que es el que se paga de verdad.
        </p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {converterCoins.map((id) => {
          const c = coins.find((x) => x.id === id);
          if (!c) return null;
          const targets = fiats.filter((f) => !(f.code === "usd" && (id === "tether" || id === "usd-coin")));
          return (
            <Card key={id} className="card-hover">
              <div className="flex items-center gap-3">
                <CoinIcon src={c.image} symbol={c.symbol} size={36} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.name}</p>
                  <LivePrice symbol={c.symbol} initial={c.current_price} className="text-sm text-muted" />
                </div>
              </div>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {targets.map((f) => (
                  <li key={f.code}>
                    <Link href={`/convertir/${pairSlug(id, f)}`} className="inline-block rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted transition hover:bg-brand-soft hover:text-fg">
                      a {f.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
