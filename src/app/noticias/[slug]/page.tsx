import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost, getPosts } from "@/lib/content";
import { Article } from "@/components/article";

export const revalidate = 900;
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts("noticias").map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost("noticias", slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/noticias/${slug}` },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.date, modifiedTime: post.updated ?? post.date },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = getPost("noticias", slug);
  if (!post) notFound();
  return <Article post={post} />;
}
