import Link from "next/link";
import type { Post } from "@/lib/content";
import { authors } from "@/lib/content";
import { getCoin } from "@/lib/data";
import { slugForCoin } from "@/lib/catalog";
import { dateTime, price } from "@/lib/format";
import { site } from "@/lib/site";
import { AdSlot, Breadcrumbs, Card, Change, Disclaimer, JsonLd } from "./ui";

const sectionName = { noticias: "Noticias", aprende: "Aprendé" } as const;

export async function Article({ post }: { post: Post }) {
  const author = authors[post.author] ?? authors.redaccion;
  const coins = (await Promise.all(post.coins.slice(0, 3).map((id) => getCoin(id)))).filter(Boolean);
  const url = `${site.url}/${post.section}/${post.slug}`;
  // Se parte el HTML después del 2.º párrafo para meter el primer anuncio donde rinde sin molestar.
  const parts = post.html.split("</p>");
  const head = parts.slice(0, 2).join("</p>") + (parts.length > 2 ? "</p>" : "");
  const tail = parts.length > 2 ? parts.slice(2).join("</p>") : "";

  return (
    <article className="mx-auto max-w-3xl">
      <Breadcrumbs items={[{ name: sectionName[post.section], href: `/${post.section}` }, { name: post.title, href: `/${post.section}/${post.slug}` }]} />
      <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-lg text-muted">{post.description}</p>
      <p className="mt-3 text-sm text-muted">
        Por <span className="font-medium text-fg">{author.name}</span> · {dateTime(post.date)}
        {post.updated && <> · Actualizado {dateTime(post.updated)}</>}
      </p>

      {coins.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {coins.map((c) => (
            <Link key={c!.id} href={`/precio/${slugForCoin(c!.id)}`} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-brand-soft">
              <span className="font-medium">{c!.symbol.toUpperCase()}</span>
              <span className="tabular-nums">{price(c!.current_price)}</span>
              <Change value={c!.price_change_percentage_24h} />
            </Link>
          ))}
        </div>
      )}

      <div className="prose-mc mt-6" dangerouslySetInnerHTML={{ __html: head }} />
      <AdSlot slot={`${post.section}-in-article`} minHeight={250} />
      <div className="prose-mc" dangerouslySetInnerHTML={{ __html: tail }} />

      <Card className="mt-8">
        <p className="text-sm">
          <span className="font-semibold">{author.name}</span> · {author.role}
        </p>
        <p className="mt-1 text-sm text-muted">{author.bio}</p>
      </Card>
      <Disclaimer />
      <AdSlot slot={`${post.section}-end`} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": post.section === "noticias" ? "NewsArticle" : "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.updated ?? post.date,
          mainEntityOfPage: url,
          image: post.image ? [new URL(post.image, site.url).toString()] : [`${site.url}/opengraph-image`],
          inLanguage: "es",
          author: [{ "@type": "Person", name: author.name, url: `${site.url}/sobre-nosotros` }],
          publisher: { "@id": `${site.url}/#org` },
        }}
      />
    </article>
  );
}
