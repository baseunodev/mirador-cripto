// Polymarket: elegir mercados cripto vigentes y pasar las preguntas al español.
export type PredictionMarket = { question: string; yes: number; volume: number; endDate: string; url: string };

type RawMarket = { question?: string; slug?: string; outcomes?: string; outcomePrices?: string; volume?: string | number; volumeNum?: number; endDate?: string; closed?: boolean; active?: boolean; archived?: boolean };
export type RawEvent = { slug?: string; closed?: boolean; markets?: RawMarket[] };

const MONTHS: Record<string, string> = {
  january: "enero", february: "febrero", march: "marzo", april: "abril", may: "mayo", june: "junio",
  july: "julio", august: "agosto", september: "septiembre", october: "octubre", november: "noviembre", december: "diciembre",
};

const money = (s: string) => {
  const k = /k$/i.test(s);
  const n = Number(s.replace(/[$,k]/gi, "")) * (k ? 1000 : 1);
  return Number.isFinite(n) ? `US$ ${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })}` : s;
};

/** "December 31, 2026" → "31 de diciembre de 2026"; "2026" → "2026". */
function fecha(s: string) {
  const m = s.match(/^([A-Za-z]+) (\d{1,2})(?:, (\d{4}))?$/);
  if (m && MONTHS[m[1].toLowerCase()]) return `${m[2]} de ${MONTHS[m[1].toLowerCase()]}${m[3] ? ` de ${m[3]}` : ""}`;
  const y = s.match(/^([A-Za-z]+)(?: (\d{4}))?$/);
  if (y && MONTHS[y[1].toLowerCase()]) return `${MONTHS[y[1].toLowerCase()]}${y[2] ? ` de ${y[2]}` : ""}`;
  return s;
}

/** Traduce los formatos más comunes de pregunta. Devuelve null si no lo reconoce. */
export function questionEs(q: string): string | null {
  const t = q.trim();
  let m = t.match(/^Will (.+?) (reach|hit|dip to|fall to|drop to) (\$[\d,.]+k?) (by|before|in|on) (.+?)\?$/i);
  if (m) {
    const verb = /reach|hit/i.test(m[2]) ? "llega a" : "baja a";
    const when = m[4].toLowerCase() === "on" ? `el ${fecha(m[5])}` : m[4].toLowerCase() === "in" ? `en ${fecha(m[5])}` : `antes del ${fecha(m[5])}`;
    return `¿${m[1]} ${verb} ${money(m[3])} ${when}?`;
  }
  m = t.match(/^Will (?:the price of )?(.+?) be (above|below|over|under) (\$[\d,.]+k?) on (.+?)\?$/i);
  if (m) return `¿${m[1]} cotiza ${/above|over/i.test(m[2]) ? "arriba" : "debajo"} de ${money(m[3])} el ${fecha(m[4])}?`;
  m = t.match(/^Will (.+?) (?:reach|hit) (?:a )?new all[- ]time high (by|before|in) (.+?)\?$/i);
  if (m) return `¿${m[1]} marca un nuevo máximo histórico ${m[2].toLowerCase() === "in" ? "en" : "antes del"} ${fecha(m[3])}?`;
  return null;
}

const CRYPTO = /\b(bitcoin|btc|ethereum|eth|solana|sol|xrp)\b/i;

/** De la lista de eventos cripto, los mercados vigentes y con dudas reales (ni 1% ni 99%), máx. 2 por evento. */
export function pickMarkets(events: RawEvent[], limit = 6): PredictionMarket[] {
  const out: (PredictionMarket & { es: boolean })[] = [];
  for (const ev of events) {
    if (ev.closed) continue;
    const picked = (ev.markets ?? [])
      .flatMap((m) => {
        if (!m.question || m.closed || m.archived || m.active === false || !CRYPTO.test(m.question) || /up or down/i.test(m.question)) return [];
        try {
          const outcomes = JSON.parse(m.outcomes ?? "[]") as string[];
          const prices = (JSON.parse(m.outcomePrices ?? "[]") as string[]).map(Number);
          const i = outcomes.findIndex((o) => /^yes$/i.test(o));
          const yes = prices[i];
          if (i < 0 || !(yes > 0.03 && yes < 0.97)) return [];
          const es = questionEs(m.question);
          return [{ question: es ?? m.question, es: es != null, yes, volume: Number(m.volumeNum ?? m.volume ?? 0), endDate: m.endDate ?? "", url: `https://polymarket.com/event/${ev.slug ?? m.slug}` }];
        } catch {
          return [];
        }
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 2);
    out.push(...picked);
  }
  // Primero las que pudimos pasar al español, después por volumen apostado.
  return out
    .sort((a, b) => Number(b.es) - Number(a.es) || b.volume - a.volume)
    .slice(0, limit)
    .map((m) => ({ question: m.question, yes: m.yes, volume: m.volume, endDate: m.endDate, url: m.url }));
}
