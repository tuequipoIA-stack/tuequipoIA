"use client";

import { useState } from "react";
import { Plus, Trash2, X, Target, Check } from "lucide-react";
import { MESES } from "@/lib/constants";
import { C, tint } from "@/lib/theme";
import { fechaCorta } from "@/lib/fechas";
import { EmpresaTag, SelectEmpresa } from "@/components/empresas/EmpresasUI";
import { COLOR_PLAN_DIARIO, MINI, MINI_CLS } from "./comun";

const TEAL = "#1AABAA";
const NAVY = "#1A1A2E";

function SelectMes({ value, onChange, className = "", style = {} }) {
  return (
    <select value={value || ""} onClick={(e) => e.stopPropagation()} onChange={(e) => onChange(e.target.value)}
      className={className} style={style}>
      <option value="">Sin mes</option>
      {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}

const MES_CHIP = { background: tint(TEAL, 0.14), color: C.tealDark, border: "none", outline: "none" };

export default function GrandesObjetivos({
  objetivos, todosLosObjetivos, empresas, porId, empresaDefault,
  onCrear, onEliminar, onMes, onEmpresa, onAgregarTarea, onEliminarTarea, onTranscribir,
}) {
  const [abiertoId, setAbiertoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [mes, setMes] = useState("");
  const [empresa, setEmpresa] = useState(empresaDefault);
  const [tareaTexto, setTareaTexto] = useState("");
  const [tareaFecha, setTareaFecha] = useState("");
  const [transcritas, setTranscritas] = useState({});

  const abierto = todosLosObjetivos.find((o) => o.id === abiertoId);

  const abrirForm = () => { setEmpresa(empresaDefault); setMostrarForm(true); };
  const cerrarForm = () => { setMostrarForm(false); setTitulo(""); setMes(""); };
  const crear = async () => {
    if (!titulo.trim()) return;
    const o = await onCrear({ titulo: titulo.trim(), mes: mes || null, empresa: empresa || null });
    cerrarForm();
    if (o) setAbiertoId(o.id);
  };
  const agregarTarea = () => {
    if (!tareaTexto.trim() || !abierto) return;
    onAgregarTarea(abierto.id, { texto: tareaTexto.trim(), fecha: tareaFecha || null });
    setTareaTexto("");
    setTareaFecha("");
  };
  const transcribir = (t) => {
    onTranscribir(t, abierto?.empresa || null);
    setTranscritas((p) => ({ ...p, [t.id]: true }));
    setTimeout(() => setTranscritas((p) => { const c = { ...p }; delete c[t.id]; return c; }), 1500);
  };

  const campo = { background: C.panel, border: `1px solid ${C.line}`, color: C.ink };

  return (
    <>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {objetivos.map((o) => {
          const e = porId(o.empresa);
          const n = (o.tareas || []).length;
          return (
            <div key={o.id} role="button" tabIndex={0} onClick={() => setAbiertoId(o.id)}
              onKeyDown={(ev) => ev.key === "Enter" && setAbiertoId(o.id)}
              className="text-left rounded-xl p-4 relative hover:opacity-90 cursor-pointer"
              style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: `4px solid ${e ? e.color : C.line}`, boxShadow: "0 1px 2px rgba(0,0,0,.04)" }}>
              <button onClick={(ev) => { ev.stopPropagation(); onEliminar(o.id); }} title="Eliminar objetivo"
                className="absolute top-2 right-2 p-0.5 rounded hover:bg-black/5" style={{ color: C.danger }}><Trash2 size={13} /></button>

              <div className="flex flex-wrap items-center gap-1.5 pr-5">
                <SelectMes value={o.mes} onChange={(m) => onMes(o.id, m)} className="text-[10px] px-1.5 py-0.5 rounded-md font-bold" style={MES_CHIP} />
                <EmpresaTag empresa={e} />
              </div>

              <div className="flex items-center gap-2 mt-2.5 mb-1">
                <Target size={15} color={e ? e.color : TEAL} className="shrink-0" />
                <span style={{ color: C.ink }} className="text-sm font-semibold">{o.titulo}</span>
              </div>
              <span style={{ color: C.soft }} className="text-xs">{n} {n === 1 ? "tarea" : "tareas"}</span>
              {o.origenPlan && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-2" style={{ background: COLOR_PLAN_DIARIO.tagBg, color: COLOR_PLAN_DIARIO.tagText }}>
                  Desde tu Plan de negocio
                </span>
              )}
              <div className="mt-2.5" onClick={(ev) => ev.stopPropagation()}>
                <SelectEmpresa empresas={empresas} value={e ? o.empresa : ""} onChange={(emp) => onEmpresa(o.id, emp)}
                  className={`${MINI_CLS} w-full`} style={MINI} />
              </div>
            </div>
          );
        })}

        {mostrarForm ? (
          <div className="rounded-xl p-4" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
            <div className="flex gap-2 mb-2">
              <SelectMes value={mes} onChange={setMes} className="flex-1 min-w-0 rounded-lg px-2 py-2 text-sm outline-none" style={{ ...campo, color: C.muted }} />
              <SelectEmpresa empresas={empresas} value={empresa} onChange={setEmpresa}
                className="flex-1 min-w-0 rounded-lg px-2 py-2 text-sm font-semibold" style={{ background: C.panel, color: C.ink }} />
            </div>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && crear()}
              placeholder="Título del objetivo" autoFocus className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-2" style={campo} />
            <div className="flex gap-2">
              <button onClick={crear} className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: TEAL, color: NAVY }}>Crear</button>
              <button onClick={cerrarForm} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: C.muted }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={abrirForm}
            className="rounded-xl p-4 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[110px]"
            style={{ background: "transparent", border: `1px dashed ${C.line}`, color: C.soft }}>
            <Plus size={13} /> Nuevo gran objetivo
          </button>
        )}
      </div>

      {objetivos.length === 0 && !mostrarForm && (
        <p style={{ color: C.soft }} className="text-xs mt-3">
          {todosLosObjetivos.length ? "No hay grandes objetivos para esta empresa." : "Todavía no cargaste ningún gran objetivo."}
        </p>
      )}

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,20,32,0.55)" }}
          onClick={() => setAbiertoId(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: C.panel }}>
            <div className="flex items-start justify-between mb-1 gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <SelectMes value={abierto.mes} onChange={(m) => onMes(abierto.id, m)} className="text-[10px] px-1.5 py-1 rounded-md font-bold" style={MES_CHIP} />
                  <SelectEmpresa empresas={empresas} value={porId(abierto.empresa) ? abierto.empresa : ""} onChange={(emp) => onEmpresa(abierto.id, emp)}
                    className={MINI_CLS} style={MINI} />
                </div>
                <div className="flex items-center gap-2">
                  <Target size={17} color={porId(abierto.empresa)?.color || TEAL} className="shrink-0" />
                  <h3 style={{ color: C.ink }} className="text-lg font-semibold">{abierto.titulo}</h3>
                </div>
              </div>
              <button onClick={() => setAbiertoId(null)} style={{ color: C.soft }}><X size={18} /></button>
            </div>
            <p style={{ color: C.soft }} className="text-xs mb-4">
              Sumá tareas chicas para este objetivo. El botón <Plus size={10} className="inline" style={{ verticalAlign: "middle" }} /> las manda a &quot;Tareas de la semana&quot; en la otra pestaña.
            </p>

            <div className="space-y-2 mb-4">
              {(abierto.tareas || []).map((t) => (
                <div key={t.id} className="rounded-lg p-3 flex items-center justify-between gap-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                  <div className="min-w-0">
                    <div style={{ color: C.ink }} className="text-sm truncate">{t.texto}</div>
                    {t.fecha && <div style={{ color: C.soft }} className="text-[10px] mt-0.5">{fechaCorta(t.fecha)}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => transcribir(t)} title="Pasar a 'Tareas de la semana'"
                      className="rounded-md p-1.5 flex items-center justify-center"
                      style={transcritas[t.id] ? { background: "#d9eadc", color: "#357a49" } : { background: TEAL, color: NAVY }}>
                      {transcritas[t.id] ? <Check size={13} /> : <Plus size={13} />}
                    </button>
                    <button onClick={() => onEliminarTarea(abierto.id, t.id)} title="Eliminar" style={{ color: C.danger }}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
              {(abierto.tareas || []).length === 0 && (
                <p style={{ color: C.soft }} className="text-xs text-center py-3">Todavía no hay tareas cargadas.</p>
              )}
            </div>

            <div className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <input value={tareaTexto} onChange={(e) => setTareaTexto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agregarTarea()}
                placeholder="Nueva tarea chica..." className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-2" style={campo} />
              <div className="flex gap-2">
                <input type="date" value={tareaFecha} onChange={(e) => setTareaFecha(e.target.value)}
                  className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none" style={campo} />
                <button onClick={agregarTarea} className="rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-1.5 shrink-0" style={{ background: TEAL, color: NAVY }}>
                  <Plus size={14} /> Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
