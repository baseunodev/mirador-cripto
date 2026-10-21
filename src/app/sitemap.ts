import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { getMarkets } from "@/lib/data";
import { getPosts } from "@/lib/content";
import { converterPairs, countries, pairSlug, slugForCoin } from "@/lib/catalog";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const u = (p: string) => `${site.url}${p}`;
  const coins = (await getMarkets()).slice(0, 100);
  const pages = fs
    .readdirSync(path.join(process.cwd(), "content", "paginas"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
  return [
    { url: u("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: u("/indice-miedo-codicia"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: u("/noticias"), lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: u("/aprende"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...countries.map((c) => ({ url: u(`/dolar-cripto/${c.slug}`), lastModified: now, changeFrequency: "hourly" as const, priority: 0.9 })),
    ...coins.map((c) => ({ url: u(`/precio/${slugForCoin(c.id)}`), lastModified: now, changeFrequency: "hourly" as const, priority: 0.8 })),
    ...converterPairs.map((p) => ({ url: u(`/convertir/${pairSlug(p.id, p.fiat)}`), lastModified: now, changeFrequency: "hourly" as const, priority: 0.7 })),
    ...[...getPosts("noticias"), ...getPosts("aprende")].map((p) => ({ url: u(`/${p.section}/${p.slug}`), lastModified: new Date(p.updated ?? p.date), priority: 0.6 })),
    ...pages.map((p) => ({ url: u(`/${p}`), changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
