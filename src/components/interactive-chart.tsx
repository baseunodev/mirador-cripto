"use client";
import { useId, useMemo, useRef, useState } from "react";
import { pct, price } from "@/lib/format";

type Series = [number, number][];
type Range = { key: string; label: string; data: Series };

const W = 800;
const PAD = { l: 0, r: 0, t: 16, b: 28 };
const BARS = 40; // franja inferior con barras de cuánto se movió cada tramo

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
    const base = H - PAD.b - BARS - 6; // piso del área de precio
    const Y = (y: number) => PAD.t + (1 - (y - min) / span) * (base - PAD.t);
    const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join("");
    const area = `${line}L${X(x1).toFixed(1)} ${base}L${X(x0).toFixed(1)} ${base}Z`;
    const first = ys[0];
    const last = ys[ys.length - 1];
    // Barras: variación absoluta de cada tramo, verde si subió y rojo si bajó.
    const moves = ys.slice(1).map((y, i) => (y - ys[i]) / ys[i]);
    const maxMove = Math.max(...moves.map(Math.abs)) || 1;
    const bw = Math.max(1, (W / moves.length) * 0.6);
    const bars = moves.map((m, i) => ({ x: X(xs[i + 1]) - bw / 2, h: Math.max(1, (Math.abs(m) / maxMove) * BARS), up: m >= 0, w: bw }));
    return { pts, X, Y, line, area, min, max, first, last, H, base, bars, change: ((last - first) / first) * 100 };
  }, [range, height]);

  if (!geo || !range) return null;
  const up = geo.last >= geo.first;
  const color = up ? "var(--up)" : "var(--down)";
  const glow = up ? "glow-up" : "glow-down";
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

  const dot = hp ?? geo.pts[geo.pts.length - 1];
  const dotX = (geo.X(dot[0]) / W) * 100;
  const dotY = (geo.Y(dot[1]) / geo.H) * 100;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-h-[44px]">
          {hp ? (
            <>
              <p className="text-base font-medium tabular-nums">{price(hp[1])}</p>
              <p className="mono text-[11px] text-muted">{fmtDate(hp[0])}</p>
            </>
          ) : (
            !compact && (
              <>
                <p className={`text-base font-medium tabular-nums ${up ? "text-up" : "text-down"}`}>{pct(geo.change)}</p>
                <p className="mono text-[11px] text-muted">en {range.label.toLowerCase()}</p>
              </>
            )
          )}
        </div>
        <div role="tablist" aria-label="Rango del gráfico" className="flex gap-0.5 rounded-lg border border-border p-[3px]">
          {available.map((r) => (
            <button
              key={r.key}
              role="tab"
              aria-selected={r.key === range.key}
              onClick={() => setActive(r.key)}
              className={`mono rounded-md px-3 py-1.5 text-xs transition ${r.key === range.key ? "bg-border text-fg" : "text-muted hover:text-fg"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative" style={{ height: geo.H }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${geo.H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full touch-none select-none"
          role="img"
          aria-label={`Gráfico de precio: ${pct(geo.change)} en ${range.label}`}
          onMouseMove={(e) => onMove(e.clientX)}
          onMouseLeave={() => setHover(null)}
          onTouchMove={(e) => onMove(e.touches[0].clientX)}
          onTouchEnd={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`g${gid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.38" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={PAD.t + f * (geo.base - PAD.t)} y2={PAD.t + f * (geo.base - PAD.t)} stroke="#1a1d22" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
          ))}
          <g key={range.key} className="reveal">
            <path d={geo.area} fill={`url(#g${gid})`} />
            <line x1="0" x2={W} y1={geo.Y(geo.first)} y2={geo.Y(geo.first)} stroke="var(--faint)" strokeDasharray="1 4" vectorEffect="non-scaling-stroke" />
            {geo.bars.map((b, i) => (
              <rect key={i} x={b.x} y={geo.H - PAD.b - b.h} width={b.w} height={b.h} fill={b.up ? "var(--up)" : "var(--down)"} fillOpacity="0.35" />
            ))}
            <path d={geo.line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className={glow} />
          </g>
          {hp && <line x1={geo.X(hp[0])} x2={geo.X(hp[0])} y1={PAD.t} y2={geo.H - PAD.b} stroke="var(--muted)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />}
        </svg>
        {!hp && (
          <span aria-hidden className="ping pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${dotX}%`, top: `${dotY}%`, background: color }} />
        )}
        <span
          aria-hidden
          className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${hp ? "h-3 w-3 border-2 bg-bg" : "h-2 w-2"}`}
          style={{ left: `${dotX}%`, top: `${dotY}%`, background: hp ? "var(--bg)" : color, borderColor: color, boxShadow: `0 0 10px ${color}` }}
        />
        {hp && (
          <span
            className="mono pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface-2 px-2 py-1 text-[11px]"
            style={{ left: `clamp(60px, ${dotX}%, calc(100% - 60px))` }}
          >
            {price(hp[1])} <span className={hp[1] >= geo.first ? "text-up" : "text-down"}>{pct(((hp[1] - geo.first) / geo.first) * 100)}</span>
          </span>
        )}
        {!hp && <span className="mono pointer-events-none absolute right-0 top-0 text-[11px] text-faint">{price(geo.max)}</span>}
        <span className="mono pointer-events-none absolute right-0 text-[11px] text-faint" style={{ top: `${((geo.Y(geo.min) + 4) / geo.H) * 100}%` }}>{price(geo.min)}</span>
      </div>
      <div className="mono -mt-5 flex justify-between text-[11px] text-faint">
        <span>{fmtDate(geo.pts[0][0])}</span>
        <span>{fmtDate(geo.pts[geo.pts.length - 1][0])}</span>
      </div>
    </div>
  );
}
