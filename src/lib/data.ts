// Capa de datos. Todas las llamadas van del servidor (nunca del navegador) y se cachean con ISR
// para no pasarse del límite gratuito de CoinGecko (~10.000 llamadas/mes en el plan Demo).
// Presupuesto: mercados cada 15 min (~2.900/mes), global cada 1 h (~720), gráficos cada 12 h por moneda.
import "server-only";
import * as mock from "./mock";

const MOCK = process.env.MOCK_DATA === "1";
const CG = "https://api.coingecko.com/api/v3";

export const REVALIDATE = {
  markets: 900,
  global: 3600,
  chart: 43200,
  fx: 1800,
  usdt: 600,
  fng: 3600,
};

async function getJson<T>(url: string, revalidate: number, headers: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { accept: "application/json", ...headers }, next: { revalidate } });
    if (!res.ok) {
      console.error(`[data] ${res.status} ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[data] error ${url}`, err);
    return null;
  }
}

const cgHeaders = (): Record<string, string> =>
  process.env.COINGECKO_API_KEY ? { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY } : {};

export type Coin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number | null;
  low_24h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  last_updated: string;
  sparkline_in_7d?: { price: number[] };
};

/** Top 250 por capitalización, en USD. Una sola llamada alimenta dashboard, fichas y conversores. */
export async function getMarkets(): Promise<Coin[]> {
  if (MOCK) return mock.markets();
  const url = `${CG}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=true&price_change_percentage=7d`;
  return (await getJson<Coin[]>(url, REVALIDATE.markets, cgHeaders())) ?? [];
}

export async function getCoin(id: string): Promise<Coin | undefined> {
  return (await getMarkets()).find((c) => c.id === id);
}

export type GlobalData = {
  total_market_cap_usd: number;
  total_volume_usd: number;
  btc_dominance: number;
  eth_dominance: number;
  market_cap_change_24h: number;
};

export async function getGlobal(): Promise<GlobalData | null> {
  if (MOCK) return mock.global();
  type Raw = {
    data: {
      total_market_cap: Record<string, number>;
      total_volume: Record<string, number>;
      market_cap_percentage: Record<string, number>;
      market_cap_change_percentage_24h_usd: number;
    };
  };
  const raw = await getJson<Raw>(`${CG}/global`, REVALIDATE.global, cgHeaders());
  if (!raw?.data?.total_market_cap) return globalFromMarkets(await getMarkets());
  return {
    total_market_cap_usd: raw.data.total_market_cap.usd,
    total_volume_usd: raw.data.total_volume.usd,
    btc_dominance: raw.data.market_cap_percentage.btc,
    eth_dominance: raw.data.market_cap_percentage.eth,
    market_cap_change_24h: raw.data.market_cap_change_percentage_24h_usd,
  };
}

/** Respaldo si falla /global: se estima con la suma del top 250 (cubre más del 95% del mercado). */
function globalFromMarkets(coins: Coin[]): GlobalData | null {
  if (!coins.length) return null;
  const total = coins.reduce((a, c) => a + (c.market_cap || 0), 0);
  const volume = coins.reduce((a, c) => a + (c.total_volume || 0), 0);
  const cap = (id: string) => coins.find((c) => c.id === id)?.market_cap ?? 0;
  const prev = coins.reduce((a, c) => a + (c.market_cap || 0) / (1 + (c.price_change_percentage_24h ?? 0) / 100), 0);
  return {
    total_market_cap_usd: total,
    total_volume_usd: volume,
    btc_dominance: (cap("bitcoin") / total) * 100,
    eth_dominance: (cap("ethereum") / total) * 100,
    market_cap_change_24h: prev ? ((total - prev) / prev) * 100 : 0,
  };
}

/** Serie de precios en USD: [timestamp ms, precio]. */
export async function getChart(id: string, days: number): Promise<[number, number][]> {
  if (MOCK) return mock.chart(id, days);
  type Raw = { prices: [number, number][] };
  const raw = await getJson<Raw>(
    `${CG}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`,
    REVALIDATE.chart,
    cgHeaders(),
  );
  return raw?.prices ?? [];
}

/** Tipos de cambio oficiales: unidades de moneda local por 1 USD. */
export async function getOfficialFx(): Promise<Record<string, number>> {
  if (MOCK) return mock.fx();
  type Raw = { result: string; rates: Record<string, number> };
  const raw = await getJson<Raw>("https://open.er-api.com/v6/latest/USD", REVALIDATE.fx);
  if (!raw || raw.result !== "success") return {};
  return Object.fromEntries(Object.entries(raw.rates).map(([k, v]) => [k.toLowerCase(), v]));
}

export type UsdtQuote = {
  fiat: string;
  buy: number; // lo que pagás por 1 USDT (precio de compra para el usuario)
  sell: number; // lo que te dan por 1 USDT
  mid: number;
  exchanges: { name: string; buy: number; sell: number }[];
  updatedAt: number;
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Precio de USDT en moneda local según exchanges y P2P (CriptoYa). Mediana para evitar valores atípicos. */
export async function getUsdtQuote(fiat: string): Promise<UsdtQuote | null> {
  if (MOCK) return mock.usdt(fiat);
  type Raw = Record<string, { totalAsk?: number; totalBid?: number; ask?: number; bid?: number; time?: number }>;
  const raw = await getJson<Raw>(`https://criptoya.com/api/usdt/${fiat}/1`, REVALIDATE.usdt);
  if (!raw) return null;
  const exchanges = Object.entries(raw)
    .map(([name, q]) => ({ name, buy: q.totalAsk ?? q.ask ?? 0, sell: q.totalBid ?? q.bid ?? 0, time: q.time ?? 0 }))
    .filter((e) => e.buy > 0 && e.sell > 0);
  if (exchanges.length === 0) return null;
  const buy = median(exchanges.map((e) => e.buy));
  const sell = median(exchanges.map((e) => e.sell));
  return {
    fiat,
    buy,
    sell,
    mid: (buy + sell) / 2,
    exchanges: exchanges.map(({ name, buy, sell }) => ({ name, buy, sell })).sort((a, b) => a.buy - b.buy),
    updatedAt: Math.max(...exchanges.map((e) => e.time)) * 1000 || Date.now(),
  };
}

export type ArDollar = { casa: string; nombre: string; compra: number | null; venta: number | null; fechaActualizacion: string };

/** Cotizaciones del dólar en Argentina (oficial, blue, MEP, CCL, cripto, tarjeta) vía DolarApi. */
export async function getArDollars(): Promise<ArDollar[]> {
  if (MOCK) return mock.arDollars();
  return (await getJson<ArDollar[]>("https://dolarapi.com/v1/dolares", REVALIDATE.usdt)) ?? [];
}

export type FearGreed = { value: number; label: string; timestamp: number };

export async function getFearGreed(limit = 30): Promise<FearGreed[]> {
  if (MOCK) return mock.fng(limit);
  type Raw = { data: { value: string; value_classification: string; timestamp: string }[] };
  const raw = await getJson<Raw>(`https://api.alternative.me/fng/?limit=${limit}`, REVALIDATE.fng);
  return (raw?.data ?? []).map((d) => ({
    value: Number(d.value),
    label: d.value_classification,
    timestamp: Number(d.timestamp) * 1000,
  }));
}

/**
 * Unidades de moneda local por 1 USD que usa el sitio para convertir.
 * En países con brecha cambiaria (cryptoRate) se usa el precio del USDT, que es el que la gente paga de verdad.
 */
export async function getConversionRate(fiat: string, cryptoRate: boolean): Promise<{ rate: number; source: "usdt" | "oficial" } | null> {
  if (fiat === "usd") return { rate: 1, source: "oficial" };
  if (cryptoRate) {
    const q = await getUsdtQuote(fiat);
    if (q) return { rate: q.mid, source: "usdt" };
  }
  const fx = await getOfficialFx();
  return fx[fiat] ? { rate: fx[fiat], source: "oficial" } : null;
}
