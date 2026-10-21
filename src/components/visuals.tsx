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
  if (Math.abs(ch) < 0.15) return "rgb(52, 60, 78)";
  return ch > 0 ? `rgb(${Math.round(20 + 0 * k)}, ${Math.round(90 + 110 * k)}, ${Math.round(70 + 62 * k)})` : `rgb(${Math.round(110 + 124 * k)}, ${Math.round(40 + 17 * k)}, ${Math.round(50 + 17 * k)})`;
}

/** Mapa de calor del mercado: el tamaño es la capitalización (comprimida) y el color, la variación de 24 h. */
export function Heatmap({ coins }: { coins: Coin[] }) {
  // Raíz cuadrada para que bitcoin no tape todo y las chicas se lean.
  const cells = layout(coins, { x: 0, y: 0, w: 100, h: 100 }, (c) => Math.sqrt(c.market_cap || 1));
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl sm:aspect-[16/8]">
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
            className="group absolute flex flex-col items-center justify-center overflow-hidden border border-bg text-center text-white transition hover:z-10 hover:brightness-125"
            style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, background: heatColor(ch) }}
          >
            {!tiny && <span className={`${area > 55 ? "" : "hidden sm:block"} font-bold leading-none ${big ? "text-xl sm:text-2xl" : "text-[11px] sm:text-sm"}`}>{coin.symbol.toUpperCase()}</span>}
            {!tiny && <span className={`${mobile} mt-0.5 tabular-nums opacity-90 ${big ? "text-sm" : "text-[10px] sm:text-xs"}`}>{pct(ch)}</span>}
          </Link>
        );
      })}
    </div>
  );
}

const fngColor = (v: number) => (v < 25 ? "#ea3943" : v < 45 ? "#f5a524" : v <= 55 ? "#9aa3b5" : v <= 75 ? "#93d900" : "#16c784");

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
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--fg)" strokeWidth="4" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="8" fill="var(--fg)" />
      <text x={cx} y={cy + 40} textAnchor="middle" fontSize="32" fontWeight="800" fill={fngColor(value)}>
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
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full">
        <span style={{ width: `${btc}%`, background: "#f7931a" }} />
        <span style={{ width: `${eth}%`, background: "#7c5cff" }} />
        <span style={{ width: `${rest}%`, background: "#334155" }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted">
        <span>BTC {btc.toFixed(1).replace(".", ",")}%</span>
        <span>ETH {eth.toFixed(1).replace(".", ",")}%</span>
        <span>Resto {rest.toFixed(1).replace(".", ",")}%</span>
      </div>
    </div>
  );
}
