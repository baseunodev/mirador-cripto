import { describe, expect, it } from "vitest";
import { coinIdForSlug, converterPairs, pairSlug, parsePairSlug, slugForCoin } from "@/lib/catalog";

describe("catálogo", () => {
  it("cada par de conversor se puede leer de vuelta desde su URL", () => {
    for (const p of converterPairs) {
      const parsed = parsePairSlug(pairSlug(p.id, p.fiat));
      expect(parsed?.id).toBe(p.id);
      expect(parsed?.fiat.code).toBe(p.fiat.code);
    }
  });
  it("los slugs de monedas son reversibles", () => {
    for (const id of ["bitcoin", "tether", "ripple", "binancecoin"]) expect(coinIdForSlug(slugForCoin(id))).toBe(id);
  });
  it("rechaza pares inventados", () => {
    expect(parsePairSlug("bitcoin-a-rupias")).toBeNull();
    expect(parsePairSlug("cualquiera")).toBeNull();
  });
});
