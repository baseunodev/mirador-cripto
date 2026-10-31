import { describe, expect, it } from "vitest";
import { pickMarkets, questionEs } from "@/lib/polymarket";

describe("questionEs", () => {
  it("traduce precio objetivo con fecha", () => {
    expect(questionEs("Will Bitcoin reach $150,000 by December 31, 2026?")).toBe("¿Bitcoin llega a US$ 150.000 antes del 31 de diciembre de 2026?");
    expect(questionEs("Will Bitcoin dip to $60,000 in 2026?")).toBe("¿Bitcoin baja a US$ 60.000 en 2026?");
    expect(questionEs("Will Ethereum hit $5k by June 30?")).toBe("¿Ethereum llega a US$ 5.000 antes del 30 de junio?");
  });
  it("traduce arriba/debajo en una fecha", () => {
    expect(questionEs("Will the price of Bitcoin be above $100,000 on November 7?")).toBe("¿Bitcoin cotiza arriba de US$ 100.000 el 7 de noviembre?");
  });
  it("devuelve null si no reconoce el formato", () => {
    expect(questionEs("Which company has the best AI model?")).toBeNull();
  });
});

const ev = (slug: string, markets: object[]) => ({ slug, markets });
const mk = (question: string, yes: number, volumeNum = 1000, extra = {}) => ({ question, outcomes: '["Yes","No"]', outcomePrices: JSON.stringify([String(yes), String(1 - yes)]), volumeNum, ...extra });

describe("pickMarkets", () => {
  it("descarta cerrados, resueltos y los que no son cripto", () => {
    const out = pickMarkets([
      ev("btc-2026", [mk("Will Bitcoin reach $150,000 by December 31, 2026?", 0.3), mk("Will Bitcoin dip to $60,000 by December 31, 2026?", 1), mk("Will Bitcoin reach $200,000 by December 31, 2026?", 0.1, 5, { closed: true })]),
      ev("politica", [mk("Will the U.S. invade Iran before 2027?", 0.4)]),
      ev("btc-updown", [mk("Bitcoin Up or Down on Nov 1?", 0.5)]),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].question).toBe("¿Bitcoin llega a US$ 150.000 antes del 31 de diciembre de 2026?");
    expect(out[0].url).toBe("https://polymarket.com/event/btc-2026");
  });
  it("toma hasta 2 por evento, los de más volumen", () => {
    const out = pickMarkets([ev("e", [mk("Will Bitcoin reach $1 by May 1?", 0.5, 10), mk("Will Bitcoin reach $2 by May 1?", 0.5, 30), mk("Will Bitcoin reach $3 by May 1?", 0.5, 20)])]);
    expect(out.map((m) => m.volume)).toEqual([30, 20]);
  });
});
