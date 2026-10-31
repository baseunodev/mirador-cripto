// Cálculos de proyección y simulación. Puros y testeables: sin red ni React.
// Nada de esto es un pronóstico: son escenarios armados con la historia del precio.

export type Point = [number, number]; // [timestamp ms, precio]

/** Retornos logarítmicos diarios a partir de una serie (se toma el último precio de cada día). */
export function dailyLogReturns(series: Point[]): number[] {
  const byDay = new Map<number, number>();
  for (const [t, p] of series) if (p > 0) byDay.set(Math.floor(t / 864e5), p);
  const prices = [...byDay.entries()].sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) out.push(Math.log(prices[i] / prices[i - 1]));
  return out;
}

export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

/** Volatilidad diaria (desvío de los retornos logarítmicos). */
export const dailyVol = (series: Point[]) => stdev(dailyLogReturns(series));

export type Band = { day: number; p05: number; p16: number; p50: number; p84: number; p95: number };

/**
 * Abanico de escenarios suponiendo que la volatilidad sigue como en el período medido y SIN tendencia
 * (mediana = precio de hoy). p16–p84 ≈ 2 de cada 3 casos; p05–p95 ≈ 9 de cada 10.
 */
export function projectionBands(price: number, vol: number, days: number, steps = 30): Band[] {
  const z1 = 1, z2 = 1.645;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const d = (days * i) / steps;
    const s = vol * Math.sqrt(d);
    return { day: d, p05: price * Math.exp(-z2 * s), p16: price * Math.exp(-z1 * s), p50: price, p84: price * Math.exp(z1 * s), p95: price * Math.exp(z2 * s) };
  });
}

/** Porcentaje real de ventanas de N días en las que el precio terminó dentro de [lo, hi] relativo al inicio. */
export function historicalHitRate(series: Point[], days: number, loPct: number, hiPct: number): number | null {
  const byDay = new Map<number, number>();
  for (const [t, p] of series) if (p > 0) byDay.set(Math.floor(t / 864e5), p);
  const prices = [...byDay.entries()].sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  let n = 0, hit = 0;
  for (let i = 0; i + days < prices.length; i++) {
    const ch = prices[i + days] / prices[i] - 1;
    n++;
    if (ch >= loPct && ch <= hiPct) hit++;
  }
  return n ? hit / n : null;
}

export type DcaResult = { invested: number; units: number; value: number; pnl: number; pnlPct: number; buys: number; curve: Point[] };

/** Compra periódica: invierte `amount` cada `everyDays` desde el primer punto de la serie hasta hoy. */
export function simulateDca(series: Point[], amount: number, everyDays = 30, currentPrice?: number): DcaResult {
  const pts = series.filter((p) => p[1] > 0);
  if (pts.length < 2 || amount <= 0) return { invested: 0, units: 0, value: 0, pnl: 0, pnlPct: 0, buys: 0, curve: [] };
  const start = pts[0][0];
  const end = pts[pts.length - 1][0];
  let next = start;
  let units = 0;
  let invested = 0;
  let buys = 0;
  const curve: Point[] = [];
  for (const [t, p] of pts) {
    while (t >= next && next <= end) {
      units += amount / p;
      invested += amount;
      buys++;
      next += everyDays * 864e5;
    }
    curve.push([t, units * p]);
  }
  const value = units * (currentPrice ?? pts[pts.length - 1][1]);
  return { invested, units, value, pnl: value - invested, pnlPct: invested ? (value / invested - 1) * 100 : 0, buys, curve };
}

/** Brecha porcentual entre dos cotizaciones (ej. dólar cripto vs. blue). */
export const gapPct = (a: number, b: number) => (b ? (a / b - 1) * 100 : 0);
