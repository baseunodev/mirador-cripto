"use client";
// Favoritas guardadas en el navegador de cada visitante (no hace falta cuenta).
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const KEY = "mc:favoritas";
type Ctx = { favs: string[]; toggle: (slug: string) => void; ready: boolean };
const FavCtx = createContext<Ctx>({ favs: [], toggle: () => {}, ready: false });

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favs, setFavs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setFavs(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setFavs(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const toggle = useCallback((slug: string) => {
    setFavs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  return <FavCtx.Provider value={{ favs, toggle, ready }}>{children}</FavCtx.Provider>;
}

export const useFavorites = () => useContext(FavCtx);

export function FavButton({ slug, name, withLabel = false }: { slug: string; name: string; withLabel?: boolean }) {
  const { favs, toggle } = useFavorites();
  const on = favs.includes(slug);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      aria-pressed={on}
      aria-label={on ? `Quitar ${name} de favoritas` : `Agregar ${name} a favoritas`}
      title={on ? "Quitar de favoritas" : "Agregar a favoritas"}
      className={`inline-flex items-center gap-1.5 rounded-lg transition ${withLabel ? "border border-border bg-surface-2 px-3 py-1.5 text-sm" : "p-1"} ${on ? "text-warn" : "text-muted hover:text-fg"}`}
    >
      <svg viewBox="0 0 24 24" width={withLabel ? 16 : 15} height={withLabel ? 16 : 15} fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
        <path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z" />
      </svg>
      {withLabel && (on ? "En favoritas" : "Seguir")}
    </button>
  );
}
