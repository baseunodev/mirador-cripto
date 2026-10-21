import Link from "next/link";
import type { Post } from "@/lib/content";
import { date } from "@/lib/format";

export function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul className="divide-y divide-border">
      {posts.map((p) => (
        <li key={`${p.section}/${p.slug}`} className="py-3 first:pt-0 last:pb-0">
          <Link href={`/${p.section}/${p.slug}`} className="font-medium hover:underline">
            {p.title}
          </Link>
          <p className="mt-0.5 text-sm text-muted">{p.description}</p>
          <p className="mt-0.5 text-xs text-muted">{date(p.date)}</p>
        </li>
      ))}
    </ul>
  );
}
