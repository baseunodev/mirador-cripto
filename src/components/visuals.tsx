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

function heatColor(ch: number) {
  const k = Math.min(Math.abs(ch) / 8, 1);
  if (Math.abs(ch) < 0.15) return "rgb(31, 35, 41)";
  // Tonos apagados que se intensifican con la variación: verde y rojo sobre grafito.
  return ch > 0 ? `rgb(${Math.round(20 + 10 * k)}, ${Math.round(70 + 110 * k)}, ${Math.round(55 + 75 * k)})` : `rgb(${Math.round(90 + 150 * k)}, ${Math.round(35 + 40 * k)}, ${Math.round(38 + 40 * k)})`;
}

/** Mapa de calor del mercado: el tamaño es la capitalización (comprimida) y el color, la variación de 24 h. */
export function Heatmap({ coins }: { coins: Coin[] }) {
  // Raíz cuadrada para que bitcoin no tape todo y las chicas se lean.
  const cells = layout(coins, { x: 0, y: 0, w: 100, h: 100 }, (c) => Math.sqrt(c.market_cap || 1));
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg sm:aspect-[16/7]">
      {cells.map(({ x, y, w, h, coin }) => {
        const ch = coin.price_change_percentage_24h ?? 0;
        const area = w * h;
        const big = area > 140;
        const tiny = area < 35;
        // En celular las celdas chicas solo muestran el símbolo (o nada) para no amontonarse.
        const mobile = area > 90 ? "" : "hidden sm:block";
        return (
          <Link
            key={coin.id}
            href={`/precio/${slugForCoin(coin.id)}`}
            title={`${coin.name}: ${pct(ch)} en 24 h`}
            className="group absolute flex flex-col items-center justify-center overflow-hidden border-2 border-surface text-center text-fg transition hover:z-10 hover:brightness-125"
            style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, background: heatColor(ch) }}
          >
            {!tiny && <span className={`${area > 55 ? "" : "hidden sm:block"} font-semibold leading-none ${big ? "text-xl sm:text-2xl" : "text-[11px] sm:text-sm"}`}>{coin.symbol.toUpperCase()}</span>}
            {!tiny && <span className={`${mobile} mono mt-1 opacity-90 ${big ? "text-sm" : "text-[10px] sm:text-xs"}`}>{pct(ch)}</span>}
          </Link>
        );
      })}
    </div>
  );
}

const fngColor = (v: number) => (v < 25 ? "#ff5c5c" : v < 45 ? "#f5a524" : v <= 55 ? "#8b929c" : v <= 75 ? "#a7e05a" : "#3ddc97");

/** Velocímetro semicircular de 0 a 100 con aguja. */
export function Gauge({ value, label, size = 220 }: { value: number; label: string; size?: number }) {
  const cx = 110;
  const cy = 110;
  const r = 90;
  const seg = [
    [0, 25, "#ea3943"],
    [25, 45, "#f5a524"],
    [45, 55, "#9aa3b5"],
    [55, 75, "#93d900"],
    [75, 100, "#16c784"],
  ] as const;
  const pt = (v: number, rr = r) => {
    const a = Math.PI * (1 - v / 100);
    return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)];
  };
  const arc = (a: number, b: number) => {
    const [x1, y1] = pt(a);
    const [x2, y2] = pt(b);
    return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const [nx, ny] = pt(value, r - 22);
  return (
    <svg viewBox="0 0 220 168" width={size} className="mx-auto h-auto max-w-full" role="img" aria-label={`Índice ${value}: ${fngLabel(label)}`}>
      {seg.map(([a, b, c]) => (
        <path key={a} d={arc(a + 0.8, b - 0.8)} stroke={c} strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.9" />
      ))}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="8" fill="var(--fg)" />
      <text x={cx} y={cy + 40} textAnchor="middle" fontSize="32" fontWeight="600" fontFamily="var(--font-mono)" fill={fngColor(value)}>
        {value}
      </text>
      <text x={cx} y={cy + 58} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--fg)">
        {fngLabel(label)}
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
      <div className="mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <span style={{ width: `${btc}%`, background: "#f7931a" }} />
        <span style={{ width: `${eth}%`, background: "#8ea2ff" }} />
        <span style={{ width: `${rest}%`, background: "#2a2f36" }} />
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
      <div className="relative mt-3 h-1.5 rounded-full" style={{ background: "linear-gradient(90deg, #ff5c5c, #f5a524 40%, #8b929c 50%, #3ddc97)" }}>
        <span className="absolute -top-[5px] h-4 w-0.5 -translate-x-1/2 bg-fg" style={{ left: `${value}%` }} />
      </div>
      <div className="mono mt-2 flex justify-between text-[10px] text-faint">
        <span>MIEDO EXTREMO</span>
        <span>CODICIA EXTREMA</span>
      </div>
    </div>
  );
}
