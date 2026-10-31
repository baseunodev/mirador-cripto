// Lector mínimo de RSS (sin dependencias). Puro y sin red: se puede testear.
export type Headline = { title: string; url: string; date: string; section: string };

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

const tag = (item: string, name: string) => decode(item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? "");

const sectionNames: Record<string, string> = {
  mercado: "Mercado",
  regulacion: "Regulación",
  latam: "América Latina",
  seguridad: "Seguridad",
  guias: "Guías",
};

/** Saca título, link, fecha y sección (primer tramo de la URL) de cada <item>. */
export function parseRss(xml: string, limit = 20): Headline[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items.slice(0, limit).flatMap((it) => {
    const title = tag(it, "title");
    const url = tag(it, "link");
    if (!title || !/^https?:\/\//.test(url)) return [];
    const pub = new Date(tag(it, "pubDate"));
    let slug = "";
    try {
      slug = new URL(url).pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {}
    return [{ title, url, date: isNaN(pub.getTime()) ? "" : pub.toISOString(), section: sectionNames[slug] ?? "Noticias" }];
  });
}

/** Titulares que mencionan una moneda por nombre o símbolo (palabra completa). */
export function headlinesFor(list: Headline[], name: string, symbol: string): Headline[] {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${esc(name)}|${esc(symbol)})(?=$|[^\\p{L}\\p{N}])`, "iu");
  return list.filter((h) => re.test(h.title));
}
