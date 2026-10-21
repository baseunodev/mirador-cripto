import { getPosts } from "@/lib/content";
import { site } from "@/lib/site";

// Sitemap de Google News: solo notas de las últimas 48 horas.
export const revalidate = 600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const cutoff = Date.now() - 48 * 36e5;
  const items = getPosts("noticias")
    .filter((p) => new Date(p.date).getTime() >= cutoff)
    .map(
      (p) => `<url><loc>${site.url}/noticias/${p.slug}</loc><news:news><news:publication><news:name>${esc(site.name)}</news:name><news:language>es</news:language></news:publication><news:publication_date>${new Date(p.date).toISOString()}</news:publication_date><news:title>${esc(p.title)}</news:title></news:news></url>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${items}</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
