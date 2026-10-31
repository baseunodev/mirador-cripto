"use client";
import { useState } from "react";

/** Compartir con el menú nativo del celular; en compu copia el link. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) return await navigator.share({ title, url });
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // El usuario canceló o el navegador no dejó copiar.
    }
  };
  return (
    <button type="button" onClick={share} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] text-muted transition hover:text-fg">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v12M7 8l5-5 5 5" />
      </svg>
      {copied ? "¡Link copiado!" : "Compartir"}
    </button>
  );
}
