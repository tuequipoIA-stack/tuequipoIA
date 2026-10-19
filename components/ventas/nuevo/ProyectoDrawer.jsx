"use client";

import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { C } from "@/lib/theme";
import { EmpresaTag } from "@/components/empresas/EmpresasUI";
import { relISO, hoyISO, diasHasta, fechaCorta, mesKey, mesSumar, mesCorto, mesLargo } from "@/lib/fechas";
import {
  ESTADOS_HITO, money, num, modeloDe, movimientos, resumenPropio, horasTot, agDe,
} from "./calculos";
import { NumBadge, InputDiferido, Bloque, BotonAdd, Resumen, Hint } from "./ui";
import EditorCompraventa from "@/components/compraventa/EditorCompraventa";

const HINT_HITOS = {
  propio: "Tu proceso: mockup → primer entregable en 1 semana → pruebas → entrega → 2 semanas de acompañamiento.",
  cuotas: "Kickoff → relevamiento → implementación → capacitación → go-live.",
  agencia: "Piezas → salida al aire → reportes mensuales → fin de campaña.",
};

const fila = (cols) => ({ display: "grid", gridTemplateColumns: cols, gap: 8, alignItems: "center", padding: "7px 0", borderTop: `1px solid ${C.line}`, fontSize: 13 });
const check = { width: 16, height: 16, accentColor: "#1AABAA" };

export default function ProyectoDrawer({ proyecto: p, empresa: e, onCambiar, onEliminar, onCerrar }) {
  const [formHora, setFormHora] = useState(false);
  const [hF, setHF] = useState(hoyISO());
  const [hH, setHH] = useState("");
  const [hD, setHD] = useState("");

  useEffect(() => {
    const k = (ev) => { if (ev.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onCerrar]);

  const modelo = modeloDe(e);
  const color = e?.color || C.soft;
  const pct = num(e?.pct);
  const hora = num(e?.hora);
  const set = (cambios) => onCambiar({ ...p, ...cambios });
  const setHito = (i, cambios) => set({ hitos: p.hitos.map((h, j) => (j === i ? { ...h, ...cambios } : h)) });

  const guardarHora = () => {
    const h = num(hH);
    if (!h) return;
    set({ horas: [...p.horas, { f: hF || hoyISO(), h, d: hD.trim() }] });
    setHH(""); setHD(""); setFormHora(false);
  };
  const horasOrden = p.horas.map((h, i) => ({ ...h, i })).sort((a, b) => String(b.f).localeCompare(String(a.f)));

  // ---- Bloque de finanzas según el modelo ----
  let fin = null;
  if (modelo === "cuotas") {
    const ms = movimientos(p, e);
    const toggle = (mes, on) => set({ cobradas: on ? [...new Set([...p.cobradas, mes])] : p.cobradas.filter((x) => x !== mes) });
    fin = (
      <Bloque titulo="Cuotas y tu comisión" accion={<span className="text-[11px] font-semibold rounded-full px-2.5 py-0.5" style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.muted }}>{pct}%</span>}>
        <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>
          <label className="text-[11px] font-semibold" style={{ color: C.muted }}>Venta ({p.moneda === "USD" ? "USD" : "$"})
            <InputDiferido type="number" value={p.venta} onCommit={(v) => set({ venta: num(v) })} style={{ marginTop: 3 }} />
          </label>
          <label className="text-[11px] font-semibold" style={{ color: C.muted }}>Cantidad de cuotas
            <InputDiferido type="number" min="1" value={p.cuotas} onCommit={(v) => set({ cuotas: Math.max(1, Math.round(num(v)) || 1) })} style={{ marginTop: 3 }} />
          </label>
          <label className="text-[11px] font-semibold" style={{ color: C.muted }}>Mes de inicio
            <InputDiferido type="month" value={p.inicio} onCommit={(v) => v && set({ inicio: v })} style={{ marginTop: 3 }} />
          </label>
        </div>
        <Hint className="mb-2">Venta {money(p.venta, p.moneda)} en {p.cuotas} cuotas desde {mesLargo(p.inicio)}. Tildá cada cuota cuando el cliente la paga.</Hint>
        {ms.map((m, i) => (
          <div key={m.mes} style={{ ...fila("22px 70px 1fr auto"), ...(i === 0 ? { borderTop: "none" } : {}) }}>
            <input type="checkbox" checked={m.ok} onChange={(ev) => toggle(m.mes, ev.target.checked)} style={check} />
            <b>{mesCorto(m.mes)}</b>
            <Hint>Cuota {m.i + 1}/{p.cuotas}: {money(m.cuotaCli, p.moneda)}</Hint>
            <span className="font-bold" style={{ color: m.ok ? C.ok : C.ink }}>{money(m.monto, p.moneda)}</span>
          </div>
        ))}
        <Resumen filas={[
          ["Comisión total", money((p.venta * pct) / 100, p.moneda)],
          ["Cobrada", money(ms.filter((m) => m.ok).reduce((a, m) => a + m.monto, 0), p.moneda), { color: C.ok }],
          ["Pendiente", money(ms.filter((m) => !m.ok).reduce((a, m) => a + m.monto, 0), p.moneda), { tot: true }],
        ]} />
      </Bloque>
    );
  } else if (modelo === "agencia") {
    const ms = movimientos(p, e);
    const ag = agDe(p, e);
    const agDef = num(e?.agencia ?? 25);
    const fact = p.ejecucion.reduce((a, x) => a + x.monto, 0);
    const togglePago = (mes, on) => set({ pagadas: on ? [...new Set([...p.pagadas, mes])] : p.pagadas.filter((x) => x !== mes) });
    const setEjec = (i, cambios) => set({ ejecucion: p.ejecucion.map((x, j) => (j === i ? { ...x, ...cambios } : x)) });
    const addMes = () => {
      const u = p.ejecucion[p.ejecucion.length - 1];
      set({ ejecucion: [...p.ejecucion, { mes: u ? mesSumar(u.mes, 1) : mesKey(0), monto: u ? u.monto : 0 }] });
    };
    fin = (
      <Bloque titulo="Ejecución mensual y tu comisión" accion={<BotonAdd onClick={addMes}>+ Mes</BotonAdd>}>
        <div className="flex flex-wrap items-center gap-2 pb-2.5">
          <b style={{ fontSize: 12.5, color: C.ink }}>Comisión de agencia de este cliente</b>
          <div className="flex items-center gap-1" style={{ width: 84 }}>
            <InputDiferido type="number" value={ag} style={{ textAlign: "right" }}
              onCommit={(v) => { const n = parseFloat(String(v).replace(",", ".")); set({ agencia: isNaN(n) || n === agDef ? null : n }); }} />%
          </div>
          <Hint>
            {p.agencia != null
              ? <>Personalizada · <button className="font-bold" style={{ color: C.tealDark }} onClick={() => set({ agencia: null })}>volver al {agDef}% predeterminado</button></>
              : <>Usa el predeterminado ({agDef}%)</>}
          </Hint>
        </div>
        <Hint className="mb-2">Cargá lo ejecutado cada mes. Tu comisión ({pct}% del neto sin agencia) se cobra el mes siguiente. Tildala cuando la cobres.</Hint>
        {ms.map((m, i) => (
          <div key={i} style={{ ...fila("22px 96px 110px 1fr auto 18px"), ...(i === 0 ? { borderTop: "none" } : {}) }}>
            <input type="checkbox" checked={m.ok} title="Comisión cobrada" onChange={(ev) => togglePago(m.mes, ev.target.checked)} style={check} />
            <InputDiferido type="month" value={m.ejec.mes} onCommit={(v) => v && setEjec(i, { mes: v })} />
            <InputDiferido type="number" value={m.ejec.monto} onCommit={(v) => setEjec(i, { monto: num(v) })} />
            <Hint>→ se cobra en {mesCorto(m.mes)}</Hint>
            <span className="font-bold" style={{ color: m.ok ? C.ok : C.ink }}>{money(m.monto, p.moneda)}</span>
            <button title="Quitar mes" onClick={() => set({ ejecucion: p.ejecucion.filter((_, j) => j !== i) })} style={{ color: C.soft }}><X size={13} /></button>
          </div>
        ))}
        {!ms.length && <Hint>Sin meses cargados.</Hint>}
        <Resumen filas={[
          ["Facturación total", money(fact, p.moneda)],
          [`Agencia (${ag}%)`, `− ${money((fact * ag) / 100, p.moneda)}`, { color: C.soft }],
          ["Tu comisión total", money(ms.reduce((a, m) => a + m.monto, 0), p.moneda)],
          ["Ya cobrada", money(ms.filter((m) => m.ok).reduce((a, m) => a + m.monto, 0), p.moneda), { tot: true, color: C.ok }],
        ]} />
      </Bloque>
    );
  } else if (modelo === "compraventa") {
    fin = (
      <Bloque titulo="Compra · arreglos · venta">
        <EditorCompraventa cv={p.cv} onCambiar={(cv) => set({ cv })} />
      </Bloque>
    );
  } else if (modelo === "propio") {
    const r = resumenPropio(p, e);
    const setCobro = (i, cambios) => set({ cobros: p.cobros.map((c, j) => (j === i ? { ...c, ...cambios } : c)) });
    const setOtro = (i, cambios) => set({ otros: p.otros.map((o, j) => (j === i ? { ...o, ...cambios } : o)) });
    const addCobro = () => {
      const u = p.cobros[p.cobros.length - 1];
      set({ cobros: [...p.cobros, { mes: u ? mesSumar(u.mes, 1) : mesKey(0), monto: 0, ok: false }] });
    };
    fin = (
      <>
        <Bloque titulo="Cobros del cliente" accion={<BotonAdd onClick={addCobro}>+ Cobro</BotonAdd>}>
          <label className="flex items-center gap-2 text-[12.5px] font-bold pb-2" style={{ color: C.ink }}>
            Precio al cliente ({p.moneda === "USD" ? "USD" : "$"})
            <InputDiferido type="number" value={p.precio} onCommit={(v) => set({ precio: num(v) })} style={{ maxWidth: 160 }} />
          </label>
          {p.cobros.map((c, i) => (
            <div key={i} style={fila("22px 120px 1fr 18px")}>
              <input type="checkbox" checked={c.ok} onChange={(ev) => setCobro(i, { ok: ev.target.checked })} style={check} />
              <InputDiferido type="month" value={c.mes} onCommit={(v) => v && setCobro(i, { mes: v })} />
              <InputDiferido type="number" value={c.monto} onCommit={(v) => setCobro(i, { monto: num(v) })} />
              <button title="Quitar cobro" onClick={() => set({ cobros: p.cobros.filter((_, j) => j !== i) })} style={{ color: C.soft }}><X size={13} /></button>
            </div>
          ))}
          {!p.cobros.length && <Hint>Sin cobros cargados.</Hint>}
        </Bloque>
        <Bloque titulo="Otros costos" accion={<BotonAdd onClick={() => set({ otros: [...p.otros, { d: "Nuevo costo", m: 0 }] })}>+ Costo</BotonAdd>}>
          {p.otros.length ? p.otros.map((o, i) => (
            <div key={i} style={{ ...fila("1fr 130px 18px"), ...(i === 0 ? { borderTop: "none" } : {}) }}>
              <InputDiferido value={o.d} onCommit={(v) => setOtro(i, { d: v })} />
              <InputDiferido type="number" value={o.m} onCommit={(v) => setOtro(i, { m: num(v) })} />
              <button title="Quitar costo" onClick={() => set({ otros: p.otros.filter((_, j) => j !== i) })} style={{ color: C.soft }}><X size={13} /></button>
            </div>
          )) : <Hint>Hosting, licencias, herramientas, etc.</Hint>}
          <Resumen filas={[
            ["Precio al cliente", money(p.precio, p.moneda)],
            ["Cobrado", money(r.cobrado, p.moneda)],
            [`Horas (${horasTot(p)} h × $ ${hora.toLocaleString("es-AR")})`, `− ${money(r.ch, p.moneda)}`, { color: C.danger }],
            ["Otros costos", `− ${money(r.co, p.moneda)}`, { color: C.danger }],
            [`Tu ganancia (${Math.round(r.margen)}%)`, money(r.gan, p.moneda), { tot: true, color: r.gan >= 0 ? C.ok : C.danger }],
          ]} />
        </Bloque>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(13,20,32,.45)" }} onClick={onCerrar} />
      <aside className="fixed top-0 right-0 h-screen z-50 overflow-y-auto w-full sm:w-[600px]" style={{ background: C.bg, boxShadow: "-12px 0 30px rgba(0,0,0,.18)" }}>
        <div className="sticky top-0 z-10 flex justify-between gap-2.5 px-5 pt-4 pb-3" style={{ background: C.bg, borderBottom: `1px solid ${C.line}`, borderTop: `4px solid ${color}` }}>
          <div className="min-w-0 flex-1">
            <EmpresaTag empresa={e} />
            <div className="flex items-center gap-2 mt-1.5">
              <NumBadge n={p.num} />
              <InputDiferido value={p.cliente} onCommit={(v) => set({ cliente: v })} placeholder="Cliente"
                className="flex-1 min-w-0 bg-transparent outline-none text-lg font-bold" style={{ color: C.ink, border: "none" }} />
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <InputDiferido value={p.desc} onCommit={(v) => set({ desc: v })} placeholder={modelo === "compraventa" ? "Detalle del producto" : "Descripción del proyecto"}
                className="flex-1 min-w-0 bg-transparent outline-none" style={{ color: C.soft, fontSize: 12.5, border: "none" }} />
              <span className="shrink-0" style={{ color: C.soft, fontSize: 12 }}>· viene del CRM ({modelo === "compraventa" ? "vendido" : "ganada"})</span>
            </div>
          </div>
          <button onClick={onCerrar} style={{ color: C.soft }} className="self-start"><X size={22} /></button>
        </div>

        <div className="px-5 pt-4 pb-8 flex flex-col gap-3.5">
          {modelo === "compraventa" && fin}

          {modelo !== "compraventa" && <Bloque titulo="Próximos pasos y fechas"
            accion={<BotonAdd onClick={() => set({ hitos: [...p.hitos, { n: "Nuevo hito", f: relISO(7), estado: "pendiente" }] })}>+ Hito</BotonAdd>}>
            {p.hitos.map((h, i) => {
              const atr = h.estado !== "hecho" && h.f && diasHasta(h.f) < 0;
              return (
                <div key={i} className="grid items-center gap-2 py-1.5 text-[13px] grid-cols-[16px_1fr_18px] sm:grid-cols-[16px_1fr_132px_108px_18px]"
                  style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
                  <span className="w-3.5 h-3.5 rounded-full" style={{
                    border: `2px solid ${h.estado === "hecho" ? C.ok : h.estado === "en_curso" ? "#1AABAA" : C.line}`,
                    background: h.estado === "hecho" ? C.ok : h.estado === "en_curso" ? "#1AABAA" : "transparent",
                  }} />
                  <InputDiferido value={h.n} onCommit={(v) => setHito(i, { n: v })} />
                  <button className="sm:order-last" title="Quitar hito" onClick={() => set({ hitos: p.hitos.filter((_, j) => j !== i) })} style={{ color: C.soft }}><Trash2 size={13} /></button>
                  <input type="date" value={h.f} onChange={(ev) => setHito(i, { f: ev.target.value })} className="vt-inp col-start-2 sm:col-start-auto"
                    style={atr ? { borderColor: C.danger, color: C.danger } : undefined} />
                  <select value={h.estado} onChange={(ev) => setHito(i, { estado: ev.target.value })} className="vt-inp col-start-2 sm:col-start-auto">
                    {Object.entries(ESTADOS_HITO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              );
            })}
            {!p.hitos.length && <Hint>Sin hitos. Agregá el primero.</Hint>}
            {HINT_HITOS[modelo] && <Hint className="mt-1.5">{HINT_HITOS[modelo]}</Hint>}
          </Bloque>}

          <Bloque titulo={`Horas ejecutadas · ${horasTot(p)} h${modelo === "propio" ? ` · costo ${money(horasTot(p) * hora, "ARS")}` : ""}`}
            accion={<BotonAdd onClick={() => setFormHora(true)}>+ Cargar horas</BotonAdd>}>
            {horasOrden.length ? horasOrden.map((h, k) => (
              <div key={h.i} style={{ ...fila(modelo === "propio" ? "72px 46px 1fr auto 18px" : "72px 46px 1fr 18px"), ...(k === 0 ? { borderTop: "none" } : {}) }}>
                <span className="font-bold">{fechaCorta(h.f)}</span>
                <span>{h.h} h</span>
                <span style={{ color: C.muted, fontSize: 12.5 }}>{h.d}</span>
                {modelo === "propio" && <span style={{ color: C.danger, fontSize: 12 }}>− {money(h.h * hora, "ARS")}</span>}
                <button title="Quitar" onClick={() => set({ horas: p.horas.filter((_, j) => j !== h.i) })} style={{ color: C.soft }}><X size={13} /></button>
              </div>
            )) : <Hint>Sin horas cargadas.</Hint>}
            {formHora && (
              <div className="flex flex-wrap gap-1.5 mt-2 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
                <input type="date" value={hF} onChange={(ev) => setHF(ev.target.value)} className="vt-inp" style={{ flex: "0 0 140px" }} />
                <input type="number" value={hH} onChange={(ev) => setHH(ev.target.value)} placeholder="Horas" className="vt-inp" style={{ flex: "0 0 80px" }} autoFocus />
                <input value={hD} onChange={(ev) => setHD(ev.target.value)} onKeyDown={(ev) => ev.key === "Enter" && guardarHora()} placeholder="Qué hiciste" className="vt-inp" style={{ flex: 1, minWidth: 120 }} />
                <button onClick={guardarHora} className="rounded-lg px-3 py-1.5 text-[13px] font-bold" style={{ background: "#1AABAA", color: "#1A1A2E" }}>Guardar</button>
              </div>
            )}
            {modelo !== "propio" && <Hint className="mt-1.5">En {e?.nombre || "este proyecto"} las horas son informativas{modelo === "compraventa" ? ": sirven para ver cuánto tiempo te llevó el arreglo" : modelo !== "ninguno" ? ": tu ganancia es la comisión" : ""}.</Hint>}
          </Bloque>

          {modelo !== "compraventa" && fin}

          <div className="text-right">
            <button onClick={() => { if (window.confirm(`¿Eliminar el proyecto #${p.num} (${p.cliente})? No se puede deshacer.`)) onEliminar(); }}
              className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: C.danger }}>
              <Trash2 size={12} /> Eliminar proyecto
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
