// Historial de la brecha entre el dólar cripto y el blue (servidor, SVG puro).
import type { GapPoint } from "@/lib/data";
import { gapPct } from "@/lib/stats";

const W = 800;
const H = 220;

export function GapChart({ points }: { points: GapPoint[] }) {
  if (points.length < 10) return null;
  const gaps = points.map((p) => gapPct(p.cripto, p.blue));
  const min = Math.min(0, ...gaps);
  const max = Math.max(0, ...gaps);
  const pad = (max - min) * 0.1 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const X = (i: number) => (i / (points.length - 1)) * W;
  const Y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const line = gaps.map((g, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(g).toFixed(1)}`).join("");
  const zero = Y(0);
  const last = gaps[gaps.length - 1];
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const f = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1).replace(".", ",")}%`;
  const d = (s: string) => new Date(s + "T12:00:00Z").toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  return (
    <div>
      <div className="mb-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        <div className="bg-surface p-4">
          <p className="eyebrow">Brecha hoy</p>
          <p className={`mt-1.5 text-xl tabular-nums ${last >= 0 ? "text-warn" : "text-up"}`}>{f(last)}</p>
        </div>
        <div className="bg-surface p-4">
          <p className="eyebrow">Promedio {points.length} días</p>
          <p className="mt-1.5 text-xl tabular-nums">{f(avg)}</p>
        </div>
        <div className="bg-surface p-4">
          <p className="eyebrow">Mín / máx</p>
          <p className="mt-1.5 text-xl tabular-nums">
            {f(min)} / {f(max)}
          </p>
        </div>
      </div>
      <div className="relative h-[220px]">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="img" aria-label="Brecha diaria entre el dólar cripto y el blue">
          <line x1="0" x2={W} y1={zero} y2={zero} stroke="#2a2f36" vectorEffect="non-scaling-stroke" />
          <defs>
            <linearGradient id="gap-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--brand)" stopOpacity="0.3" />
              <stop offset="1" stopColor="var(--brand)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <g className="reveal">
            <path d={`${line}L${W} ${zero}L0 ${zero}Z`} fill="url(#gap-fill)" />
            <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="glow-brand" />
          </g>
        </svg>
        <span className="mono absolute right-0 -translate-y-full text-[11px] text-faint" style={{ top: `${(zero / H) * 100}%` }}>
          0% = IGUAL AL BLUE
        </span>
      </div>
      <div className="mono mt-2 flex justify-between text-[11px] text-faint">
        <span>{d(points[0].date)}</span>
        <span>{d(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}
