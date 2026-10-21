import { getPosts } from "@/lib/content";
import { site } from "@/lib/site";

// RSS completo: lo usan Google Discover (botón Seguir), agregadores y el bot de Telegram.
export const revalidate = 600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const posts = [...getPosts("noticias"), ...getPosts("aprende")].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);
  const items = posts
    .map((p) => {
      const url = `${site.url}/${p.section}/${p.slug}`;
      return `<item><title>${esc(p.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${esc(p.description)}</description><content:encoded><![CDATA[${p.html}]]></content:encoded></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(site.name)}</title><link>${site.url}</link><description>${esc(site.description)}</description><language>es</language><atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
