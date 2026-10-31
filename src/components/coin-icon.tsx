"use client";
import { useState } from "react";

const palette = ["#f7931a", "#7c5cff", "#22d3ee", "#16c784", "#ea3943", "#f5a524", "#ec4899", "#3b82f6"];

/** Logo de la moneda. Si no hay imagen o falla la carga, muestra la inicial sobre un color estable. */
export function CoinIcon({ src, symbol, size = 24, className = "" }: { src?: string; symbol: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} loading="lazy" onError={() => setFailed(true)} className={`shrink-0 rounded-full ${className}`} style={{ width: size, height: size }} />;
  }
  const color = palette[[...symbol].reduce((a, ch) => a + ch.charCodeAt(0), 0) % palette.length];
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${className}`}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, ${color}99)`, fontSize: size * 0.42 }}
    >
      {symbol.slice(0, 1).toUpperCase()}
    </span>
  );
}
