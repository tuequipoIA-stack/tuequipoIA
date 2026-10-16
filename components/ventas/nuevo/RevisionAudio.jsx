"use client";

import { C } from "@/lib/theme";
import { fechaCorta, mesCorto } from "@/lib/fechas";
import { ESTADOS_HITO, money, num, movimientos, agDe } from "./calculos";
import { NumBadge } from "./ui";

const K = { hito: "Hito", fecha: "Nueva fecha", horas: "Horas", cuota: "Cuota cobrada", pago: "Comisión cobrada", ejec: "Ejecutado", cobro: "Cobro" };
const ctl = { border: `1px solid ${C.line}`, background: C.panel, borderRadius: 6, padding: "5px 8px", fontSize: 12.5, outline: "none", flex: 1, minWidth: 110, color: C.ink };
const corto = { ...ctl, flex: "0 0 80px", minWidth: 0 };
const sp = { fontSize: 12, color: C.muted };

export const contarCambiosVentas = (prop) =>
  Array.isArray(prop) ? prop.reduce((a, x) => a + (x.cambios || []).filter((c) => c.on).length, 0) : 0;

// Revisión editable de lo que entendió el audio, agrupado por proyecto.
export default function RevisionAudio({ propuesta, setPropuesta, proyectos, porId }) {
  const lista = Array.isArray(propuesta) ? propuesta : [];
  const editar = (pi, ci, cambios) =>
    setPropuesta(lista.map((x, i) => (i !== pi ? x : { ...x, cambios: x.cambios.map((c, j) => (j === ci ? { ...c, ...cambios } : c)) })));

  return (
    <>
      {lista.map((x, pi) => {
        const p = proyectos.find((q) => Number(q.num) === Number(x.num));
        if (!p || !Array.isArray(x.cambios)) return null;
        const e = porId(p.empresa);
        const hitosOpt = p.hitos.map((h, i) => <option key={i} value={i}>{h.n}</option>);
        return (
          <div key={pi} className="rounded-[10px] px-3 py-2.5 mt-2.5" style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `4px solid ${e?.color || C.line}` }}>
            <h4 className="flex flex-wrap items-center gap-2 text-sm font-bold mb-2" style={{ color: C.ink }}>
              <NumBadge n={p.num} />{p.cliente}
              <span style={{ fontSize: 11, color: C.soft, fontWeight: 600 }}>{e?.nombre || "Sin empresa"}</span>
            </h4>
            {x.cambios.map((c, ci) => {
              const set = (k, v) => editar(pi, ci, { [k]: v });
              let v = null;
              if (c.tipo === "hito") {
                v = (
                  <>
                    <select value={c.hi} onChange={(ev) => set("hi", +ev.target.value)} style={ctl}>{hitosOpt}</select>
                    <span style={sp}>→</span>
                    <select value={c.e} onChange={(ev) => set("e", ev.target.value)} style={ctl}>
                      {Object.entries(ESTADOS_HITO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </>
                );
              } else if (c.tipo === "fecha") {
                v = (
                  <>
                    <select value={c.hi} onChange={(ev) => set("hi", +ev.target.value)} style={ctl}>{hitosOpt}</select>
                    <span style={sp}>{fechaCorta(p.hitos[c.hi]?.f)} →</span>
                    <input type="date" value={c.f || ""} onChange={(ev) => set("f", ev.target.value)} style={{ ...ctl, flex: "0 0 140px" }} />
                  </>
                );
              } else if (c.tipo === "horas") {
                v = (
                  <>
                    <input type="number" value={c.h} onChange={(ev) => set("h", num(ev.target.value))} style={corto} />
                    <span style={sp}>h</span>
                    <input value={c.d || ""} onChange={(ev) => set("d", ev.target.value)} style={ctl} />
                  </>
                );
              } else if (c.tipo === "cuota") {
                const ms = movimientos(p, e);
                const opts = ms.some((m) => m.mes === c.mes) ? ms : [...ms, { mes: c.mes, i: -1 }];
                v = (
                  <>
                    <select value={c.mes} onChange={(ev) => set("mes", ev.target.value)} style={ctl}>
                      {opts.map((m) => <option key={m.mes} value={m.mes}>{m.i >= 0 ? `Cuota ${m.i + 1}/${p.cuotas} · ` : ""}{mesCorto(m.mes)}</option>)}
                    </select>
                    <span style={sp}>tu comisión {money((p.venta / (p.cuotas || 1)) * num(e?.pct) / 100, p.moneda)}</span>
                  </>
                );
              } else if (c.tipo === "pago") {
                const ej = p.ejecucion || [];
                const opts = ej.some((y) => y.mes === c.ejecMes) ? ej : [...ej, { mes: c.ejecMes, monto: 0 }];
                const monto = (ej.find((y) => y.mes === c.ejecMes)?.monto || 0) * (1 - agDe(p, e) / 100) * num(e?.pct) / 100;
                v = (
                  <>
                    <span style={sp}>De lo ejecutado en</span>
                    <select value={c.ejecMes} onChange={(ev) => set("ejecMes", ev.target.value)} style={ctl}>
                      {opts.map((y) => <option key={y.mes} value={y.mes}>{mesCorto(y.mes)}</option>)}
                    </select>
                    <span style={sp}>{money(monto, p.moneda)}</span>
                  </>
                );
              } else if (c.tipo === "ejec") {
                const prev = (p.ejecucion || []).find((y) => y.mes === c.mes);
                v = (
                  <>
                    <span style={sp}>{c.mes ? mesCorto(c.mes) : ""}</span>
                    <input type="number" value={c.monto} onChange={(ev) => set("monto", num(ev.target.value))} style={{ ...corto, flex: "0 0 100px" }} />
                    <span style={sp}>{p.moneda === "USD" ? "USD" : "$"} {prev ? `(antes ${prev.monto.toLocaleString("es-AR")})` : "(mes nuevo)"}</span>
                  </>
                );
              } else if (c.tipo === "cobro") {
                v = (
                  <select value={c.idx} onChange={(ev) => set("idx", +ev.target.value)} style={ctl}>
                    {(p.cobros || []).map((y, i) => <option key={i} value={i}>{mesCorto(y.mes)} · {money(y.monto, p.moneda)}</option>)}
                  </select>
                );
              }
              return (
                <div key={ci} className="flex items-start gap-2 py-1.5 text-[13px]" style={{ borderTop: ci ? `1px solid ${C.line}` : "none" }}>
                  <input type="checkbox" checked={!!c.on} onChange={(ev) => set("on", ev.target.checked)} style={{ marginTop: 4, accentColor: "#1AABAA" }} />
                  <span className="uppercase font-extrabold" style={{ fontSize: 10, color: C.soft, minWidth: 92, marginTop: 4 }}>{K[c.tipo] || c.tipo}</span>
                  <span className="flex-1 flex flex-wrap items-center gap-1.5">{v}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
