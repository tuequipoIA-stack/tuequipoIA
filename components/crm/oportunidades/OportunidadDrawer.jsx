"use client";

import { useEffect, useRef, useState } from "react";
import { X, Pencil, ExternalLink, Check, Mic } from "lucide-react";
import { C, tint } from "@/lib/theme";
import { hoyISO, relISO, diasHasta, fechaDia } from "@/lib/fechas";
import { SelectEmpresa } from "@/components/empresas/EmpresasUI";
import {
  ETAPAS, ETAPAS_ORDEN, TIPOS_DOC, TIPO_DOC_COL, CANALES, COLUMNA_LABEL, COLUMNA_COL, SIN_EMPRESA,
  money, inp, sel, btnTeal,
} from "./comun";
import { NumChip, Bloque, FormBox, Hint } from "./Piezas";
import EditorCompraventa from "@/components/compraventa/EditorCompraventa";
import { esCompraventa, etiquetaEtapa, normalizarCV } from "@/lib/compraventa";

const waLink = (t) => "https://wa.me/" + String(t).replace(/\D/g, "");

function BtnGuardar({ onClick, children }) {
  return (
    <div>
      <button onClick={onClick} className="rounded-lg text-[13px] font-bold" style={{ ...btnTeal, padding: "8px 14px" }}>{children}</button>
    </div>
  );
}

function Item({ first, children, style }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px]" style={{ padding: first ? "0 0 9px" : "9px 0", borderTop: first ? "none" : `1px solid ${C.line}`, ...style }}>
      {children}
    </div>
  );
}

export default function OportunidadDrawer({ op, empresas, porId, tareas, onClose, onCambiar, onEtapa, onCrearTarea, onEliminar }) {
  const [abierto, setAbierto] = useState(null); // id del form abierto
  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState(null);
  const [f, setF] = useState({});
  const [notas, setNotas] = useState(op?.notas || "");
  const notasTimer = useRef(null);
  const notasPend = useRef(null); // notas escritas que todavía no se guardaron

  // Al cerrar, guarda las notas pendientes del debounce
  const cerrar = () => {
    clearTimeout(notasTimer.current);
    if (notasPend.current != null && notasPend.current !== op?.notas) onCambiar({ notas: notasPend.current });
    notasPend.current = null;
    onClose();
  };
  const cerrarRef = useRef(cerrar);
  useEffect(() => { cerrarRef.current = cerrar; });

  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") cerrarRef.current(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  useEffect(() => () => clearTimeout(notasTimer.current), []);

  if (!op) return null;
  const e = porId(op.empresa) || SIN_EMPRESA;
  const cvEmp = esCompraventa(e);
  // Guardar compraventa: el valor de la oportunidad sigue al precio de venta (o al objetivo)
  const cambiarCV = (cv) => {
    const c = normalizarCV(cv);
    onCambiar({ cv: c, valor: c.venta.monto || c.objetivo, moneda: "ARS" });
  };
  const set = (k) => (ev) => setF((p) => ({ ...p, [k]: ev.target.type === "checkbox" ? ev.target.checked : ev.target.value }));
  const toggle = (id, ini = {}) => { setAbierto((a) => (a === id ? null : id)); setF(ini); };

  const guardarNotas = (v) => {
    clearTimeout(notasTimer.current);
    notasPend.current = null;
    if (v !== op.notas) onCambiar({ notas: v });
  };
  const onNotas = (v) => {
    setNotas(v);
    notasPend.current = v;
    clearTimeout(notasTimer.current);
    notasTimer.current = setTimeout(() => guardarNotas(v), 800);
  };

  const abrirEdicion = () => {
    setDatos({ cliente: op.cliente, rubro: op.rubro || "", valor: String(op.valor ?? ""), moneda: op.moneda || "USD", prob: String(op.prob ?? 50) });
    setEditando(true);
  };
  const guardarEdicion = () => {
    if (!datos.cliente.trim()) return;
    onCambiar({
      cliente: datos.cliente.trim(), rubro: datos.rubro.trim(), valor: parseFloat(datos.valor) || 0, moneda: datos.moneda,
      prob: Math.max(0, Math.min(100, parseInt(datos.prob, 10) || 0)),
    });
    setEditando(false);
  };

  const proximos = op.proximos.map((p, i) => ({ ...p, i })).sort((a, b) => a.f.localeCompare(b.f));
  const convs = [...op.conv].sort((a, b) => b.f.localeCompare(a.f));

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(13,20,32,.45)" }} onClick={cerrar} />
      <aside className="fixed top-0 right-0 h-screen z-40 overflow-y-auto" style={{ width: "min(560px,100vw)", background: C.bg, boxShadow: "-12px 0 30px rgba(0,0,0,.18)" }}>
        <div className="sticky top-0 z-10" style={{ background: C.bg, padding: "18px 20px 12px", borderBottom: `1px solid ${C.line}`, borderTop: `4px solid ${e.color}` }}>
          <div className="flex justify-between items-start gap-2.5">
            <div className="min-w-0">
              <span className="inline-block rounded-full" style={{ background: tint(e.color, 0.13), color: e.color, fontSize: 10.5, fontWeight: 700, padding: "3px 9px" }}>● {e.nombre}</span>
              <h3 className="flex gap-2 items-center" style={{ margin: "4px 0 2px", fontSize: 19, fontWeight: 700, color: C.ink }}>
                <NumChip num={op.num} style={{ padding: "3px 8px" }} />
                <span className="truncate">{op.cliente}</span>
              </h3>
              {op.rubro && <div style={{ color: C.soft, fontSize: 12.5 }}>{op.rubro}</div>}
            </div>
            <button onClick={cerrar} style={{ color: C.soft }} aria-label="Cerrar"><X size={22} /></button>
          </div>
          <div className="flex gap-2 items-center flex-wrap mt-2">
            <select value={op.etapa} onChange={(ev) => onEtapa(ev.target.value)} style={sel}>
              {ETAPAS_ORDEN.map((k) => (
                <option key={k} value={k}>{k === "ganado" ? "✓ " : k === "perdido" ? "✕ " : ""}{etiquetaEtapa(k, e, ETAPAS)}</option>
              ))}
            </select>
            <SelectEmpresa empresas={empresas} value={op.empresa} onChange={(v) => onCambiar({ empresa: v })} style={sel} />
            <span style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{money(op.valor, op.moneda)}</span>
            <span style={{ fontSize: 12, color: C.soft }}>· Prob. {op.prob}%</span>
            {!editando && (
              <button onClick={abrirEdicion} className="flex items-center gap-1" style={{ fontSize: 12, fontWeight: 700, color: C.tealDark }}>
                <Pencil size={12} /> Editar datos
              </button>
            )}
          </div>
          {editando && datos && (
            <FormBox>
              <div className="flex gap-2 flex-wrap">
                <input value={datos.cliente} onChange={(ev) => setDatos({ ...datos, cliente: ev.target.value })} placeholder="Cliente" style={{ ...inp, flex: 1, minWidth: 140 }} />
                <input value={datos.rubro} onChange={(ev) => setDatos({ ...datos, rubro: ev.target.value })} placeholder="Rubro / detalle" style={{ ...inp, flex: 1, minWidth: 140 }} />
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <input type="number" value={datos.valor} onChange={(ev) => setDatos({ ...datos, valor: ev.target.value })} placeholder="Valor" style={{ ...inp, flex: 1, minWidth: 110 }} />
                <select value={datos.moneda} onChange={(ev) => setDatos({ ...datos, moneda: ev.target.value })} style={{ ...inp, flex: "0 0 80px" }}>
                  <option>USD</option><option>ARS</option>
                </select>
                <label className="flex items-center gap-1.5" style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
                  Prob. %
                  <input type="number" min={0} max={100} value={datos.prob} onChange={(ev) => setDatos({ ...datos, prob: ev.target.value })} style={{ ...inp, width: 70 }} />
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={guardarEdicion} className="rounded-lg text-[13px] font-bold" style={{ ...btnTeal, padding: "8px 14px" }}>Guardar</button>
                <button onClick={() => setEditando(false)} className="text-[13px] font-semibold px-2" style={{ color: C.muted }}>Cancelar</button>
              </div>
            </FormBox>
          )}
        </div>

        <div className="flex flex-col gap-3.5" style={{ padding: "16px 20px 30px" }}>
          {cvEmp && (
            <Bloque titulo="Compra · arreglos · venta">
              <EditorCompraventa cv={op.cv} onCambiar={cambiarCV} />
              {op.etapa !== "ganado" && (
                <Hint style={{ marginTop: 8 }}>Cuando lo vendas, pasalo a <b>✓ Vendido</b> arriba y se carga solo en Ventas.</Hint>
              )}
            </Bloque>
          )}
          {/* Contactos */}
          <Bloque titulo="Contactos" accion="+ Agregar" onAccion={() => toggle("c")}>
            {op.contactos.length ? op.contactos.map((c, i) => (
              <Item key={i} first={i === 0}>
                <div className="min-w-0">
                  <b className="block" style={{ fontSize: 13.5, color: C.ink }}>{c.n}</b>
                  <small style={{ color: C.soft, fontSize: 12 }}>{[c.r, c.t, c.m].filter(Boolean).join(" · ")}</small>
                </div>
                <div className="flex gap-1.5 ml-auto flex-wrap justify-end">
                  {c.t && <a href={waLink(c.t)} target="_blank" rel="noreferrer" className="rounded-[7px] whitespace-nowrap" style={{ fontSize: 11, fontWeight: 700, padding: "5px 9px", background: "#d9f0e0", color: "#23794a" }}>WhatsApp</a>}
                  {c.t && <a href={"tel:" + String(c.t).replace(/\s/g, "")} className="rounded-[7px] whitespace-nowrap" style={{ fontSize: 11, fontWeight: 700, padding: "5px 9px", background: C.chip, color: C.muted }}>Llamar</a>}
                  {c.m && <a href={"mailto:" + c.m} className="rounded-[7px] whitespace-nowrap" style={{ fontSize: 11, fontWeight: 700, padding: "5px 9px", background: C.chip, color: C.muted }}>Mail</a>}
                  <button title="Quitar contacto" onClick={() => onCambiar({ contactos: op.contactos.filter((_, j) => j !== i) })} style={{ color: C.soft }}><X size={13} /></button>
                </div>
              </Item>
            )) : <Hint>Sin contactos cargados.</Hint>}
            {abierto === "c" && (
              <FormBox>
                <div className="flex gap-2 flex-wrap">
                  <input placeholder="Nombre" value={f.n || ""} onChange={set("n")} style={{ ...inp, flex: 1, minWidth: 120 }} />
                  <input placeholder="Cargo / área" value={f.r || ""} onChange={set("r")} style={{ ...inp, flex: 1, minWidth: 120 }} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <input placeholder="Teléfono" value={f.t || ""} onChange={set("t")} style={{ ...inp, flex: 1, minWidth: 120 }} />
                  <input placeholder="Email" value={f.m || ""} onChange={set("m")} style={{ ...inp, flex: 1, minWidth: 120 }} />
                </div>
                <BtnGuardar onClick={() => {
                  if (!(f.n || "").trim()) return;
                  onCambiar({ contactos: [...op.contactos, { n: f.n.trim(), r: (f.r || "").trim(), t: (f.t || "").trim(), m: (f.m || "").trim() }] });
                  setAbierto(null);
                }}>Guardar contacto</BtnGuardar>
              </FormBox>
            )}
          </Bloque>

          {/* Próximos contactos */}
          <Bloque titulo="Próximos contactos" accion="+ Agendar" onAccion={() => toggle("p", { f: relISO(2), tarea: true })}>
            {proximos.length ? proximos.map((p, k) => {
              const d = diasHasta(p.f);
              return (
                <Item key={p.i} first={k === 0}>
                  <button onClick={() => onCambiar({ proximos: op.proximos.map((x, j) => (j === p.i ? { ...x, h: !x.h } : x)) })}
                    className="flex items-center justify-center shrink-0 rounded-[5px]"
                    style={{ width: 18, height: 18, border: `1.5px solid ${p.h ? "#1AABAA" : C.line}`, background: p.h ? "#1AABAA" : C.panel, color: "#fff" }}>
                    {p.h && <Check size={12} />}
                  </button>
                  <span style={{ minWidth: 74, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: p.h ? C.soft : !p.h && d < 0 ? C.danger : C.ink, textDecoration: p.h ? "line-through" : "none" }}>
                    {d === 0 ? "Hoy" : d === 1 ? "Mañana" : fechaDia(p.f)}
                  </span>
                  <span style={{ color: p.h ? C.soft : C.ink, textDecoration: p.h ? "line-through" : "none" }}>{p.m}</span>
                  <button title="Quitar" className="ml-auto" onClick={() => onCambiar({ proximos: op.proximos.filter((_, j) => j !== p.i) })} style={{ color: C.soft }}><X size={13} /></button>
                </Item>
              );
            }) : <Hint>No hay próximos contactos agendados.</Hint>}
            {abierto === "p" && (
              <FormBox>
                <div className="flex gap-2 flex-wrap">
                  <input type="date" value={f.f || ""} onChange={set("f")} style={{ ...inp, maxWidth: 160 }} />
                  <input placeholder="Motivo" value={f.m || ""} onChange={set("m")} style={{ ...inp, flex: 1, minWidth: 140 }} />
                </div>
                <label className="flex gap-1.5 items-center" style={{ fontSize: 11, color: C.soft }}>
                  <input type="checkbox" checked={!!f.tarea} onChange={set("tarea")} /> Crear también la tarea en Organización
                </label>
                <BtnGuardar onClick={() => {
                  if (!(f.m || "").trim() || !f.f) return;
                  onCambiar({ proximos: [...op.proximos, { f: f.f, m: f.m.trim(), h: false }] });
                  if (f.tarea) onCrearTarea(f.m.trim(), diasHasta(f.f) <= 0 ? "hoy" : "semana");
                  setAbierto(null);
                }}>Agendar</BtnGuardar>
              </FormBox>
            )}
          </Bloque>

          {/* Documentos */}
          <Bloque titulo="Propuestas, cotizaciones y artifacts" accion="+ Cargar link" onAccion={() => toggle("d", { tipo: "propuesta" })}>
            {op.docs.length ? op.docs.map((d, i) => {
              const col = TIPO_DOC_COL[d.tipo] || TIPO_DOC_COL.otro;
              return (
                <Item key={i} first={i === 0}>
                  <span className="whitespace-nowrap rounded-md" style={{ fontSize: 10, fontWeight: 800, padding: "3px 7px", background: col.bg, color: col.fg }}>{TIPOS_DOC[d.tipo] || "Otro"}</span>
                  <span className="flex-1 min-w-0" style={{ color: C.ink }}>
                    {d.t}
                    <small className="block truncate" style={{ color: C.soft, fontSize: 11 }}>{d.u}</small>
                  </span>
                  <a href={d.u} target="_blank" rel="noreferrer" className="flex items-center gap-1 whitespace-nowrap" style={{ fontSize: 12, fontWeight: 700, color: C.tealDark }}>Abrir <ExternalLink size={11} /></a>
                  <button title="Quitar" onClick={() => onCambiar({ docs: op.docs.filter((_, j) => j !== i) })} style={{ color: C.soft }}><X size={13} /></button>
                </Item>
              );
            }) : <Hint>Todavía no cargaste documentos.</Hint>}
            {abierto === "d" && (
              <FormBox>
                <div className="flex gap-2 flex-wrap">
                  <select value={f.tipo || "propuesta"} onChange={set("tipo")} style={{ ...inp, maxWidth: 190 }}>
                    {Object.entries(TIPOS_DOC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <input placeholder="Título" value={f.t || ""} onChange={set("t")} style={{ ...inp, flex: 1, minWidth: 140 }} />
                </div>
                <input placeholder="https://…" value={f.u || ""} onChange={set("u")} style={inp} />
                <BtnGuardar onClick={() => {
                  let u = (f.u || "").trim();
                  if (!u) return;
                  if (!/^[a-z]+:/i.test(u)) u = "https://" + u;
                  const tipo = f.tipo || "propuesta";
                  onCambiar({ docs: [...op.docs, { tipo, t: (f.t || "").trim() || TIPOS_DOC[tipo], u }] });
                  setAbierto(null);
                }}>Guardar link</BtnGuardar>
              </FormBox>
            )}
          </Bloque>

          {/* Conversaciones */}
          <Bloque titulo="Conversaciones" accion="+ Registrar" onAccion={() => toggle("v", { f: hoyISO(), c: "Llamada" })}>
            {abierto === "v" && (
              <FormBox style={{ margin: "0 0 12px" }}>
                <div className="flex gap-2 flex-wrap">
                  <input type="date" value={f.f || ""} onChange={set("f")} style={{ ...inp, maxWidth: 160 }} />
                  <select value={f.c || "Llamada"} onChange={set("c")} style={{ ...inp, maxWidth: 160 }}>
                    {CANALES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <textarea placeholder="¿Qué se habló? ¿Qué quedó pendiente?" value={f.r || ""} onChange={set("r")} style={{ ...inp, minHeight: 60, resize: "vertical" }} />
                <BtnGuardar onClick={() => {
                  if (!(f.r || "").trim() || !f.f) return;
                  onCambiar({ conv: [...op.conv, { f: f.f, c: f.c || "Llamada", r: f.r.trim() }] });
                  setAbierto(null);
                }}>Guardar</BtnGuardar>
              </FormBox>
            )}
            {convs.length ? (
              <div className="relative" style={{ paddingLeft: 16 }}>
                <span className="absolute" style={{ left: 4, top: 4, bottom: 4, width: 2, background: C.line }} />
                {convs.map((c, i) => (
                  <div key={i} className="relative" style={{ paddingBottom: 12 }}>
                    <span className="absolute rounded-full" style={{ left: -15, top: 4, width: 8, height: 8, background: "#1AABAA", boxShadow: `0 0 0 2px ${C.card}` }} />
                    <div className="flex items-center gap-1" style={{ fontSize: 11.5, color: C.soft, fontWeight: 700 }}>
                      {fechaDia(c.f)} · {c.c}{c.audio && <> · <Mic size={11} /> por audio</>}
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: 1.45, color: C.ink }}>{c.r}</p>
                  </div>
                ))}
              </div>
            ) : <Hint>Sin conversaciones registradas.</Hint>}
          </Bloque>

          {/* Tareas */}
          <Bloque titulo="Tareas" accion="+ Nueva tarea" onAccion={() => toggle("t", { c: "semana" })}>
            {tareas.length ? tareas.map((t, i) => {
              const col = COLUMNA_COL[t.columna] || COLUMNA_COL.semana;
              const hecha = t.columna === "hecho";
              return (
                <Item key={t.id || i} first={i === 0}>
                  <span style={{ color: hecha ? C.soft : C.ink, textDecoration: hecha ? "line-through" : "none" }}>{hecha ? "☑" : "☐"} {t.texto}</span>
                  <span className="ml-auto whitespace-nowrap rounded-full" style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", background: col.bg, color: col.fg }}>
                    {COLUMNA_LABEL[t.columna] || t.columna}
                  </span>
                </Item>
              );
            }) : <Hint>Sin tareas para esta oportunidad.</Hint>}
            {abierto === "t" && (
              <FormBox>
                <div className="flex gap-2 flex-wrap">
                  <input placeholder="Ej: enviar propuesta revisada" value={f.t || ""} onChange={set("t")} style={{ ...inp, flex: 1, minWidth: 160 }} />
                  <select value={f.c || "semana"} onChange={set("c")} style={{ ...inp, maxWidth: 150 }}>
                    <option value="semana">Esta semana</option>
                    <option value="hoy">Hoy</option>
                  </select>
                </div>
                <Hint>Se crea en Organización{op.empresa ? ` con ${e.nombre} asignada` : ""} y la referencia #{op.num}.</Hint>
                <BtnGuardar onClick={() => {
                  if (!(f.t || "").trim()) return;
                  onCrearTarea(f.t.trim(), f.c || "semana", true);
                  setAbierto(null);
                }}>Crear tarea</BtnGuardar>
              </FormBox>
            )}
          </Bloque>

          {/* Notas */}
          <Bloque titulo="Notas">
            <textarea value={notas} onChange={(ev) => onNotas(ev.target.value)} onBlur={(ev) => guardarNotas(ev.target.value)}
              placeholder="Quién decide, competencia, objeciones…"
              className="w-full"
              style={{ minHeight: 70, border: `1px solid ${C.line}`, background: C.panel, borderRadius: 8, padding: "9px 10px", fontSize: 13, outline: "none", resize: "vertical", color: C.ink }} />
          </Bloque>

          <div className="text-center pt-1">
            <button onClick={() => { if (confirm(`¿Eliminar la oportunidad #${op.num} (${op.cliente})? No se puede deshacer.`)) onEliminar(); }}
              style={{ fontSize: 12, color: C.danger, fontWeight: 600, textDecoration: "underline" }}>
              Eliminar oportunidad
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
