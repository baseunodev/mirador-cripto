"use client";
// Precios en vivo desde el navegador con el WebSocket público de datos de Binance (solo lectura, sin clave).
// No gasta el cupo de CoinGecko: el servidor da el primer valor y el WebSocket lo va actualizando.
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { pct, price as fmtPrice } from "@/lib/format";

type Tick = { price: number; change: number };
const LiveCtx = createContext<Record<string, Tick>>({});

// Solo pares que existen en Binance contra USDT (las stablecoins quedan afuera: valen ~1 siempre).
const BINANCE = new Set(
  "btc eth bnb sol xrp doge ada trx avax link dot ton shib ltc bch near uni apt icp etc pepe sui xlm hbar fil arb op atom inj aave pol render fet wld sei tia stx imx grt algo ena ondo jup bonk wif floki vet mkr rune ldo sand mana axs crv".split(" "),
);
export const liveSymbol = (symbol: string) => (BINANCE.has(symbol.toLowerCase()) ? `${symbol.toLowerCase()}usdt` : null);

export function LiveProvider({ symbols, children }: { symbols: string[]; children: React.ReactNode }) {
  const [ticks, setTicks] = useState<Record<string, Tick>>({});
  const key = symbols.join(",");

  useEffect(() => {
    const streams = key
      .split(",")
      .map(liveSymbol)
      .filter(Boolean)
      .map((s) => `${s}@miniTicker`);
    if (!streams.length) return;
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;
    let buffer: Record<string, Tick> = {};
    // Se agrupan las actualizaciones cada 1,5 s para no re-renderizar en cada mensaje.
    const flush = setInterval(() => {
      if (Object.keys(buffer).length) {
        const b = buffer;
        buffer = {};
        setTicks((t) => ({ ...t, ...b }));
      }
    }, 1500);
    const connect = () => {
      try {
        ws = new WebSocket(`wss://data-stream.binance.vision/stream?streams=${streams.join("/")}`);
        ws.onmessage = (ev) => {
          const d = JSON.parse(ev.data)?.data;
          if (!d?.s) return;
          const c = Number(d.c);
          const o = Number(d.o);
          buffer[d.s.toLowerCase()] = { price: c, change: o ? ((c - o) / o) * 100 : 0 };
        };
        ws.onclose = () => {
          if (!closed) retry = setTimeout(connect, 5000);
        };
      } catch {
        // Sin WebSocket (navegador viejo o bloqueado): quedan los precios del servidor.
      }
    };
    connect();
    return () => {
      closed = true;
      clearInterval(flush);
      clearTimeout(retry);
      ws?.close();
    };
  }, [key]);

  return <LiveCtx.Provider value={ticks}>{children}</LiveCtx.Provider>;
}

export function useLive(symbol: string): Tick | undefined {
  const ticks = useContext(LiveCtx);
  const s = liveSymbol(symbol);
  return s ? ticks[s] : undefined;
}

export function useIsLive() {
  return Object.keys(useContext(LiveCtx)).length > 0;
}

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

export function LiveBadge() {
  const live = useIsLive();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-muted">
      <span className={`h-2 w-2 rounded-full ${live ? "live-dot bg-up" : "bg-muted"}`} />
      {live ? "En vivo" : "Actualizado cada 15 min"}
    </span>
  );
}
