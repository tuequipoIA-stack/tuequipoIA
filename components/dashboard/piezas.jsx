"use client";

import { ArrowRight } from "lucide-react";
import { C, tint } from "@/lib/theme";

// Piezas visuales del Dashboard (tarjetas, filas, etiquetas, barras).

export const TEAL = "#1AABAA";

export const kmoney = (n) => {
  const v = Math.round(Number(n) || 0);
  const a = Math.abs(v);
  const s = v < 0 ? "−" : "";
  if (a >= 1e6) return `${s}$ ${(a / 1e6).toFixed(1).replace(".", ",")}M`;
  if (a >= 1e4) return `${s}$ ${Math.round(a / 1000)}k`;
  return `${s}$ ${a.toLocaleString("es-AR")}`;
};

export const CSS = `
.dsh-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-bottom:16px}
.dsh-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}
.dsh-c4{grid-column:span 4}.dsh-c5{grid-column:span 5}.dsh-c6{grid-column:span 6}.dsh-c7{grid-column:span 7}.dsh-c8{grid-column:span 8}.dsh-c12{grid-column:span 12}
.dsh-split{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px}
.dsh-kpi{cursor:pointer;text-align:left}
.dsh-kpi:hover{border-color:#c9bfa8 !important}
.dsh-link:hover{text-decoration:underline}
.dsh-row{display:flex;align-items:center;gap:9px;padding:8px 0;border-top:1px solid ${C.line};font-size:13px;min-width:0}
.dsh-row:first-child{border-top:none;padding-top:0}
.dsh-tx{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsh-click{cursor:pointer}
.dsh-click:hover .dsh-tx{text-decoration:underline}
.dsh-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#1A1A2E;color:#F4F1EC;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;z-index:80}
@media (max-width:1180px){.dsh-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.dsh-c4,.dsh-c5,.dsh-c7,.dsh-c8{grid-column:span 6}}
@media (max-width:820px){.dsh-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.dsh-c4,.dsh-c5,.dsh-c6,.dsh-c7,.dsh-c8{grid-column:span 12}.dsh-split{grid-template-columns:1fr}.dsh-hide-sm{display:none !important}}
`;

export function Card({ className = "", icon: Icon, titulo, ir, irLabel, children }) {
  return (
    <div className={`${className} flex flex-col min-w-0`}
      style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 16px" }}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="flex items-center gap-2 font-bold" style={{ fontSize: 14, color: C.ink, margin: 0 }}>
          <span className="inline-flex items-center justify-center" style={{ width: 24, height: 24, borderRadius: 7, background: C.panel }}>
            <Icon size={14} color={C.muted} />
          </span>
          {titulo}
        </h3>
        {ir && (
          <button onClick={ir} className="dsh-link flex items-center gap-1 font-bold whitespace-nowrap" style={{ fontSize: 12, color: C.tealDark }}>
            {irLabel} <ArrowRight size={12} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function MiniK({ items }) {
  return (
    <div className="flex flex-wrap mb-3" style={{ gap: 14 }}>
      {items.map((it, i) => (
        <div key={i} style={{ fontSize: 11, color: C.soft, fontWeight: 600 }}>
          <span className="flex items-center gap-1">
            {it.color && <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: it.color }} />}
            {it.l}
          </span>
          <b className="block" style={{ fontSize: 17, color: C.ink }}>{it.v}</b>
        </div>
      ))}
    </div>
  );
}

export function SubH({ children, style }) {
  return (
    <div className="uppercase font-bold" style={{ fontSize: 10.5, letterSpacing: ".05em", color: C.soft, margin: "2px 0 6px", ...style }}>
      {children}
    </div>
  );
}

export function Vacio({ children, ir, irLabel }) {
  return (
    <div style={{ fontSize: 12.5, color: C.soft, padding: "6px 0" }}>
      {children}
      {ir && (
        <>
          {" "}
          <button onClick={ir} className="dsh-link font-bold" style={{ color: C.tealDark }}>{irLabel} →</button>
        </>
      )}
    </div>
  );
}

export function Num({ n }) {
  return (
    <span className="shrink-0" style={{ fontWeight: 800, fontSize: 11, color: C.muted, background: C.chip, borderRadius: 6, padding: "2px 6px" }}>
      #{n}
    </span>
  );
}

export function Tag({ empresa }) {
  if (!empresa) {
    return (
      <span className="dsh-hide-sm inline-flex items-center shrink-0 whitespace-nowrap font-bold" style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: C.chip, color: C.soft }}>
        Sin empresa
      </span>
    );
  }
  return (
    <span className="dsh-hide-sm inline-flex items-center gap-1 shrink-0 whitespace-nowrap font-bold"
      style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: tint(empresa.color, 0.13), color: empresa.color }}>
      ● {empresa.nombre}
    </span>
  );
}

export const PILL = {
  hoy: { background: "#d9e5f1", color: "#335f8f" },
  venc: { background: "#f0d6d3", color: "#9b3c35" },
  sem: { background: "#f1e1c8", color: "#a8732f" },
  ok: { background: "#d9eadc", color: "#2f7a45" },
  mes: { background: tint(TEAL, 0.15), color: C.tealDark },
};

export function Pill({ tipo = "sem", style, children }) {
  return (
    <span className="shrink-0 whitespace-nowrap font-bold" style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, ...PILL[tipo], ...style }}>
      {children}
    </span>
  );
}

export function Prog({ pct, color, width = 80 }) {
  return (
    <div className="shrink-0 overflow-hidden" style={{ height: 7, background: C.chip, borderRadius: 4, width }}>
      <div style={{ height: "100%", borderRadius: 4, width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

// Barras apiladas. cols: [{ key, label, total, totLabel, partes:[{color,valor,title}], fut, act }]
export function Barras({ cols, alto = 120, maxBarra = 92 }) {
  const mx = Math.max(1, ...cols.map((c) => c.partes.reduce((a, p) => a + Math.max(0, p.valor), 0)));
  return (
    <div className="flex items-end" style={{ gap: 8, height: alto, marginTop: 4 }}>
      {cols.map((c) => (
        <div key={c.key} className="flex-1 flex flex-col items-center justify-end min-w-0" style={{ gap: 4, height: "100%" }}>
          <span className="whitespace-nowrap font-bold" style={{ fontSize: 10, color: C.muted }}>{c.totLabel}</span>
          <div className="w-full flex flex-col-reverse overflow-hidden" style={{ maxWidth: 38, borderRadius: 5, minHeight: 2, opacity: c.fut ? 0.55 : 1, background: c.partes.some((p) => p.valor > 0) ? "transparent" : C.chip }}>
            {c.partes.filter((p) => p.valor > 0).map((p, i) => (
              <div key={i} title={p.title} style={{ height: (p.valor / mx) * maxBarra, background: p.color }} />
            ))}
          </div>
          <small className="whitespace-nowrap" style={{ fontSize: 10, color: c.act ? C.ink : C.soft, fontWeight: c.act ? 800 : 600 }}>{c.label}</small>
        </div>
      ))}
    </div>
  );
}
