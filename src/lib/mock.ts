// Datos FALSOS solo para desarrollo sin internet (MOCK_DATA=1). Nunca se usan en producción.
import type { ArDollar, Coin, FearGreed, GlobalData, UsdtQuote } from "./data";

const base: [string, string, string, number, number][] = [
  ["bitcoin", "btc", "Bitcoin", 67000, 1.32e12],
  ["ethereum", "eth", "Ethereum", 3400, 4.1e11],
  ["tether", "usdt", "Tether", 1, 1.2e11],
  ["ripple", "xrp", "XRP", 0.6, 3.4e10],
  ["binancecoin", "bnb", "BNB", 580, 8.5e10],
  ["solana", "sol", "Solana", 150, 7e10],
  ["usd-coin", "usdc", "USDC", 1, 3.5e10],
  ["dogecoin", "doge", "Dogecoin", 0.15, 2.2e10],
  ["tron", "trx", "TRON", 0.16, 1.4e10],
  ["cardano", "ada", "Cardano", 0.45, 1.6e10],
  ["avalanche-2", "avax", "Avalanche", 28, 1.1e10],
  ["chainlink", "link", "Chainlink", 14, 8.5e9],
  ["the-open-network", "ton", "Toncoin", 5.5, 1.4e10],
  ["stellar", "xlm", "Stellar", 0.11, 3.2e9],
  ["litecoin", "ltc", "Litecoin", 72, 5.4e9],
];

const wave = (seed: number, i: number) => Math.sin(seed * 1.7 + i / 6) * 0.04 + Math.cos(seed + i / 11) * 0.03;

export function markets(): Coin[] {
  return base.map(([id, symbol, name, price, cap], i) => {
    const ch = Math.sin(i * 2.3) * 6;
    return {
      id,
      symbol,
      name,
      image: "",
      current_price: price,
      market_cap: cap,
      market_cap_rank: i + 1,
      total_volume: cap * 0.04,
      high_24h: price * 1.02,
      low_24h: price * 0.97,
      price_change_percentage_24h: price === 1 ? 0.01 : ch,
      price_change_percentage_7d_in_currency: price === 1 ? 0.02 : ch * 1.6,
      circulating_supply: cap / price,
      total_supply: cap / price,
      max_supply: id === "bitcoin" ? 21e6 : null,
      ath: price * 1.25,
      ath_change_percentage: -20,
      ath_date: "2025-01-20T00:00:00.000Z",
      last_updated: new Date().toISOString(),
      sparkline_in_7d: { price: Array.from({ length: 168 }, (_, k) => price * (1 + (price === 1 ? 0 : wave(i, k)))) },
    };
  });
}

export const global = (): GlobalData => ({
  total_market_cap_usd: 2.4e12,
  total_volume_usd: 9e10,
  btc_dominance: 55.1,
  eth_dominance: 17.2,
  market_cap_change_24h: -1.8,
});

export function chart(id: string, days: number): [number, number][] {
  const coin = base.find((b) => b[0] === id);
  const price = coin?.[3] ?? 1;
  const n = Math.min(days * 24, 720);
  const now = Date.now();
  return Array.from({ length: n }, (_, k) => [now - (n - k) * ((days * 864e5) / n), price * (1 + wave(price, k))]);
}

export const fx = (): Record<string, number> => ({ usd: 1, eur: 0.92, ars: 1000, mxn: 18.5, cop: 4100, clp: 940, pen: 3.75, ves: 45, bob: 6.96 });

const usdtMid: Record<string, number> = { ars: 1180, ves: 62, cop: 4150, mxn: 18.7, pen: 3.78, clp: 950 };

export function usdt(fiat: string): UsdtQuote | null {
  const mid = usdtMid[fiat];
  if (!mid) return null;
  return {
    fiat,
    buy: mid * 1.01,
    sell: mid * 0.99,
    mid,
    exchanges: ["binancep2p", "lemoncash", "buenbit", "ripio"].map((name, i) => ({ name, buy: mid * (1.005 + i * 0.004), sell: mid * (0.995 - i * 0.003) })),
    updatedAt: Date.now(),
  };
}

export const arDollars = (): ArDollar[] =>
  [
    ["oficial", "Oficial", 970, 1010],
    ["blue", "Blue", 1160, 1180],
    ["bolsa", "Bolsa", 1165, 1172],
    ["contadoconliqui", "Contado con liquidación", 1175, 1182],
    ["cripto", "Cripto", 1170, 1190],
    ["tarjeta", "Tarjeta", null, 1313],
  ].map(([casa, nombre, compra, venta]) => ({
    casa: casa as string,
    nombre: nombre as string,
    compra: compra as number | null,
    venta: venta as number,
    fechaActualizacion: new Date().toISOString(),
  }));

export const fng = (limit: number): FearGreed[] =>
  Array.from({ length: limit }, (_, k) => {
    const value = Math.round(50 + Math.sin(k / 4) * 25);
    return { value, label: value < 45 ? "Fear" : value > 55 ? "Greed" : "Neutral", timestamp: Date.now() - k * 864e5 };
  });
