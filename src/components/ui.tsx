import Link from "next/link";
import { disclaimer, site } from "@/lib/site";
import { pct, trendClass } from "@/lib/format";

export function Change({ value, className = "" }: { value: number | null | undefined; className?: string }) {
  return <span className={`${trendClass(value)} font-medium tabular-nums ${className}`}>{pct(value)}</span>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card p-4 sm:p-5 ${className}`}>{children}</section>;
}

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  const all = [{ name: "Inicio", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Migas de pan" className="mb-3 text-sm text-muted">
        {all.map((it, i) => (
          <span key={it.href}>
            {i > 0 && <span className="mx-1.5">/</span>}
            {i < all.length - 1 ? (
              <Link href={it.href} className="hover:text-fg">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page">{it.name}</span>
            )}
          </span>
        ))}
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: site.url + it.href })),
        }}
      />
    </>
  );
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export { AdSlot } from "./ad-slot";

export function Disclaimer() {
  return <p className="mt-8 rounded-lg bg-brand-soft p-3 text-sm text-muted">{disclaimer}</p>;
}

export function Updated({ at, source }: { at: string | number; source: string }) {
  const d = new Date(at);
  return (
    <p className="text-xs text-muted">
      Actualizado {isNaN(d.getTime()) ? "recientemente" : d.toLocaleString(site.numberLocale, { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" })}{" "}
      (hora de Buenos Aires) · Datos de {source}
    </p>
  );
}

export function Unavailable({ what }: { what: string }) {
  return <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No pudimos cargar {what} en este momento. Probá de nuevo en unos minutos.</p>;
}
