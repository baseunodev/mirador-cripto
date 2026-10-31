import "server-only";
// Datos que comparten /proyecciones y /compra-mensual: precio, serie de 1 año y volatilidad.
import { getChart, getMarkets } from "./data";
import { dailyVol, historicalHitRate, type Point } from "./stats";
import { downsample } from "@/components/charts";

export const TOOL_COINS = ["bitcoin", "ethereum", "solana"];

export async function getToolCoins() {
  const markets = await getMarkets();
  const out = await Promise.all(
    TOOL_COINS.map(async (id) => {
      const c = markets.find((m) => m.id === id);
      const series = (await getChart(id, 365)) as Point[];
      if (!c || series.length < 60) return null;
      const vol = dailyVol(series);
      const hit: Record<string, number | null> = {};
      for (const d of [7, 30, 90]) {
        const s = vol * Math.sqrt(d);
        hit[d] = historicalHitRate(series, d, Math.exp(-s) - 1, Math.exp(s) - 1);
      }
      const cutoff = Date.now() - 90 * 864e5;
      const history = downsample(series.filter((p) => p[0] >= cutoff), 90) as Point[];
      return { id, name: c.name, symbol: c.symbol, image: c.image, price: c.current_price, ath: c.ath, vol, series, history, hit };
    }),
  );
  return out.filter((x) => x !== null);
}
