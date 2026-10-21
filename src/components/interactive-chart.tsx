"use client";
import { useId, useMemo, useRef, useState } from "react";
import { pct, price } from "@/lib/format";

type Series = [number, number][];
type Range = { key: string; label: string; data: Series };

const W = 800;
const PAD = { l: 0, r: 0, t: 16, b: 28 };

/** Gráfico de área con selector de rango y cursor que muestra precio y fecha al pasar el dedo o el mouse. */
export function InteractiveChart({ ranges, height = 300, compact = false }: { ranges: Range[]; height?: number; compact?: boolean }) {
  const available = ranges.filter((r) => r.data.length > 1);
  const [active, setActive] = useState(available[0]?.key);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gid = useId().replace(/:/g, "");
  const range = available.find((r) => r.key === active) ?? available[0];

  const geo = useMemo(() => {
    if (!range) return null;
    const pts = range.data;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const x0 = xs[0];
    const x1 = xs[xs.length - 1];
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const span = max - min || 1;
    const H = height;
    const X = (x: number) => PAD.l + ((x - x0) / (x1 - x0 || 1)) * (W - PAD.l - PAD.r);
    const Y = (y: number) => PAD.t + (1 - (y - min) / span) * (H - PAD.t - PAD.b);
    const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join("");
    const area = `${line}L${X(x1).toFixed(1)} ${H - PAD.b}L${X(x0).toFixed(1)} ${H - PAD.b}Z`;
    const first = ys[0];
    const last = ys[ys.length - 1];
    return { pts, X, Y, line, area, min, max, first, last, H, change: ((last - first) / first) * 100 };
  }, [range, height]);

  if (!geo || !range) return null;
  const up = geo.last >= geo.first;
  const color = up ? "var(--up)" : "var(--down)";
  const hp = hover != null ? geo.pts[hover] : null;
  const days = (geo.pts[geo.pts.length - 1][0] - geo.pts[0][0]) / 864e5;
  const fmtDate = (t: number) =>
    new Date(t).toLocaleString("es-AR", days <= 2 ? { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" } : { day: "numeric", month: "short", year: days > 200 ? "numeric" : undefined });

  const onMove = (clientX: number) => {
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * W;
    let best = 0;
    let bd = Infinity;
    geo.pts.forEach((p, i) => {
      const d = Math.abs(geo.X(p[0]) - x);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setHover(best);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-h-[44px]">
          {hp ? (
            <>
              <p className="text-lg font-bold tabular-nums">{price(hp[1])}</p>
              <p className="text-xs text-muted">{fmtDate(hp[0])}</p>
            </>
          ) : (
            !compact && (
              <>
                <p className={`text-lg font-bold tabular-nums ${up ? "text-up" : "text-down"}`}>{pct(geo.change)}</p>
                <p className="text-xs text-muted">en {range.label.toLowerCase()}</p>
              </>
            )
          )}
        </div>
        <div role="tablist" aria-label="Rango del gráfico" className="flex gap-1 rounded-lg bg-surface-2 p-1">
          {available.map((r) => (
            <button
              key={r.key}
              role="tab"
              aria-selected={r.key === range.key}
              onClick={() => setActive(r.key)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition ${r.key === range.key ? "bg-brand text-white shadow" : "text-muted hover:text-fg"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${geo.H}`}
        className="h-auto w-full touch-none select-none"
        role="img"
        aria-label={`Gráfico de precio: ${pct(geo.change)} en ${range.label}`}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`g${gid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={PAD.t + f * (geo.H - PAD.t - PAD.b)} y2={PAD.t + f * (geo.H - PAD.t - PAD.b)} stroke="var(--border)" strokeDasharray="3 6" />
        ))}
        <path d={geo.area} fill={`url(#g${gid})`} />
        <path d={geo.line} fill="none" stroke={color} strokeWidth="2.25" strokeLinejoin="round" />
        <text x={W - 4} y={PAD.t + 4} textAnchor="end" fontSize="12" fill="var(--muted)">
          {price(geo.max)}
        </text>
        <text x={W - 4} y={geo.H - PAD.b - 6} textAnchor="end" fontSize="12" fill="var(--muted)">
          {price(geo.min)}
        </text>
        <text x="4" y={geo.H - 8} fontSize="12" fill="var(--muted)">
          {fmtDate(geo.pts[0][0])}
        </text>
        <text x={W - 4} y={geo.H - 8} fontSize="12" fill="var(--muted)" textAnchor="end">
          {fmtDate(geo.pts[geo.pts.length - 1][0])}
        </text>
        {hp ? (
          <>
            <line x1={geo.X(hp[0])} x2={geo.X(hp[0])} y1={PAD.t} y2={geo.H - PAD.b} stroke="var(--muted)" strokeDasharray="4 4" />
            <circle cx={geo.X(hp[0])} cy={geo.Y(hp[1])} r="5" fill={color} stroke="var(--bg)" strokeWidth="2" />
          </>
        ) : (
          <circle cx={geo.X(geo.pts[geo.pts.length - 1][0])} cy={geo.Y(geo.last)} r="4.5" fill={color} className="live-dot" />
        )}
      </svg>
    </div>
  );
}
