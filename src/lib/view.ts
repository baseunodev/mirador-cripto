// Arma los datos livianos que se mandan a los componentes interactivos del navegador.
import type { Coin } from "./data";
import { slugForCoin } from "./catalog";
import { downsample } from "@/components/charts";
import type { Row } from "@/components/market-table";
import type { TickerItem } from "@/components/ticker";

const STABLES = new Set(["usdt", "usdc", "dai", "fdusd", "usde", "usds", "tusd", "pyusd", "busd", "usdd", "usd1", "usdtb", "rlusd"]);
export const isStable = (c: Coin) => STABLES.has(c.symbol.toLowerCase());

export const toRow = (c: Coin): Row => ({
  slug: slugForCoin(c.id),
  symbol: c.symbol,
  name: c.name,
  image: c.image,
  rank: c.market_cap_rank,
  price: c.current_price,
  ch24: c.price_change_percentage_24h,
  ch7: c.price_change_percentage_7d_in_currency ?? null,
  cap: c.market_cap,
  spark: downsample(c.sparkline_in_7d?.price ?? [], 40),
  stable: isStable(c),
});

export const tickerItems = (coins: Coin[]): TickerItem[] =>
  coins
    .filter((c) => !isStable(c))
    .slice(0, 20)
    .map((c) => ({ slug: slugForCoin(c.id), symbol: c.symbol, image: c.image, price: c.current_price, change: c.price_change_percentage_24h }));
