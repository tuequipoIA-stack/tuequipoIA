"use client";

import { X } from "lucide-react";
import { C } from "@/lib/theme";
import { hoyISO, fechaCorta } from "@/lib/fechas";
import { InputDiferido } from "@/components/ventas/nuevo/ui";
import { normalizarCV, resumenCV, estadoCV, ESTADO_CV_LABEL } from "@/lib/compraventa";

const num = (v) => {
  const x = parseFloat(String(v ?? "").replace(",", "."));
  return isNaN(x) ? 0 : x;
};
const money = (v) => "$ " + Math.round(v || 0).toLocaleString("es-AR");
const pct = (v) => (v == null ? "—" : `${Math.round(v)}%`);
const diasTxt = (d) => (d == null ? "—" : `${d} ${d === 1 ? "día" : "días"}`);

const inp = { border: `1px solid ${C.line}`, background: C.panel, borderRadius: 6, padding: "5px 7px", fontSize: 12.5, outline: "none", width: "100%", color: C.ink, minWidth: 0 };
const lbl = { fontSize: 11, fontWeight: 700, color: C.muted, display: "block" };
const sub = { fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: C.soft, margin: "12px 0 6px" };

function Campo({ label, children, style }) {
  return (
    <label style={{ ...lbl, ...style }}>
      {label}
      <div style={{ marginTop: 3 }}>{children}</div>
    </label>
  );
}

// Línea de tiempo: compra → arreglo → a la venta → vendido
function Linea({ cv, r }) {
  const pasos = [
    { l: "Compra", f: cv.compra.f, ok: !!cv.compra.f },
    { l: "Arreglo", f: cv.arreglos.map((a) => a.f).filter(Boolean).sort()[0] || "", ok: cv.arreglos.length > 0, d: r.diasArreglo },
    { l: "A la venta", f: cv.listo, ok: !!cv.listo, d: r.diasVenta },
    { l: "Vendido", f: cv.venta.f, ok: !!cv.venta.f },
  ];
  return (
    <div className="flex items-start" style={{ gap: 4, margin: "2px 0 4px" }}>
      {pasos.map((p, i) => (
        <div key={p.l} className="flex-1 min-w-0 text-center">
          <div className="flex items-center">
            <div style={{ flex: 1, height: 2, background: i === 0 ? "transparent" : p.ok ? "#1AABAA" : C.line }} />
            <span style={{ width: 12, height: 12, borderRadius: 99, flex: "0 0 12px", border: `2px solid ${p.ok ? "#1AABAA" : C.line}`, background: p.ok ? "#1AABAA" : "transparent" }} />
            <div style={{ flex: 1, height: 2, background: i === pasos.length - 1 ? "transparent" : pasos[i + 1].ok ? "#1AABAA" : C.line }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: p.ok ? C.ink : C.soft, marginTop: 3 }}>{p.l}</div>
          <div style={{ fontSize: 10.5, color: C.soft }}>{p.f ? fechaCorta(p.f) : "—"}</div>
        </div>
      ))}
    </div>
  );
}

// Editor de compra · arreglos · venta. Se usa en el CRM y en Ventas.
// onCambiar recibe el cv completo actualizado.
export default function EditorCompraventa({ cv: crudo, onCambiar }) {
  const cv = normalizarCV(crudo);
  const r = resumenCV(cv);
  const set = (cambios) => onCambiar({ ...cv, ...cambios });
  const setCompra = (c) => set({ compra: { ...cv.compra, ...c } });
  const setVenta = (c) => set({ venta: { ...cv.venta, ...c } });
  const setArreglo = (i, c) => set({ arreglos: cv.arreglos.map((a, j) => (j === i ? { ...a, ...c } : a)) });
  const estado = estadoCV(cv);

  return (
    <div style={{ color: C.ink }}>
      <Linea cv={cv} r={r} />

      <div style={sub}>1 · Compra</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))" }}>
        <Campo label="Fecha de compra">
          <input type="date" value={cv.compra.f} onChange={(e) => setCompra({ f: e.target.value })} style={inp} />
        </Campo>
        <Campo label="Precio de compra ($)">
          <InputDiferido type="number" value={cv.compra.monto || ""} onCommit={(v) => setCompra({ monto: num(v) })} className="" style={inp} placeholder="0" />
        </Campo>
        <Campo label="Se lo compré a">
          <InputDiferido value={cv.compra.de} onCommit={(v) => setCompra({ de: v })} className="" style={inp} placeholder="Opcional" />
        </Campo>
      </div>

      <div className="flex justify-between items-center" style={sub}>
        <span>2 · Arreglos {cv.arreglos.length ? `· ${money(r.arreglos)}` : ""}</span>
        <button onClick={() => set({ arreglos: [...cv.arreglos, { f: hoyISO(), d: "", m: 0 }] })}
          style={{ fontSize: 12, fontWeight: 700, color: C.tealDark, textTransform: "none", letterSpacing: 0 }}>+ Arreglo</button>
      </div>
      {cv.arreglos.map((a, i) => (
        <div key={i} className="grid items-center gap-1.5 mb-1.5" style={{ gridTemplateColumns: "128px 1fr 104px 18px" }}>
          <input type="date" value={a.f} onChange={(e) => setArreglo(i, { f: e.target.value })} style={inp} />
          <InputDiferido value={a.d} onCommit={(v) => setArreglo(i, { d: v })} className="" style={inp} placeholder="Qué se hizo (repuesto, mano de obra…)" />
          <InputDiferido type="number" value={a.m || ""} onCommit={(v) => setArreglo(i, { m: num(v) })} className="" style={inp} placeholder="Costo $" />
          <button title="Quitar" onClick={() => set({ arreglos: cv.arreglos.filter((_, j) => j !== i) })} style={{ color: C.soft }}><X size={13} /></button>
        </div>
      ))}
      {!cv.arreglos.length && <div style={{ fontSize: 11.5, color: C.soft }}>Sin arreglos cargados. Cargá cada gasto con su fecha.</div>}
      <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))" }}>
        <Campo label="Listo / publicado a la venta">
          <input type="date" value={cv.listo} onChange={(e) => set({ listo: e.target.value })} style={inp} />
        </Campo>
        <Campo label="Precio objetivo de venta ($)">
          <InputDiferido type="number" value={cv.objetivo || ""} onCommit={(v) => set({ objetivo: num(v) })} className="" style={inp} placeholder="0" />
        </Campo>
      </div>

      <div style={sub}>3 · Venta</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))" }}>
        <Campo label="Fecha de venta">
          <input type="date" value={cv.venta.f} onChange={(e) => setVenta({ f: e.target.value })} style={inp} />
        </Campo>
        <Campo label="Precio de venta ($)">
          <InputDiferido type="number" value={cv.venta.monto || ""} onCommit={(v) => setVenta({ monto: num(v) })} className="" style={inp} placeholder="0" />
        </Campo>
        <Campo label="Se lo vendí a">
          <InputDiferido value={cv.venta.a} onCommit={(v) => setVenta({ a: v })} className="" style={inp} placeholder="Opcional" />
        </Campo>
      </div>
      {cv.venta.f && (
        <label className="flex items-center gap-2 mt-2" style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>
          <input type="checkbox" checked={cv.cobrado} onChange={(e) => set({ cobrado: e.target.checked })} style={{ width: 16, height: 16, accentColor: "#1AABAA" }} />
          Ya cobré la venta
        </label>
      )}

      <div className="grid rounded-[10px] mt-3 text-[13px]" style={{ gridTemplateColumns: "1fr auto", gap: "5px 14px", background: C.panel, padding: "10px 12px" }}>
        <span>Compra</span><span className="text-right font-semibold">{money(r.compra)}</span>
        <span>Arreglos</span><span className="text-right font-semibold">{money(r.arreglos)}</span>
        <span style={{ fontWeight: 700 }}>Inversión total</span><span className="text-right" style={{ fontWeight: 700, color: C.danger }}>− {money(r.inversion)}</span>
        <span>{r.vendido ? "Precio de venta" : "Precio objetivo (proyección)"}</span><span className="text-right font-semibold">{money(r.venta)}</span>
        <span style={{ fontWeight: 800, borderTop: `1px solid ${C.line}`, paddingTop: 5 }}>{r.vendido ? "Ganancia" : "Ganancia estimada"}</span>
        <span className="text-right" style={{ fontWeight: 800, borderTop: `1px solid ${C.line}`, paddingTop: 5, color: r.ganancia >= 0 ? C.ok : C.danger }}>{money(r.ganancia)}</span>
      </div>

      <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(118px,1fr))" }}>
        {[
          ["Margen s/ venta", pct(r.venta ? r.margen : null)],
          ["Retorno s/ inversión", pct(r.inversion ? r.roi : null)],
          ["Días en arreglo", diasTxt(r.diasArreglo)],
          ["Días a la venta", diasTxt(r.diasVenta)],
          [r.vendido ? "Días totales" : "Días invertido (hasta hoy)", diasTxt(r.diasTotal)],
          ["Ganancia por día", r.gananciaDia == null ? "—" : money(r.gananciaDia)],
          ["Retorno mensual", pct(r.inversion ? r.roiMensual : null)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg" style={{ background: C.card, border: `1px solid ${C.line}`, padding: "7px 9px" }}>
            <div style={{ fontSize: 10.5, color: C.soft, fontWeight: 600 }}>{l}</div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: C.soft, marginTop: 6 }}>
        Estado: <b style={{ color: C.ink }}>{ESTADO_CV_LABEL[estado]}</b>
        {!r.vendido && " · Hasta que cargues la venta, la ganancia y los días son una proyección con el precio objetivo y la fecha de hoy."}
      </div>
    </div>
  );
}
