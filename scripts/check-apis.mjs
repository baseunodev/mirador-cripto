// Control diario: cada API que usa el sitio responde y trae los campos que leemos.
// Uso: node scripts/check-apis.mjs  (sale con error si alguna falla)
const key = process.env.COINGECKO_API_KEY;
const cg = key ? { "x-cg-demo-api-key": key } : {};
const diario = (process.env.NEXT_PUBLIC_DIARIO_URL || "https://el-bloque-theta.vercel.app").replace(/\/$/, "");

const checks = [
  ["CoinGecko mercados", "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=5&sparkline=true", (d) => Array.isArray(d) && d[0]?.current_price > 0 && d[0]?.sparkline_in_7d, cg],
  ["CoinGecko global", "https://api.coingecko.com/api/v3/global", (d) => d?.data?.total_market_cap?.usd > 0, cg],
  ["CriptoYa USDT/ARS", "https://criptoya.com/api/usdt/ars/1", (d) => Object.values(d).some((q) => (q.totalAsk ?? q.ask) > 0)],
  ["DolarApi", "https://dolarapi.com/v1/dolares", (d) => Array.isArray(d) && d.some((x) => x.casa === "blue")],
  ["ExchangeRate-API", "https://open.er-api.com/v6/latest/USD", (d) => d?.result === "success" && d.rates?.EUR > 0],
  ["Miedo y codicia", "https://api.alternative.me/fng/?limit=1", (d) => Number(d?.data?.[0]?.value) >= 0],
  ["Polymarket", "https://gamma-api.polymarket.com/events?tag_slug=crypto&active=true&closed=false&limit=5", (d) => Array.isArray(d) && d.some((e) => Array.isArray(e.markets) && e.markets.length)],
  ["ArgentinaDatos", "https://api.argentinadatos.com/v1/cotizaciones/dolares/cripto", (d) => Array.isArray(d) && d.at(-1)?.venta > 0],
  ["Feed de El Bloque", `${diario}/feed.xml`, (t) => typeof t === "string" && t.includes("<item>"), {}, "text"],
];

let failed = 0;
for (const [name, url, ok, headers = {}, type = "json"] of checks) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    const body = type === "json" ? await res.json() : await res.text();
    if (!res.ok || !ok(body)) throw new Error(`HTTP ${res.status} o formato inesperado`);
    console.log(`✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${name}: ${err.message}`);
  }
}
process.exit(failed ? 1 : 0);
