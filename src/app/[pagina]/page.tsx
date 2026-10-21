import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { Breadcrumbs, Card } from "@/components/ui";
import { site } from "@/lib/site";

// Páginas institucionales en /content/paginas/*.md (sobre nosotros, política editorial, privacidad, etc.)
export const dynamicParams = false;
const dir = path.join(process.cwd(), "content", "paginas");

export function generateStaticParams() {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => ({ pagina: f.replace(/\.md$/, "") }));
}

function load(slug: string) {
  const file = path.join(dir, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8").replaceAll("{{site}}", site.name).replaceAll("{{email}}", site.contactEmail);
  const [first, ...rest] = raw.split("\n");
  return { title: first.replace(/^#\s*/, ""), html: marked.parse(rest.join("\n"), { async: false }) as string };
}

type Props = { params: Promise<{ pagina: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pagina } = await params;
  const p = load(pagina);
  return p ? { title: p.title, alternates: { canonical: `/${pagina}` } } : {};
}

export default async function InstitutionalPage({ params }: Props) {
  const { pagina } = await params;
  const p = load(pagina);
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs items={[{ name: p.title, href: `/${pagina}` }]} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{p.title}</h1>
      <Card className="mt-5">
        <div className="prose-mc" dangerouslySetInnerHTML={{ __html: p.html }} />
      </Card>
    </div>
  );
}
