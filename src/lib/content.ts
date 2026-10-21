// Contenido editorial en Markdown dentro de /content. Para publicar: crear un .md con frontmatter y hacer push.
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

export type Section = "noticias" | "aprende";

export type Post = {
  section: Section;
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  updated?: string;
  author: string;
  coins: string[]; // ids de CoinGecko relacionados
  image?: string;
  html: string;
};

const root = path.join(process.cwd(), "content");

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { data, body: m[2] };
}

function load(section: Section, file: string): Post {
  const { data, body } = parseFrontmatter(fs.readFileSync(path.join(root, section, file), "utf8"));
  return {
    section,
    slug: file.replace(/\.md$/, ""),
    title: data.title ?? file,
    description: data.description ?? "",
    date: data.date ?? new Date(0).toISOString(),
    updated: data.updated,
    author: data.author ?? "redaccion",
    coins: data.coins ? data.coins.split(",").map((s) => s.trim()).filter(Boolean) : [],
    image: data.image,
    html: marked.parse(body, { async: false }) as string,
  };
}

export function getPosts(section: Section): Post[] {
  const dir = path.join(root, section);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => load(section, f))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const getPost = (section: Section, slug: string) => getPosts(section).find((p) => p.slug === slug);

export const postsForCoin = (id: string, limit = 5) =>
  [...getPosts("noticias"), ...getPosts("aprende")]
    .filter((p) => p.coins.includes(id))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);

export const authors: Record<string, { name: string; role: string; bio: string }> = {
  redaccion: {
    name: "Juan Pablo Centeno",
    role: "Editor",
    bio: "Fundador y editor de Mirador Cripto. Sigue el mercado cripto y su impacto en la economía de América Latina.",
  },
};
