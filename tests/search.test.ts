import { describe, expect, it } from "vitest";
import { searchItems, type SearchItem } from "@/lib/search";

const items: SearchItem[] = [
  { kind: "coin", href: "/precio/bitcoin", title: "Bitcoin", symbol: "btc", rank: 1 },
  { kind: "coin", href: "/precio/bitcoin-cash", title: "Bitcoin Cash", symbol: "bch", rank: 20 },
  { kind: "coin", href: "/precio/solana", title: "Solana", symbol: "sol", rank: 5 },
  { kind: "page", href: "/dolar-cripto/mexico", title: "Dólar cripto en México", keywords: "usdt mexicanos" },
];

describe("searchItems", () => {
  it("prioriza el símbolo exacto", () => {
    expect(searchItems(items, "sol")[0].href).toBe("/precio/solana");
  });
  it("desempata por ranking", () => {
    expect(searchItems(items, "bitc").map((i) => i.href)).toEqual(["/precio/bitcoin", "/precio/bitcoin-cash"]);
  });
  it("ignora tildes y mayúsculas", () => {
    expect(searchItems(items, "DOLAR")[0].href).toBe("/dolar-cripto/mexico");
    expect(searchItems(items, "mexico")[0].href).toBe("/dolar-cripto/mexico");
  });
  it("busca en palabras clave", () => {
    expect(searchItems(items, "usdt")[0].href).toBe("/dolar-cripto/mexico");
  });
  it("sin texto muestra monedas", () => {
    expect(searchItems(items, "").every((i) => i.kind === "coin")).toBe(true);
  });
});
