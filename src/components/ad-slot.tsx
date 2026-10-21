"use client";
import { useEffect, useRef } from "react";

const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Espacio de anuncio con alto reservado (evita saltos de diseño / CLS).
 * Sin NEXT_PUBLIC_ADSENSE_CLIENT no muestra nada: así el sitio se puede publicar antes de que aprueben AdSense.
 */
export function AdSlot({ slot, minHeight = 250, className = "" }: { slot: string; minHeight?: number; className?: string }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (!client || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense todavía no cargó o el bloqueador de anuncios lo impidió
    }
  }, []);
  if (!client) return null;
  return (
    <div className={`my-6 ${className}`} style={{ minHeight }} aria-label="Publicidad">
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
