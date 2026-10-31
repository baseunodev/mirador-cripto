// Titulares de El Bloque. El mirador no publica notas: las muestra y manda la visita al diario.
import type { Headline } from "@/lib/rss";
import { diario, diarioLink } from "@/lib/site";

function ago(iso: string) {
  if (!iso) return "";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `hace ${Math.max(1, m)} min`;
  if (m < 48 * 60) return `hace ${Math.round(m / 60)} h`;
  return `hace ${Math.round(m / 1440)} días`;
}

const withUtm = (url: string, campaign: string) => `${url}${url.includes("?") ? "&" : "?"}utm_source=mirador&utm_medium=referral&utm_campaign=${campaign}`;

export function Headlines({ items, campaign, compact = false }: { items: Headline[]; campaign: string; compact?: boolean }) {
  if (!items.length) {
    return (
      <a href={diarioLink("/", campaign)} target="_blank" rel="noopener" className="card card-hover flex items-center justify-between gap-4 p-5">
        <span>
          <span className="block font-semibold">Las noticias del día están en {diario.name}</span>
          <span className="mt-1 block text-sm text-muted">Mercado, regulación, estafas y guías, explicadas en español.</span>
        </span>
        <span className="btn-primary shrink-0">Leer ↗</span>
      </a>
    );
  }
  if (compact) {
    return (
      <ul className="divide-y divide-line">
        {items.map((h) => (
          <li key={h.url}>
            <a href={withUtm(h.url, campaign)} target="_blank" rel="noopener" className="group block py-3">
              <span className="mono text-[11px] uppercase tracking-wider text-brand">{h.section}</span>
              <span className="mono text-[11px] text-faint"> · {ago(h.date)}</span>
              <span className="mt-1 block font-medium leading-snug group-hover:text-brand">{h.title}</span>
            </a>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((h, i) => (
        <li key={h.url} className={i === 0 ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""}>
          <a
            href={withUtm(h.url, campaign)}
            target="_blank"
            rel="noopener"
            className={`card card-hover group flex h-full flex-col p-5 ${i === 0 ? "lg:p-7" : ""}`}
          >
            <span className="mono text-[11px] uppercase tracking-wider text-brand">
              {h.section} <span className="normal-case tracking-normal text-faint">· {ago(h.date)}</span>
            </span>
            <span className={`mt-2.5 font-semibold leading-snug ${i === 0 ? "text-xl lg:mt-auto lg:text-[28px] lg:leading-tight" : "text-base"}`}>{h.title}</span>
            <span className="mt-3 text-xs text-muted group-hover:text-brand">Leer en {diario.name} ↗</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
