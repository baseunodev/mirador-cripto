// Titulares de El Bloque. El mirador no publica notas: las muestra y manda la visita al diario.
import type { Headline } from "@/lib/rss";
import { diario, diarioLink } from "@/lib/site";

const sectionColor: Record<string, string> = {
  Mercado: "#f7931a",
  Regulación: "#3b82f6",
  "América Latina": "#10b981",
  Seguridad: "#ef4444",
  Guías: "#8b5cf6",
};

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
      <ul className="divide-y divide-border">
        {items.map((h) => (
          <li key={h.url}>
            <a href={withUtm(h.url, campaign)} target="_blank" rel="noopener" className="group block py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: sectionColor[h.section] ?? "var(--brand-2)" }}>
                {h.section}
              </span>
              <span className="text-[11px] text-muted"> · {ago(h.date)}</span>
              <span className="mt-0.5 block font-medium leading-snug group-hover:text-brand-2">{h.title}</span>
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
            className={`card card-hover group flex h-full flex-col p-4 ${i === 0 ? "justify-end bg-gradient-to-br from-[#1d1546] to-surface lg:p-6" : ""}`}
            style={{ borderTop: `3px solid ${sectionColor[h.section] ?? "var(--brand)"}` }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: sectionColor[h.section] ?? "var(--brand-2)" }}>
              {h.section} <span className="font-normal normal-case tracking-normal text-muted">· {ago(h.date)}</span>
            </span>
            <span className={`mt-1.5 font-display font-semibold leading-snug group-hover:text-white ${i === 0 ? "text-xl lg:text-2xl" : "text-base"}`}>{h.title}</span>
            <span className="mt-3 text-xs text-muted group-hover:text-brand-2">Leer en {diario.name} ↗</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
