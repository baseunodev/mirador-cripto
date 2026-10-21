import type { Metadata } from "next";
import { getPosts } from "@/lib/content";
import { PostList } from "@/components/posts";
import { Breadcrumbs, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Noticias cripto hoy: qué pasa con bitcoin y el mercado",
  description: "Las noticias del mercado cripto explicadas en español: por qué sube o baja bitcoin, regulación, estafas y lo que importa en tu país.",
  alternates: { canonical: "/noticias" },
};

export default function NewsIndex() {
  const posts = getPosts("noticias");
  return (
    <>
      <Breadcrumbs items={[{ name: "Noticias", href: "/noticias" }]} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Noticias cripto</h1>
      <p className="mt-1 text-muted">Lo que mueve al mercado, explicado sin humo.</p>
      <Card className="mt-5">{posts.length ? <PostList posts={posts} /> : <p className="text-sm text-muted">Pronto publicamos las primeras noticias.</p>}</Card>
    </>
  );
}
