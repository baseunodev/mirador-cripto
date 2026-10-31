import { describe, expect, it } from "vitest";
import { compact, fngLabel, pct, price } from "@/lib/format";

describe("price", () => {
  it("ajusta decimales según la magnitud", () => {
    expect(price(67450)).toBe("US$ 67.450");
    expect(price(3.4)).toBe("US$ 3,40");
    expect(price(0.15)).toBe("US$ 0,1500");
    expect(price(0.000012)).toBe("US$ 0,00001200");
  });
  it("muestra guion si no hay dato", () => {
    expect(price(null)).toBe("—");
    expect(price(NaN)).toBe("—");
  });
});

describe("compact", () => {
  it("usa escala corta en español", () => {
    expect(compact(2.4e12)).toBe("US$ 2,4 billones");
    expect(compact(9e10)).toBe("US$ 90 mil M");
    expect(compact(5.2e6)).toBe("US$ 5,2 M");
  });
});

describe("pct", () => {
  it("pone signo y usa coma decimal", () => {
    expect(pct(5.25)).toBe("+5,3%");
    expect(pct(-1.8)).toBe("−1,8%");
    expect(pct(0)).toBe("0,0%");
    expect(pct(undefined)).toBe("—");
  });
});

it("traduce las etiquetas del índice", () => {
  expect(fngLabel("Extreme Fear")).toBe("Miedo extremo");
  expect(fngLabel("Algo nuevo")).toBe("Algo nuevo");
});
