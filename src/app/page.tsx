import Link from "next/link";
import { getArDollars, getFearGreed, getGlobal, getMarkets, getUsdtQuote, REVALIDATE } from "@/lib/data";
import { getPosts } from "@/lib/content";
import { countries } from "@/lib/catalog";
import { compact, fngLabel, number, price } from "@/lib/format";
import { CoinTable } from "@/components/coin-table";
import { AdSlot, Card, Change, Unavailable, Updated } from "@/components/ui";
import { PostList } from "@/components/posts";

export const revalidate = 900;

export default async function Home() {
  const [coins, global, fng, ar, usdtAr] = await Promise.all([getMarkets(), getGlobal(), getFearGreed(1), getArDollars(), getUsdtQuote("ars")]);
  const btc = coins.find((c) => c.id === "bitcoin");
  const eth = coins.find((c) => c.id === "ethereum");
  const blue = ar.find((d) => d.casa === "blue");
  const oficial = ar.find((d) => d.casa === "oficial");
  const news = getPosts("noticias").slice(0, 4);
  const today = fng[0];

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Precios de criptomonedas hoy</h1>
      <p className="mt-1 text-muted">El mercado en vivo, en tu moneda y explicado sin humo.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-muted">Bitcoin</p>
          <p className="text-xl font-bold tabular-nums">{price(btc?.current_price)}</p>
          <Change value={btc?.price_change_percentage_24h} className="text-sm" />
        </Card>
        <Card>
          <p className="text-xs text-muted">Ethereum</p>
          <p className="text-xl font-bold tabular-nums">{price(eth?.current_price)}</p>
          <Change value={eth?.price_change_percentage_24h} className="text-sm" />
        </Card>
        <Card>
          <p className="text-xs text-muted">Capitalización total</p>
          <p className="text-xl font-bold tabular-nums">{compact(global?.total_market_cap_usd)}</p>
          <Change value={global?.market_cap_change_24h} className="text-sm" />
          <p className="text-xs text-muted">Dominancia BTC {number(global?.btc_dominance, 1)}%</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Miedo y codicia</p>
          <p className="text-xl font-bold">{today ? `${today.value} · ${fngLabel(today.label)}` : "—"}</p>
          <Link href="/indice-miedo-codicia" className="text-xs text-brand hover:underline">
            Qué significa →
          </Link>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold">Dólar cripto en Argentina</h2>
          <Link href="/dolar-cripto/argentina" className="text-sm text-brand hover:underline">
            Ver brecha e histórico →
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted">USDT</p>
            <p className="text-lg font-bold tabular-nums">{price(usdtAr?.buy, "$ ")}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Blue</p>
            <p className="text-lg font-bold tabular-nums">{price(blue?.venta, "$ ")}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Oficial</p>
            <p className="text-lg font-bold tabular-nums">{price(oficial?.venta, "$ ")}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          Otros países:{" "}
          {countries
            .filter((c) => c.slug !== "argentina")
            .map((c, i) => (
              <span key={c.slug}>
                {i > 0 && " · "}
                <Link href={`/dolar-cripto/${c.slug}`} className="text-brand hover:underline">
                  {c.name}
                </Link>
              </span>
            ))}
        </p>
      </Card>

      <AdSlot slot="home-top" minHeight={120} />

      <Card className="mt-4">
        <h2 className="mb-3 font-bold">Top 100 por capitalización</h2>
        {coins.length ? <CoinTable coins={coins.slice(0, 100)} /> : <Unavailable what="los precios" />}
        <div className="mt-3">
          <Updated at={btc?.last_updated ?? Date.now()} source="CoinGecko" />
        </div>
      </Card>

      {news.length > 0 && (
        <Card className="mt-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-bold">Últimas noticias</h2>
            <Link href="/noticias" className="text-sm text-brand hover:underline">
              Todas →
            </Link>
          </div>
          <PostList posts={news} />
        </Card>
      )}

      <AdSlot slot="home-bottom" />
      <p className="sr-only">Los precios se actualizan cada {REVALIDATE.markets / 60} minutos.</p>
    </>
  );
}
