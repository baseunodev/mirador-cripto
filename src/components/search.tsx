"use client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { searchItems, type SearchItem } from "@/lib/search";
import { CoinIcon } from "./coin-icon";

const OpenCtx = createContext<() => void>(() => {});
export const useOpenSearch = () => useContext(OpenCtx);

/** Buscador global: se abre con ⌘K / Ctrl+K o con "/", y se navega con flechas y Enter. */
export function SearchProvider({ items, children }: { items: SearchItem[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openFn = useCallback(() => setOpen(true), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <OpenCtx.Provider value={openFn}>
      {children}
      {open && <Palette items={items} onClose={() => setOpen(false)} />}
    </OpenCtx.Provider>
  );
}

function Palette({ items, onClose }: { items: SearchItem[]; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchItems(items, q, 8), [items, q]);

  useEffect(() => {
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  useEffect(() => setActive(0), [q]);

  const go = (it?: SearchItem) => {
    if (!it) return;
    onClose();
    router.push(it.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Buscar" className="card w-full max-w-xl overflow-hidden p-0 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === "Enter") go(results[active]);
            }}
            placeholder="Buscá una moneda, un país o un conversor…"
            aria-label="Buscar"
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted sm:block">ESC</kbd>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto p-2" role="listbox">
          {!q && <li className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Más buscadas</li>}
          {results.map((it, i) => (
            <li key={it.href} role="option" aria-selected={i === active}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(it)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${i === active ? "bg-brand-soft" : ""}`}
              >
                {it.kind === "coin" ? (
                  <CoinIcon src={it.image} symbol={it.symbol ?? it.title} size={28} />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-sm" aria-hidden>
                    {it.image ?? "→"}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{it.title}</span>
                  {it.subtitle && <span className="block truncate text-xs text-muted">{it.subtitle}</span>}
                </span>
                {it.symbol && <span className="text-xs uppercase text-muted">{it.symbol}</span>}
                {it.rank && <span className="hidden rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted sm:block">#{it.rank}</span>}
              </button>
            </li>
          ))}
          {q && results.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">Sin resultados para “{q}”.</li>}
        </ul>
        <div className="hidden items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted sm:flex">
          <span>↑↓ para moverte</span>
          <span>Enter para abrir</span>
          <span className="ml-auto">⌘K para abrir desde cualquier página</span>
        </div>
      </div>
    </div>
  );
}

export function SearchButton({ compact = false }: { compact?: boolean }) {
  const open = useOpenSearch();
  if (compact) {
    return (
      <button onClick={open} aria-label="Buscar" className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-white/5 hover:text-fg">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    );
  }
  return (
    <button
      onClick={open}
      className="flex w-56 items-center gap-2 rounded-xl border border-border bg-surface-2/80 px-3 py-1.5 text-sm text-muted transition hover:border-brand/60 hover:text-fg"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span className="flex-1 text-left">Buscar moneda…</span>
      <kbd className="rounded border border-border px-1.5 text-[10px]">⌘K</kbd>
    </button>
  );
}
