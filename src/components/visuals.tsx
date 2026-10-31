// Visuales que se renderizan en el servidor: mapa de calor, velocímetro y barras.
import Link from "next/link";
import type { Coin } from "@/lib/data";
import { slugForCoin } from "@/lib/catalog";
import { fngLabel, pct } from "@/lib/format";

type Rect = { x: number; y: number; w: number; h: number };
type Cell = Rect & { coin: Coin };

/** Treemap binario: divide en dos grupos de peso parecido y corta por el lado más largo. */
function layout(items: Coin[], r: Rect, weight: (c: Coin) => number): Cell[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ ...r, coin: items[0] }];
  const total = items.reduce((a, c) => a + weight(c), 0);
  let acc = 0;
  let split = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weight(items[i]);
    if (acc >= total / 2) {
      split = i + 1;
      break;
    }
  }
  split = Math.min(Math.max(split, 1), items.length - 1);
  const a = items.slice(0, split);
  const b = items.slice(split);
  const fa = a.reduce((s, c) => s + weight(c), 0) / total;
  if (r.w >= r.h) {
    const wa = r.w * fa;
    return [...layout(a, { x: r.x, y: r.y, w: wa, h: r.h }, weight), ...layout(b, { x: r.x + wa, y: r.y, w: r.w - wa, h: r.h }, weight)];
  }
  const ha = r.h * fa;
  return [...layout(a, { x: r.x, y: r.y, w: r.w, h: ha }, weight), ...layout(b, { x: r.x, y: r.y + ha, w: r.w, h: r.h - ha }, weight)];
}

/** Tinte sobrio: apenas un velo de verde o rojo sobre el grafito, el número lleva el color fuerte. */
function heatColor(ch: number) {
  const a = Math.min(0.24, 0.05 + Math.abs(ch) * 0.03).toFixed(3);
  const tint = Math.abs(ch) < 0.15 ? "rgba(139, 146, 156, 0.05)" : ch > 0 ? `rgba(61, 220, 151, ${a})` : `rgba(255, 92, 92, ${a})`;
  return `linear-gradient(${tint}, ${tint}), var(--surface)`;
}

/** Mapa de calor del mercado: el tamaño es la capitalización (comprimida) y el color, la variación de 24 h. */
export function Heatmap({ coins }: { coins: Coin[] }) {
  // Potencia 0,7: bitcoin se ve enorme como en la realidad, pero las chicas todavía se leen.
  const cells = layout(coins, { x: 0, y: 0, w: 100, h: 100 }, (c) => Math.pow(c.market_cap || 1, 0.7));
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg sm:aspect-[16/7]">
      {cells.map(({ x, y, w, h, coin }) => {
        const ch = coin.price_change_percentage_24h ?? 0;
        const area = w * h;
        const big = area > 300;
        const tiny = area < 18;
        // En celular las celdas chicas solo muestran el símbolo (o nada) para no amontonarse.
        const mobile = area > 60 ? "" : "hidden sm:block";
        return (
          <Link
            key={coin.id}
            href={`/precio/${slugForCoin(coin.id)}`}
            title={`${coin.name}: ${pct(ch)} en 24 h`}
            className="group absolute flex flex-col items-center justify-center overflow-hidden border border-bg text-center text-fg transition hover:z-10 hover:brightness-150"
            style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, background: heatColor(ch) }}
          >
            {!tiny && <span className={`${area > 35 ? "" : "hidden sm:block"} font-semibold leading-none ${big ? "text-2xl sm:text-4xl tracking-tight" : "text-[11px] sm:text-sm"}`}>{coin.symbol.toUpperCase()}</span>}
            {!tiny && <span className={`${mobile} mono mt-1 ${ch >= 0 ? "text-up" : "text-down"} ${big ? "text-base" : "text-[10px] sm:text-xs"}`}>{pct(ch)}</span>}
          </Link>
        );
      })}
    </div>
  );
}

const fngColor = (v: number) => (v < 25 ? "#ff5c5c" : v < 45 ? "#f5a524" : v <= 55 ? "#8b929c" : v <= 75 ? "#a7e05a" : "#3ddc97");

/** Velocímetro semicircular de 0 a 100: arco degradado de rojo a verde y aguja. */
export function Gauge({ value, label, size = 220 }: { value: number; label: string; size?: number }) {
  const cx = 110;
  const cy = 110;
  const r = 90;
  const pt = (v: number, rr = r) => {
    const a = Math.PI * (1 - v / 100);
    return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)];
  };
  const [x1, y1] = pt(0);
  const [x2, y2] = pt(100);
  const [nx, ny] = pt(value, r - 26);
  const [mx, my] = pt(value);
  const c = fngColor(value);
  return (
    <svg viewBox="0 0 220 160" width={size} className="mx-auto h-auto max-w-full" role="img" aria-label={`Índice ${value}: ${fngLabel(label)}`}>
      <defs>
        <linearGradient id="fng-arc" x1="0" x2="1">
          <stop offset="0" stopColor="#ff5c5c" />
          <stop offset="0.45" stopColor="#f5a524" />
          <stop offset="0.6" stopColor="#c8f031" />
          <stop offset="1" stopColor="#3ddc97" />
        </linearGradient>
      </defs>
      <path d={`M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`} stroke="url(#fng-arc)" strokeWidth="12" fill="none" strokeLinecap="round" />
      <circle cx={mx} cy={my} r="9" fill="var(--bg)" stroke={c} strokeWidth="3" style={{ filter: `drop-shadow(0 0 6px ${c})` }} />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--fg)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="var(--fg)" />
      <text x={cx} y={cy + 36} textAnchor="middle" fontSize="30" fontWeight="600" fontFamily="var(--font-mono)" fill="var(--fg)">
        {value}
      </text>
      <text x={cx} y={cy + 50} textAnchor="middle" fontSize="11" fontWeight="500" letterSpacing="1.2" fontFamily="var(--font-mono)" fill={c}>
        {fngLabel(label).toUpperCase()}
      </text>
    </svg>
  );
}

/** Barra horizontal de dominancia (BTC / ETH / resto). */
export function DominanceBar({ btc, eth }: { btc: number; eth: number }) {
  const rest = Math.max(0, 100 - btc - eth);
  const f = (n: number) => n.toFixed(1).replace(".", ",");
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-muted">Dominancia</span>
        <span className="text-[15px] tabular-nums">BTC {f(btc)}%</span>
      </div>
      <div className="mt-3 flex h-2 gap-0.5 rounded-full">
        <span className="rounded-l-full" style={{ width: `${btc}%`, background: "#f7931a", boxShadow: "0 0 10px rgba(247,147,26,.45)" }} />
        <span style={{ width: `${eth}%`, background: "#8ea2ff", boxShadow: "0 0 10px rgba(142,162,255,.4)" }} />
        <span className="rounded-r-full" style={{ width: `${rest}%`, background: "#2a2f36" }} />
      </div>
      <div className="mono mt-2 flex justify-between text-[10px] text-faint">
        <span>BTC {f(btc)}%</span>
        <span>ETH {f(eth)}%</span>
        <span>RESTO {f(rest)}%</span>
      </div>
    </div>
  );
}

/** Índice de miedo y codicia como barra lineal con marcador. */
export function FearGreedBar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-muted group-hover:text-fg">Miedo y codicia</span>
        <span className="text-[15px] tabular-nums">
          {value} <span className="text-xs" style={{ color: fngColor(value) }}>{label}</span>
        </span>
      </div>
      <div className="relative mt-3 h-1.5 rounded-full" style={{ background: "linear-gradient(90deg, #ff5c5c, #f5a524 45%, #c8f031 60%, #3ddc97)" }}>
        <span className="absolute -top-[5px] h-4 w-4 -translate-x-1/2 rounded-full border-2 bg-bg" style={{ left: `${value}%`, borderColor: fngColor(value), boxShadow: `0 0 8px ${fngColor(value)}` }} />
      </div>
      <div className="mono mt-2 flex justify-between text-[10px] text-faint">
        <span>MIEDO EXTREMO</span>
        <span>CODICIA EXTREMA</span>
      </div>
    </div>
  );
}
