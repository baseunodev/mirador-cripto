"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOpenSearch } from "./search";

export type NavItem = { href: string; label: string; match: string; icon: string };

const isActive = (path: string, match: string) => (match === "/" ? path === "/" || path.startsWith("/precio") : path.startsWith(match));

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <>
      {items.map((n) => {
        const on = isActive(path, n.match);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={on ? "page" : undefined}
            className={`relative whitespace-nowrap rounded-lg px-3 py-1.5 transition ${on ? "text-fg" : "text-muted hover:bg-white/5 hover:text-fg"}`}
          >
            {n.label}
            {on && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-gradient-to-r from-brand to-brand-2" />}
          </Link>
        );
      })}
    </>
  );
}

/** Barra inferior fija en celulares: lo importante a un toque del pulgar. */
export function MobileTabBar({ items, newsHref }: { items: NavItem[]; newsHref: string }) {
  const path = usePathname();
  const openSearch = useOpenSearch();
  const cls = (on: boolean) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${on ? "text-fg" : "text-muted"}`;
  return (
    <nav aria-label="Secciones" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="flex">
        {items.slice(0, 2).map((n) => (
          <Link key={n.href} href={n.href} className={cls(isActive(path, n.match))}>
            <span className="text-lg leading-none" aria-hidden>{n.icon}</span>
            {n.label}
          </Link>
        ))}
        <button onClick={openSearch} className={cls(false)}>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-white" aria-hidden>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </span>
          Buscar
        </button>
        {items.slice(2, 3).map((n) => (
          <Link key={n.href} href={n.href} className={cls(isActive(path, n.match))}>
            <span className="text-lg leading-none" aria-hidden>{n.icon}</span>
            {n.label}
          </Link>
        ))}
        <a href={newsHref} target="_blank" rel="noopener" className={cls(false)}>
          <span className="text-lg leading-none" aria-hidden>📰</span>
          Noticias
        </a>
      </div>
    </nav>
  );
}
