"use client";

import { useState } from "react";
import { Ban, Plus, Trash2, X, Mic } from "lucide-react";
import { MAX_COLUMNAS_EXTRA } from "@/lib/constants";
import { C, COL } from "@/lib/theme";
import { diasDesde } from "@/lib/fechas";
import { EmpresaTag, SelectEmpresa } from "@/components/empresas/EmpresasUI";
import { DIAS_ARCHIVO, COLOR_PLAN_DIARIO, MINI, MINI_CLS } from "./comun";

const TEAL = "#1AABAA";
const NAVY = "#1A1A2E";

function TarjetaTarea({ t, col, columnas, empresas, porId, nueva, onMover, onEmpresa, onEliminar, onBan, onDragStart, onDragEnd, arrastrando }) {
  const esPlanDiario = t.origen === "plan-diario";
  const e = porId(t.empresa);
  const hecho = col.id === "hecho";
  const restan = hecho && t.hechoEn ? DIAS_ARCHIVO - diasDesde(t.hechoEn) : null;
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      className={`rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing ${nueva ? "org-flash" : ""}`}
      style={{
        background: esPlanDiario ? COLOR_PLAN_DIARIO.bg : C.card,
        border: `1px solid ${esPlanDiario ? COLOR_PLAN_DIARIO.border : C.line}`,
        borderLeft: `4px solid ${e ? e.color : C.line}`,
        boxShadow: "0 1px 2px rgba(0,0,0,.04)",
        opacity: arrastrando ? 0.4 : 1,
      }}>
      <div className="flex flex-wrap items-center gap-1">
        <EmpresaTag empresa={e} />
        {t.audio && (
          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.chip, color: C.muted }}>🎙 por audio</span>
        )}
        {esPlanDiario && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: COLOR_PLAN_DIARIO.tagBg, color: COLOR_PLAN_DIARIO.tagText }}>
            Rutina del plan
          </span>
        )}
      </div>
      <div className="text-sm leading-snug mt-1.5 mb-2" style={{ color: hecho ? C.soft : C.ink, textDecoration: hecho ? "line-through" : "none" }}>
        {t.texto}
      </div>
      {restan !== null && (
        <div className="text-[10px] -mt-1 mb-2" style={{ color: C.soft }}>
          ⏳ Pasa a Acumuladas {restan <= 1 ? "mañana" : `en ${restan} días`}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <select value={col.id} onChange={(ev) => onMover(ev.target.value)} className={`${MINI_CLS} flex-1`} style={MINI} title="Columna">
          {columnas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <SelectEmpresa empresas={empresas} value={porId(t.empresa) ? t.empresa : ""} onChange={onEmpresa}
          className={`${MINI_CLS} flex-1`} style={MINI} />
        {esPlanDiario && (
          <button onClick={onBan} title="Quitar definitivamente de mi rutina diaria (no vuelve a aparecer)"
            className="shrink-0 p-0.5 rounded hover:bg-black/5" style={{ color: C.danger }}>
            <Ban size={13} />
          </button>
        )}
        <button onClick={onEliminar} title={esPlanDiario ? "Sacar solo la de hoy (vuelve a aparecer mañana)" : "Eliminar"}
          className="shrink-0 p-0.5 rounded hover:bg-black/5" style={{ color: C.danger }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function TableroBoard({
  columnas, tareas, empresas, porId, recien, empresaDefault,
  onAgregar, onMover, onEmpresa, onEliminar, onBan, onAgregarColumna, onEliminarColumna, onAudio,
}) {
  const [texto, setTexto] = useState("");
  const [empresaSel, setEmpresaSel] = useState(empresaDefault);
  const [empresaBase, setEmpresaBase] = useState(empresaDefault);
  const [arrastrando, setArrastrando] = useState(null);
  const [nuevaColumna, setNuevaColumna] = useState("");
  const [mostrarFormColumna, setMostrarFormColumna] = useState(false);

  // Cuando cambia el filtro, el select de empresa arranca en la empresa filtrada
  if (empresaBase !== empresaDefault) {
    setEmpresaBase(empresaDefault);
    setEmpresaSel(empresaDefault);
  }

  const columnasExtra = columnas.filter((c) => !c.fija).length;

  const agregar = () => {
    if (!texto.trim()) return;
    onAgregar(texto.trim(), empresaSel);
    setTexto("");
  };
  const crearColumna = () => {
    if (!nuevaColumna.trim()) return;
    onAgregarColumna(nuevaColumna.trim());
    setNuevaColumna("");
    setMostrarFormColumna(false);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agregar()}
          placeholder="Nueva tarea (va a 'Tareas de la semana')..."
          className="flex-1 min-w-[200px] rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
        <SelectEmpresa empresas={empresas} value={empresaSel} onChange={setEmpresaSel}
          className="flex-1 sm:flex-none sm:max-w-[190px] rounded-lg px-2.5 py-2 text-[13px] font-semibold" style={{ color: C.ink }} />
        <button onClick={agregar} className="rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-1.5" style={{ background: TEAL, color: NAVY }}>
          <Plus size={14} /> Agregar
        </button>
        <button onClick={onAudio} title="Dictar tareas por audio" className="rounded-lg px-3.5 py-2 text-sm font-bold flex items-center gap-2"
          style={{ background: NAVY, color: "#F4F1EC" }}>
          <Mic size={15} /> Audio
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {columnas.map((col) => {
          const color = COL[col.id] || COL.extra;
          const ts = tareas.filter((t) => t.columna === col.id);
          return (
            <div key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (arrastrando) onMover(arrastrando, col.id); setArrastrando(null); }}
              className="rounded-xl p-3 shrink-0" style={{ background: color.bg, border: `1px solid ${color.border}`, width: 270 }}>
              <div className="flex items-center justify-between mb-3 px-1">
                <span style={{ color: color.header }} className="text-xs font-bold uppercase tracking-wide">
                  {col.nombre} ({ts.length})
                </span>
                {!col.fija && (
                  <button onClick={() => onEliminarColumna(col.id)} title="Eliminar columna (las tareas vuelven a 'Tareas de la semana')"
                    style={{ color: color.header, opacity: 0.7 }}><X size={13} /></button>
                )}
              </div>
              <div className="flex flex-col gap-2 min-h-[40px]">
                {ts.map((t) => (
                  <TarjetaTarea key={t.id} t={t} col={col} columnas={columnas} empresas={empresas} porId={porId}
                    nueva={recien.has(t.id)} arrastrando={arrastrando === t.id}
                    onDragStart={() => setArrastrando(t.id)} onDragEnd={() => setArrastrando(null)}
                    onMover={(c) => onMover(t.id, c)} onEmpresa={(emp) => onEmpresa(t.id, emp)}
                    onEliminar={() => onEliminar(t.id)} onBan={() => onBan(t)} />
                ))}
                {ts.length === 0 && <p style={{ color: C.soft }} className="text-xs text-center py-3">Sin tarjetas</p>}
              </div>
            </div>
          );
        })}

        {columnasExtra < MAX_COLUMNAS_EXTRA && (
          <div className="shrink-0" style={{ width: 270 }}>
            {mostrarFormColumna ? (
              <div className="rounded-xl p-3" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
                <input value={nuevaColumna} onChange={(e) => setNuevaColumna(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && crearColumna()} placeholder="Nombre de la columna" autoFocus
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-2" style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.ink }} />
                <div className="flex gap-2">
                  <button onClick={crearColumna} className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: TEAL, color: NAVY }}>Crear</button>
                  <button onClick={() => { setMostrarFormColumna(false); setNuevaColumna(""); }}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ color: C.muted }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setMostrarFormColumna(true)}
                className="w-full rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ height: 44, background: "transparent", border: `1px dashed ${C.line}`, color: C.soft }}>
                <Plus size={13} /> Agregar columna
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
