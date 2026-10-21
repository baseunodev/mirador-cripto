"use client";
import { useState } from "react";

// Selector de rango del gráfico. Los SVG llegan ya renderizados desde el servidor; acá solo se elige cuál mostrar.
export function RangeChart({ ranges }: { ranges: { key: string; label: string; node: React.ReactNode }[] }) {
  const available = ranges.filter((r) => r.node);
  const [active, setActive] = useState(available[0]?.key);
  if (!available.length) return null;
  return (
    <div>
      <div role="tablist" aria-label="Rango del gráfico" className="mb-2 flex gap-1">
        {available.map((r) => (
          <button
            key={r.key}
            role="tab"
            aria-selected={active === r.key}
            onClick={() => setActive(r.key)}
            className={`rounded-md px-3 py-1 text-sm ${active === r.key ? "bg-brand text-white" : "text-muted hover:bg-brand-soft"}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      {available.map((r) => (
        <div key={r.key} hidden={active !== r.key}>
          {r.node}
        </div>
      ))}
    </div>
  );
}
