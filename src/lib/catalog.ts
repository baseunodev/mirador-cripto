// Catálogo estático: slugs amigables para SEO, monedas fiat y países.

// CoinGecko usa ids poco buscados ("ripple", "binancecoin"). Acá se mapean a lo que la gente busca.
const slugOverrides: Record<string, string> = {
  tether: "usdt",
  "usd-coin": "usdc",
  ripple: "xrp",
  binancecoin: "bnb",
  "avalanche-2": "avalanche",
  "the-open-network": "toncoin",
  "hedera-hashgraph": "hedera",
  "crypto-com-chain": "cronos",
  "injective-protocol": "injective",
  "render-token": "render",
  "worldcoin-wld": "worldcoin",
  "shiba-inu": "shiba-inu",
};
const idBySlug = Object.fromEntries(Object.entries(slugOverrides).map(([id, slug]) => [slug, id]));

export const slugForCoin = (id: string) => slugOverrides[id] ?? id;
export const coinIdForSlug = (slug: string) => idBySlug[slug] ?? slug;

export type Fiat = {
  code: string; // ISO en minúscula
  slug: string; // para URLs de conversores
  name: string; // "pesos argentinos"
  symbol: string;
  // true = se convierte al tipo de cambio cripto (USDT) porque es el que usa la gente en ese país
  cryptoRate: boolean;
};

export const fiats: Fiat[] = [
  { code: "usd", slug: "dolares", name: "dólares", symbol: "US$", cryptoRate: false },
  { code: "eur", slug: "euros", name: "euros", symbol: "€", cryptoRate: false },
  { code: "ars", slug: "pesos-argentinos", name: "pesos argentinos", symbol: "$", cryptoRate: true },
  { code: "mxn", slug: "pesos-mexicanos", name: "pesos mexicanos", symbol: "MX$", cryptoRate: true },
  { code: "cop", slug: "pesos-colombianos", name: "pesos colombianos", symbol: "COL$", cryptoRate: true },
  { code: "clp", slug: "pesos-chilenos", name: "pesos chilenos", symbol: "CLP$", cryptoRate: true },
  { code: "pen", slug: "soles", name: "soles peruanos", symbol: "S/", cryptoRate: true },
  { code: "ves", slug: "bolivares", name: "bolívares", symbol: "Bs.", cryptoRate: true },
];

export const fiatBySlug = (slug: string) => fiats.find((f) => f.slug === slug);
export const fiatByCode = (code: string) => fiats.find((f) => f.code === code);

// Monedas con conversor propio. Solo pares con demanda de búsqueda real (ver plan SEO).
export const converterCoins = ["bitcoin", "ethereum", "tether", "usd-coin", "solana", "ripple", "binancecoin", "dogecoin"];

export const converterPairs = converterCoins.flatMap((id) =>
  fiats.filter((f) => !(f.code === "usd" && (id === "tether" || id === "usd-coin"))).map((f) => ({ id, fiat: f })),
);

export const pairSlug = (id: string, fiat: Fiat) => `${slugForCoin(id)}-a-${fiat.slug}`;

export const parsePairSlug = (slug: string) => {
  const idx = slug.indexOf("-a-");
  if (idx < 0) return null;
  const id = coinIdForSlug(slug.slice(0, idx));
  const fiat = fiatBySlug(slug.slice(idx + 3));
  if (!fiat || !converterCoins.includes(id)) return null;
  return { id, fiat };
};

export type Country = {
  slug: string;
  name: string;
  fiat: string; // código ISO
  demonym: string;
  context: string;
};

export const countries: Country[] = [
  {
    slug: "argentina",
    name: "Argentina",
    fiat: "ars",
    demonym: "argentinos",
    context:
      "En Argentina el USDT se usa como alternativa al dólar billete para ahorrar y para cobrar del exterior. Su precio suele moverse cerca del dólar MEP y del blue.",
  },
  {
    slug: "venezuela",
    name: "Venezuela",
    fiat: "ves",
    demonym: "venezolanos",
    context:
      "En Venezuela el USDT funciona como referencia de precios en el día a día y como forma de recibir remesas. La diferencia con la tasa oficial del BCV suele ser grande.",
  },
  {
    slug: "colombia",
    name: "Colombia",
    fiat: "cop",
    demonym: "colombianos",
    context:
      "En Colombia el USDT lo usan sobre todo freelancers que cobran del exterior y quienes reciben remesas. Suele cotizar cerca de la TRM oficial.",
  },
  {
    slug: "mexico",
    name: "México",
    fiat: "mxn",
    demonym: "mexicanos",
    context:
      "En México el USDT se usa para remesas desde Estados Unidos y como forma de tener dólares digitales. Suele cotizar muy cerca del tipo de cambio oficial.",
  },
  {
    slug: "peru",
    name: "Perú",
    fiat: "pen",
    demonym: "peruanos",
    context:
      "En Perú el USDT se usa para pagos internacionales y ahorro en dólares digitales. Suele cotizar cerca del tipo de cambio oficial.",
  },
  {
    slug: "chile",
    name: "Chile",
    fiat: "clp",
    demonym: "chilenos",
    context:
      "En Chile el USDT se usa para pagos al exterior y como dólar digital. Suele cotizar cerca del dólar observado.",
  },
];

export const countryBySlug = (slug: string) => countries.find((c) => c.slug === slug);
