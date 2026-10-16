"use client";

import { C } from "@/lib/theme";
import { ETAPAS } from "./comun";

export function EtapaPill({ etapa }) {
  const e = ETAPAS[etapa] || ETAPAS.calificado;
  return (
    <span className="inline-block whitespace-nowrap rounded-full" style={{ background: e.bg, color: e.fg, fontSize: 10.5, fontWeight: 700, padding: "3px 9px" }}>
      {e.l}
    </span>
  );
}

export function NumChip({ num, style }) {
  return (
    <span className="text-center rounded-[7px]" style={{ fontWeight: 800, fontSize: 13, color: C.muted, background: C.chip, padding: "3px 0", fontVariantNumeric: "tabular-nums", ...style }}>
      #{num}
    </span>
  );
}

export function Kpi({ label, valor, style }) {
  return (
    <div className="rounded-xl" style={{ background: C.card, border: `1px solid ${C.line}`, padding: "12px 14px" }}>
      <span className="block mb-0.5" style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}</span>
      <b style={{ fontSize: 22, color: C.ink, ...style }}>{valor}</b>
    </div>
  );
}

export function Dot({ color, size = 8 }) {
  return <span className="inline-block rounded-full shrink-0" style={{ width: size, height: size, background: color }} />;
}

export function Bloque({ titulo, accion, onAccion, children }) {
  return (
    <div className="rounded-xl" style={{ background: C.card, border: `1px solid ${C.line}`, padding: "14px 16px" }}>
      <div className="flex justify-between items-center mb-2.5">
        <span className="uppercase" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", color: C.muted }}>{titulo}</span>
        {accion && <button onClick={onAccion} style={{ fontSize: 12, fontWeight: 700, color: C.tealDark }}>{accion}</button>}
      </div>
      {children}
    </div>
  );
}

export function FormBox({ children, style }) {
  return (
    <div className="flex flex-col gap-2 mt-2.5 rounded-[10px] p-2.5" style={{ background: C.panel, border: `1px dashed ${C.line}`, ...style }}>
      {children}
    </div>
  );
}

export function Hint({ children, style }) {
  return <div style={{ fontSize: 11, color: C.soft, ...style }}>{children}</div>;
}
