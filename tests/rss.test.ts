import { describe, expect, it } from "vitest";
import { headlinesFor, parseRss } from "@/lib/rss";

const xml = `<?xml version="1.0"?><rss><channel>
<item><title>Bitcoin sube 5% &amp; arrastra al mercado</title><link>https://elbloque.news/mercado/btc-sube</link><pubDate>Sat, 31 Oct 2026 12:00:00 GMT</pubDate></item>
<item><title><![CDATA[Nueva estafa con "soportes" falsos]]></title><link>https://elbloque.news/seguridad/estafa</link><pubDate>mal</pubDate></item>
<item><title>Sin link válido</title><link>javascript:alert(1)</link></item>
<item><title>Solana y SOLAR no son lo mismo</title><link>https://elbloque.news/guias/sol</link></item>
</channel></rss>`;

describe("parseRss", () => {
  const items = parseRss(xml);
  it("lee título, link, fecha y sección", () => {
    expect(items[0]).toEqual({ title: "Bitcoin sube 5% & arrastra al mercado", url: "https://elbloque.news/mercado/btc-sube", date: "2026-10-31T12:00:00.000Z", section: "Mercado" });
  });
  it("soporta CDATA y fechas inválidas", () => {
    expect(items[1].title).toBe('Nueva estafa con "soportes" falsos');
    expect(items[1].date).toBe("");
    expect(items[1].section).toBe("Seguridad");
  });
  it("descarta links que no son http", () => {
    expect(items.map((i) => i.title)).not.toContain("Sin link válido");
  });
  it("respeta el límite", () => {
    expect(parseRss(xml, 1)).toHaveLength(1);
  });
  it("devuelve vacío si el XML está roto", () => {
    expect(parseRss("<html>error</html>")).toEqual([]);
  });
});

describe("headlinesFor", () => {
  const items = parseRss(xml);
  it("encuentra por nombre o símbolo como palabra completa", () => {
    expect(headlinesFor(items, "Bitcoin", "btc").map((i) => i.url)).toEqual(["https://elbloque.news/mercado/btc-sube"]);
    expect(headlinesFor(items, "Solana", "sol")).toHaveLength(1);
    expect(headlinesFor(items, "Ethereum", "eth")).toHaveLength(0);
  });
});
