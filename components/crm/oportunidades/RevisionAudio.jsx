"use client";

import { C } from "@/lib/theme";
import { ETAPAS, ETAPAS_ORDEN, CANALES, SIN_EMPRESA, enCurso } from "./comun";
import { NumChip } from "./Piezas";

const K = { conv: "Conversación", etapa: "Etapa", proximo: "Próx. contacto", tarea: "Tarea" };
const campo = { border: `1px solid ${C.line}`, background: C.panel, borderRadius: 6, padding: "5px 8px", fontSize: 12.5, outline: "none", flex: 1, minWidth: 120, color: C.ink };

// Revisión editable de lo que se interpretó del audio (una tarjeta por oportunidad).
export default function RevisionAudio({ propuesta, setPropuesta, ops, porId }) {
  const upd = (pi, fn) => setPropuesta(propuesta.map((p, i) => (i === pi ? fn(p) : p)));
  const updC = (pi, ci, cambios) => upd(pi, (p) => ({ ...p, cambios: p.cambios.map((c, j) => (j === ci ? { ...c, ...cambios } : c)) }));

  return (
    <div>
      {propuesta.map((p, pi) => {
        const o = ops.find((x) => x.num === p.num);
        const e = o ? porId(o.empresa) || SIN_EMPRESA : null;
        return (
          <div key={pi} className="rounded-[10px] mt-2.5" style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `4px solid ${e ? e.color : C.line}`, padding: "10px 12px" }}>
            <h4 className="flex gap-2 items-center flex-wrap mb-2" style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
              {o ? (
                <>
                  <NumChip num={o.num} style={{ padding: "2px 7px" }} />
                  {o.cliente}
                  <span style={{ fontSize: 11, color: C.soft, fontWeight: 600 }}>{e.nombre}</span>
                </>
              ) : (
                <>
                  <span style={{ color: C.danger }}>No identifiqué la oportunidad</span>
                  <select value="" onChange={(ev) => upd(pi, (x) => ({ ...x, num: +ev.target.value || null }))}
                    style={{ ...campo, flex: "0 1 auto", fontWeight: 600 }}>
                    <option value="">Elegí…</option>
                    {ops.filter(enCurso).map((x) => <option key={x.num} value={x.num}>#{x.num} {x.cliente}</option>)}
                  </select>
                </>
              )}
            </h4>
            {p.cambios.map((c, ci) => (
              <div key={ci} className="flex gap-2 items-start text-[13px]" style={{ padding: "7px 0", borderTop: ci === 0 ? "none" : `1px solid ${C.line}` }}>
                <input type="checkbox" checked={c.on !== false} onChange={(ev) => updC(pi, ci, { on: ev.target.checked })} style={{ marginTop: 3, accentColor: "#1AABAA" }} />
                <span className="uppercase" style={{ fontSize: 10, fontWeight: 800, color: C.soft, minWidth: 84, marginTop: 3 }}>{K[c.tipo] || c.tipo}</span>
                <span className="flex-1 flex gap-1.5 flex-wrap items-center">
                  {c.tipo === "conv" && (
                    <>
                      <select value={c.c || "Llamada"} onChange={(ev) => updC(pi, ci, { c: ev.target.value })} style={{ ...campo, flex: "0 0 120px", minWidth: 0 }}>
                        {CANALES.map((x) => <option key={x}>{x}</option>)}
                      </select>
                      <input value={c.r || ""} onChange={(ev) => updC(pi, ci, { r: ev.target.value })} style={campo} />
                    </>
                  )}
                  {c.tipo === "etapa" && (
                    <>
                      <span style={{ fontSize: 12.5, color: C.ink }}>{o ? ETAPAS[o.etapa]?.l : "—"} →</span>
                      <select value={c.e} onChange={(ev) => updC(pi, ci, { e: ev.target.value })} style={campo}>
                        {ETAPAS_ORDEN.map((k) => <option key={k} value={k}>{ETAPAS[k].l}</option>)}
                      </select>
                    </>
                  )}
                  {c.tipo === "proximo" && (
                    <>
                      <input type="date" value={c.f || ""} onChange={(ev) => updC(pi, ci, { f: ev.target.value })} style={{ ...campo, flex: "0 0 140px", minWidth: 0 }} />
                      <input value={c.m || ""} onChange={(ev) => updC(pi, ci, { m: ev.target.value })} style={campo} />
                    </>
                  )}
                  {c.tipo === "tarea" && (
                    <>
                      <input value={c.t || ""} onChange={(ev) => updC(pi, ci, { t: ev.target.value })} style={campo} />
                      <select value={c.c === "hoy" ? "hoy" : "semana"} onChange={(ev) => updC(pi, ci, { c: ev.target.value })} style={{ ...campo, flex: "0 0 120px", minWidth: 0 }}>
                        <option value="semana">Esta semana</option>
                        <option value="hoy">Hoy</option>
                      </select>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
