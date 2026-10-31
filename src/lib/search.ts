// Ranking del buscador. Puro (sin React) para poder testearlo.
export type SearchItem = {
  kind: "coin" | "page";
  href: string;
  title: string;
  subtitle?: string;
  symbol?: string;
  image?: string;
  rank?: number;
  keywords?: string;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/** Puntaje: símbolo exacto > empieza con > contiene; desempata por ranking de capitalización. */
export function searchItems(items: SearchItem[], query: string, limit = 8): SearchItem[] {
  const q = norm(query);
  if (!q) return items.filter((i) => i.kind === "coin").slice(0, limit);
  const scored = items.flatMap((it) => {
    const title = norm(it.title);
    const sym = norm(it.symbol ?? "");
    const kw = norm(it.keywords ?? "");
    let score = 0;
    if (sym && sym === q) score = 100;
    else if (title === q) score = 95;
    else if (title.startsWith(q)) score = 80;
    else if (sym.startsWith(q)) score = 70;
    else if (title.split(/[\s-]+/).some((w) => w.startsWith(q))) score = 60;
    else if (title.includes(q) || kw.includes(q)) score = 40;
    if (!score) return [];
    return [{ it, score: score - Math.min(it.rank ?? 50, 250) / 1000 }];
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.it);
}
