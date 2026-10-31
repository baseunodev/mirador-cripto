import { describe, expect, it } from "vitest";
import { dailyVol, gapPct, historicalHitRate, projectionBands, simulateDca, type Point } from "@/lib/stats";

const DAY = 864e5;
const series = (prices: number[]): Point[] => prices.map((p, i) => [i * DAY, p]);

describe("dailyVol", () => {
  it("es cero si el precio no se mueve", () => {
    expect(dailyVol(series([100, 100, 100, 100]))).toBe(0);
  });
  it("crece con movimientos más grandes", () => {
    const calm = series([100, 101, 100, 101, 100, 101]);
    const wild = series([100, 110, 100, 110, 100, 110]);
    expect(dailyVol(wild)).toBeGreaterThan(dailyVol(calm));
  });
});

describe("projectionBands", () => {
  it("arranca en el precio actual y se abre con el tiempo", () => {
    const b = projectionBands(100, 0.03, 30, 10);
    expect(b[0].p05).toBeCloseTo(100);
    expect(b[0].p95).toBeCloseTo(100);
    const last = b[b.length - 1];
    expect(last.day).toBe(30);
    expect(last.p05).toBeLessThan(last.p16);
    expect(last.p16).toBeLessThan(last.p50);
    expect(last.p50).toBeLessThan(last.p84);
    expect(last.p84).toBeLessThan(last.p95);
  });
});

describe("historicalHitRate", () => {
  it("cuenta las ventanas que quedaron dentro del rango", () => {
    const s = series(Array.from({ length: 40 }, () => 100));
    expect(historicalHitRate(s, 7, -0.1, 0.1)).toBe(1);
  });
  it("devuelve null si no hay historia suficiente", () => {
    expect(historicalHitRate(series([1, 2, 3]), 30, -0.1, 0.1)).toBeNull();
  });
});

describe("simulateDca", () => {
  it("con precio fijo no gana ni pierde", () => {
    const r = simulateDca(series(Array.from({ length: 91 }, () => 50)), 100, 30);
    expect(r.buys).toBeGreaterThan(0);
    expect(r.invested).toBe(r.buys * 100);
    expect(r.pnl).toBeCloseTo(0);
  });
  it("si el precio sube, gana", () => {
    const r = simulateDca(series(Array.from({ length: 91 }, (_, i) => 50 + i)), 100, 30);
    expect(r.pnl).toBeGreaterThan(0);
  });
});

it("gapPct", () => {
  expect(gapPct(110, 100)).toBeCloseTo(10);
  expect(gapPct(1, 0)).toBe(0);
});
