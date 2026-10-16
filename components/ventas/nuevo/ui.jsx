"use client";

import { C } from "@/lib/theme";

// Estilos compartidos de Ventas (tablas, pills, barras de avance, flash).
export function EstilosVentas() {
  return (
    <style>{`
      .vt-tabla{background:${C.card};border:1px solid ${C.line};border-radius:12px;overflow-x:auto}
      .vt-tabla table{width:100%;border-collapse:collapse;font-size:13px;min-width:720px;color:${C.ink}}
      .vt-tabla th{font-size:10px;text-transform:uppercase;letter-spacing:.05em;font-weight:700;color:${C.soft};background:${C.panel};text-align:left;padding:9px 12px;white-space:nowrap}
      .vt-tabla td{padding:10px 12px;border-top:1px solid ${C.line};vertical-align:middle}
      .vt-tabla td.r,.vt-tabla th.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
      .vt-tabla tr.click{cursor:pointer}
      .vt-tabla tr.click:hover td{background:#efe8da}
      .vt-tabla tfoot td{font-weight:800;background:${C.panel}}
      .vt-cli b{display:block}
      .vt-cli small{color:${C.soft};font-size:12px}
      .vt-verde{color:${C.ok};font-weight:700}
      .vt-rojo{color:${C.danger};font-weight:700}
      .vt-prog{height:8px;background:${C.chip};border-radius:4px;overflow:hidden;min-width:90px}
      .vt-prog div{height:100%;border-radius:4px}
      @keyframes vt-flash{0%{background:#cfeeed}100%{background:transparent}}
      .vt-tabla tr.vt-flash td{animation:vt-flash 2s ease}
      .vt-inp{border:1px solid ${C.line};background:${C.panel};border-radius:6px;padding:5px 7px;font-size:12.5px;outline:none;width:100%;color:${C.ink};min-width:0}
    `}</style>
  );
}

export const PILL = {
  ok: { background: "#d9eadc", color: "#2f7a45" },
  pend: { background: "#f1e1c8", color: "#9a6421" },
  plan: { background: "#e3e9f5", color: "#3b5d99" },
  atr: { background: "#f0d6d3", color: "#9b3c35" },
  curso: { background: "#d6efee", color: "#127a79" },
};

export function Pill({ tipo, children }) {
  return (
    <span className="inline-block whitespace-nowrap rounded-full font-bold" style={{ fontSize: 10.5, padding: "3px 9px", ...PILL[tipo] }}>
      {children}
    </span>
  );
}

export function NumBadge({ n }) {
  return (
    <span className="inline-block font-extrabold" style={{ fontSize: 12, color: C.muted, background: C.chip, borderRadius: 7, padding: "3px 7px" }}>
      #{n}
    </span>
  );
}

export function Kpi({ label, children, sub }) {
  return (
    <div className="rounded-xl px-3.5 py-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <span className="block text-[11px] font-semibold mb-0.5" style={{ color: C.muted }}>{label}</span>
      <div className="font-bold" style={{ color: C.ink, fontSize: 16 }}>{children}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: C.soft }}>{sub}</div>}
    </div>
  );
}

export function ReglaTag({ children }) {
  return (
    <span className="text-[11px] font-semibold rounded-full" style={{ background: C.card, border: `1px solid ${C.line}`, padding: "3px 10px", color: C.muted }}>
      {children}
    </span>
  );
}

// Input sin control: guarda al salir del campo o con Enter. Se re-monta
// cuando cambia el valor guardado (key), así siempre muestra lo último.
export function InputDiferido({ value, onCommit, type = "text", className = "vt-inp", style, ...rest }) {
  const commit = (ev) => {
    const v = ev.target.value;
    if (String(v) !== String(value ?? "")) onCommit(v);
  };
  return (
    <input key={String(value ?? "")} type={type} defaultValue={value ?? ""} onBlur={commit}
      onKeyDown={(ev) => { if (ev.key === "Enter") ev.currentTarget.blur(); }}
      className={className} style={style} {...rest} />
  );
}

export function Bloque({ titulo, accion, children }) {
  return (
    <div className="rounded-xl px-4 py-3.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex justify-between items-center gap-2 mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: C.muted }}>{titulo}</span>
        {accion}
      </div>
      {children}
    </div>
  );
}

export function BotonAdd({ onClick, children }) {
  return (
    <button onClick={onClick} className="text-xs font-bold shrink-0" style={{ color: C.tealDark }}>{children}</button>
  );
}

export function Resumen({ filas }) {
  return (
    <div className="grid rounded-[10px] mt-2.5 text-[13px]" style={{ gridTemplateColumns: "1fr auto", gap: "5px 14px", background: C.panel, padding: "10px 12px", color: C.ink }}>
      {filas.map(([l, v, extra = {}], i) => (
        <div key={i} className="contents">
          <span style={extra.tot ? { fontWeight: 800, borderTop: `1px solid ${C.line}`, paddingTop: 5 } : undefined}>{l}</span>
          <span className="text-right font-semibold" style={{ fontVariantNumeric: "tabular-nums", color: extra.color, ...(extra.tot ? { fontWeight: 800, borderTop: `1px solid ${C.line}`, paddingTop: 5 } : {}) }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export function Hint({ children, className = "", style }) {
  return <div className={`text-[11.5px] leading-snug ${className}`} style={{ color: C.soft, ...style }}>{children}</div>;
}
