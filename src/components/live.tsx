"use client";
// Precios en vivo desde el navegador con el WebSocket público de datos de Binance (solo lectura, sin clave).
// No gasta el cupo de CoinGecko: el servidor da el primer valor y el WebSocket lo va actualizando.
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { pct, price as fmtPrice } from "@/lib/format";

type Tick = { price: number; change: number };
export type LiveStatus = "connecting" | "live" | "offline";
const LiveCtx = createContext<Record<string, Tick>>({});
const StatusCtx = createContext<{ status: LiveStatus; updatedAt: number }>({ status: "connecting", updatedAt: 0 });

// Solo pares que existen en Binance contra USDT (las stablecoins quedan afuera: valen ~1 siempre).
const BINANCE = new Set(
  "btc eth bnb sol xrp doge ada trx avax link dot ton shib ltc bch near uni apt icp etc pepe sui xlm hbar fil arb op atom inj aave pol render fet wld sei tia stx imx grt algo ena ondo jup bonk wif floki vet mkr rune ldo sand mana axs crv".split(" "),
);
export const liveSymbol = (symbol: string) => (BINANCE.has(symbol.toLowerCase()) ? `${symbol.toLowerCase()}usdt` : null);

/** Si en este tiempo no llegó ningún precio, se avisa que el vivo no funciona (p. ej. Binance bloqueado en el país). */
const LIVE_TIMEOUT = 8000;

export function LiveProvider({ symbols, updatedAt, children }: { symbols: string[]; updatedAt: number; children: React.ReactNode }) {
  const [ticks, setTicks] = useState<Record<string, Tick>>({});
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const key = symbols.join(",");

  useEffect(() => {
    const streams = key
      .split(",")
      .map(liveSymbol)
      .filter(Boolean)
      .map((s) => `${s}@miniTicker`);
    if (!streams.length) {
      setStatus("offline");
      return;
    }
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;
    let lastMsg = 0;
    let buffer: Record<string, Tick> = {};
    // Se agrupan las actualizaciones cada 1,5 s para no re-renderizar en cada mensaje.
    const flush = setInterval(() => {
      if (Object.keys(buffer).length) {
        const b = buffer;
        buffer = {};
        setTicks((t) => ({ ...t, ...b }));
      }
      // Sin mensajes por un rato: el vivo se cayó aunque el socket siga "abierto".
      if (lastMsg) setStatus(Date.now() - lastMsg < LIVE_TIMEOUT * 2 ? "live" : "offline");
    }, 1500);
    const giveUp = setTimeout(() => {
      if (!lastMsg) setStatus("offline");
    }, LIVE_TIMEOUT);
    const connect = () => {
      try {
        ws = new WebSocket(`wss://data-stream.binance.vision/stream?streams=${streams.join("/")}`);
        ws.onmessage = (ev) => {
          const d = JSON.parse(ev.data)?.data;
          if (!d?.s) return;
          lastMsg = Date.now();
          const c = Number(d.c);
          const o = Number(d.o);
          buffer[d.s.toLowerCase()] = { price: c, change: o ? ((c - o) / o) * 100 : 0 };
        };
        ws.onclose = () => {
          if (!closed) retry = setTimeout(connect, 5000);
        };
      } catch {
        // Sin WebSocket (navegador viejo o bloqueado): quedan los precios del servidor.
        setStatus("offline");
      }
    };
    connect();
    return () => {
      closed = true;
      clearInterval(flush);
      clearTimeout(retry);
      clearTimeout(giveUp);
      ws?.close();
    };
  }, [key]);

  return (
    <StatusCtx.Provider value={{ status, updatedAt }}>
      <LiveCtx.Provider value={ticks}>{children}</LiveCtx.Provider>
    </StatusCtx.Provider>
  );
}

export function useLive(symbol: string): Tick | undefined {
  const ticks = useContext(LiveCtx);
  const s = liveSymbol(symbol);
  return s ? ticks[s] : undefined;
}

export const useLiveStatus = () => useContext(StatusCtx);

function useFlash(value: number) {
  const prev = useRef(value);
  const [cls, setCls] = useState("");
  useEffect(() => {
    if (value !== prev.current) {
      setCls(value > prev.current ? "flash-up" : "flash-down");
      prev.current = value;
      const t = setTimeout(() => setCls(""), 900);
      return () => clearTimeout(t);
    }
  }, [value]);
  return cls;
}

/** Precio que se actualiza en vivo y parpadea al cambiar. */
export function LivePrice({ symbol, initial, prefix = "US$ ", className = "" }: { symbol: string; initial: number; prefix?: string; className?: string }) {
  const live = useLive(symbol);
  const value = live?.price ?? initial;
  const flash = useFlash(value);
  return <span className={`tabular-nums px-0.5 ${flash} ${className}`}>{fmtPrice(value, prefix)}</span>;
}

export function LiveChange({ symbol, initial, className = "", badge = false }: { symbol: string; initial: number | null; className?: string; badge?: boolean }) {
  const live = useLive(symbol);
  const v = live?.change ?? initial;
  const up = (v ?? 0) > 0;
  const down = (v ?? 0) < 0;
  if (badge) {
    return (
      <span
        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${up ? "bg-up/15 text-up" : down ? "bg-down/15 text-down" : "bg-white/5 text-muted"} ${className}`}
      >
        {up ? "▲" : down ? "▼" : ""} {pct(v).replace(/^[+−]/, "")}
      </span>
    );
  }
  return <span className={`font-medium tabular-nums ${up ? "text-up" : down ? "text-down" : "text-muted"} ${className}`}>{pct(v)}</span>;
}

/** Minutos desde la última actualización del servidor (se recalcula cada 30 s). */
function useAgeMinutes(updatedAt: number) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  return now && updatedAt ? Math.max(0, Math.round((now - updatedAt) / 60000)) : 0;
}

export function LiveBadge() {
  const { status, updatedAt } = useLiveStatus();
  const age = useAgeMinutes(updatedAt);
  const cfg = {
    live: { dot: "live-dot bg-up", text: "En vivo" },
    connecting: { dot: "live-dot bg-warn", text: "Conectando…" },
    offline: { dot: "bg-warn", text: age ? `Actualizado hace ${age} min` : "Actualizado cada 15 min" },
  }[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-muted"
      title={status === "offline" ? "Los precios en vivo no están disponibles. Se muestran los del servidor." : undefined}
    >
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.text}
    </span>
  );
}

/**
 * Aviso visible cuando los precios en vivo no llegan (Binance bloqueado en algunos países, red corporativa, etc.)
 * o cuando los datos del servidor quedaron viejos (más de 1 hora). Se puede cerrar.
 */
export function LiveNotice() {
  const { status, updatedAt } = useLiveStatus();
  const age = useAgeMinutes(updatedAt);
  const [closed, setClosed] = useState(false);
  const stale = age > 60;
  if (closed || (status !== "offline" && !stale)) return null;
  return (
    <div role="status" className="border-b border-warn/30 bg-warn/10 text-warn">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-xs sm:text-sm">
        <span aria-hidden>⚠</span>
        <p className="flex-1 text-fg/90">
          {stale
            ? `Los precios pueden estar desactualizados: la última actualización fue hace ${age >= 120 ? `${Math.floor(age / 60)} horas` : `${age} minutos`}.`
            : `Los precios en vivo no están disponibles desde tu conexión. Te mostramos los de hace ${age || "menos de 15"} minutos, que se actualizan solos.`}
        </p>
        <button onClick={() => setClosed(true)} className="rounded-md px-2 py-1 text-muted hover:bg-white/5 hover:text-fg" aria-label="Cerrar aviso">
          ✕
        </button>
      </div>
    </div>
  );
}
