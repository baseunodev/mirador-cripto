// Gráficos en SVG puro, renderizados en el servidor: cero JavaScript extra y buen Core Web Vitals.

export function Sparkline({ data, width = 120, height = 36 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const d = data.map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)} ${(height - ((v - min) / span) * height).toFixed(1)}`).join("");
  const up = data[data.length - 1] >= data[0];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
      <path d={d} fill="none" stroke={up ? "var(--up)" : "var(--down)"} strokeWidth="1.5" />
    </svg>
  );
}

/** Reduce una serie a ~n puntos para que el HTML no pese de más. */
export function downsample<T>(xs: T[], n = 180): T[] {
  if (xs.length <= n) return xs;
  const step = xs.length / n;
  return Array.from({ length: n }, (_, i) => xs[Math.floor(i * step)]).concat([xs[xs.length - 1]]);
}

export function AreaChart({ points, label }: { points: [number, number][]; label: string }) {
  const W = 720;
  const H = 260;
  const pad = { l: 8, r: 8, t: 12, b: 24 };
  if (points.length < 2) return null;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const X = (x: number) => pad.l + ((x - x0) / (x1 - x0 || 1)) * (W - pad.l - pad.r);
  const Y = (y: number) => pad.t + (1 - (y - y0) / (y1 - y0 || 1)) * (H - pad.t - pad.b);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join("");
  const area = `${line}L${X(x1).toFixed(1)} ${H - pad.b}L${X(x0).toFixed(1)} ${H - pad.b}Z`;
  const up = ys[ys.length - 1] >= ys[0];
  const color = up ? "var(--up)" : "var(--down)";
  const fmt = (t: number) => new Date(t).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
      <path d={area} fill={color} fillOpacity="0.1" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" />
      <text x={pad.l} y={H - 6} fontSize="12" fill="var(--muted)">
        {fmt(x0)}
      </text>
      <text x={W - pad.r} y={H - 6} fontSize="12" fill="var(--muted)" textAnchor="end">
        {fmt(x1)}
      </text>
    </svg>
  );
}
