"use client";
import { useState } from "react";

const parse = (s: string) => Number(s.replace(/\./g, "").replace(",", ".")) || 0;
const fmt = (n: number) => {
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 8;
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: digits }).format(n);
};

/** Calculadora en los dos sentidos: cripto → moneda local y moneda local → cripto. */
export function Converter({ unitPrice, coinSymbol, fiatSymbol, fiatName }: { unitPrice: number; coinSymbol: string; fiatSymbol: string; fiatName: string }) {
  const [coin, setCoin] = useState("1");
  const [fiat, setFiat] = useState(fmt(unitPrice));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="text-sm text-muted">{coinSymbol}</span>
        <input
          inputMode="decimal"
          value={coin}
          onChange={(e) => {
            setCoin(e.target.value);
            setFiat(fmt(parse(e.target.value) * unitPrice));
          }}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-3 text-xl font-bold tabular-nums outline-none focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="text-sm text-muted">
          {fiatSymbol} ({fiatName})
        </span>
        <input
          inputMode="decimal"
          value={fiat}
          onChange={(e) => {
            setFiat(e.target.value);
            setCoin(fmt(parse(e.target.value) / unitPrice));
          }}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-3 text-xl font-bold tabular-nums outline-none focus:border-brand"
        />
      </label>
    </div>
  );
}
