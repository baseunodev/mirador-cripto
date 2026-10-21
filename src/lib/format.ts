import { site } from "./site";

const nf = (opts: Intl.NumberFormatOptions) => new Intl.NumberFormat(site.numberLocale, opts);

/** Precio con decimales según magnitud: 67.450 / 3,42 / 0,000012. */
export function price(n: number | null | undefined, prefix = "US$ "): string {
  if (n == null || !isFinite(n)) return "—";
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 0 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8;
  return prefix + nf({ minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

export const number = (n: number | null | undefined, digits = 2) =>
  n == null || !isFinite(n) ? "—" : nf({ maximumFractionDigits: digits }).format(n);

/** 1,32 billones / 410.000 M. Escala corta en español: M = millones, B = billones (10^12). */
export function compact(n: number | null | undefined, prefix = "US$ "): string {
  if (n == null || !isFinite(n)) return "—";
  if (Math.abs(n) >= 1e12) return `${prefix}${nf({ maximumFractionDigits: 2 }).format(n / 1e12)} billones`;
  if (Math.abs(n) >= 1e9) return `${prefix}${nf({ maximumFractionDigits: 1 }).format(n / 1e9)} mil M`;
  if (Math.abs(n) >= 1e6) return `${prefix}${nf({ maximumFractionDigits: 1 }).format(n / 1e6)} M`;
  return prefix + nf({ maximumFractionDigits: 0 }).format(n);
}

export function pct(n: number | null | undefined, digits = 1): string {
  if (n == null || !isFinite(n)) return "—";
  const s = nf({ minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(n));
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${s}%`;
}

export const trendClass = (n: number | null | undefined) =>
  n == null ? "text-muted" : n > 0 ? "text-up" : n < 0 ? "text-down" : "text-muted";

export function dateTime(d: number | string | Date): string {
  return new Intl.DateTimeFormat(site.numberLocale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(d));
}

export function date(d: number | string | Date): string {
  return new Intl.DateTimeFormat(site.numberLocale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(d));
}

const fngLabels: Record<string, string> = {
  "Extreme Fear": "Miedo extremo",
  Fear: "Miedo",
  Neutral: "Neutral",
  Greed: "Codicia",
  "Extreme Greed": "Codicia extrema",
};
export const fngLabel = (label: string) => fngLabels[label] ?? label;

export const exchangeName = (key: string) =>
  ({ binancep2p: "Binance P2P", lemoncash: "Lemon", buenbit: "Buenbit", ripio: "Ripio", belo: "Belo", fiwind: "Fiwind", letsbit: "Let'sBit", satoshitango: "SatoshiTango", cocoscrypto: "Cocos Crypto", bitsoalpha: "Bitso", bitso: "Bitso", okexp2p: "OKX P2P", bybitp2p: "Bybit P2P", kucoinp2p: "KuCoin P2P", bingxp2p: "BingX P2P", eldoradop2p: "El Dorado P2P" })[
    key
  ] ?? key.charAt(0).toUpperCase() + key.slice(1);
