import type { Metadata } from "next";
import { getPosts } from "@/lib/content";
import { PostList } from "@/components/posts";
import { Breadcrumbs, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Aprendé cripto desde cero: guías claras y sin humo",
  description: "Qué es bitcoin, qué es una stablecoin, cómo funciona el dólar cripto y cómo evitar estafas. Guías en español para entender antes de decidir.",
  alternates: { canonical: "/aprende" },
};

export default function LearnIndex() {
  const posts = getPosts("aprende");
  return (
    <>
      <Breadcrumbs items={[{ name: "Aprendé", href: "/aprende" }]} />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Aprendé cripto desde cero</h1>
      <p className="mt-1 text-muted">Guías claras para entender antes de decidir.</p>
      <Card className="mt-5">
        <PostList posts={posts} />
      </Card>
    </>
  );
}
