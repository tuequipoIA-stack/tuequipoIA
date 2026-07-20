"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Target, Check } from "lucide-react";
import { BRAND, COLUMNAS_BASE, MAX_COLUMNAS_EXTRA, MESES } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid, migrarColumna } from "@/lib/helpers";
import AudioAyuda from "@/components/AudioAyuda";
import { AUDIO_GUIONES, AUDIO_ARCHIVOS } from "@/lib/audioGuiones";

// Colores pastel por columna: semana (naranja clarito), hoy (celeste), hecho (verde clarito).
// Las columnas extra que arme el usuario quedan con el tono neutro de siempre.
const COLUMNA_COLOR = {
  semana: { bg: "#fdf1e2", header: "#c98a3d", border: "#f5e2c4" },
  hoy: { bg: "#e8f1fb", header: "#3b74ad", border: "#d3e5f7" },
  hecho: { bg: "#e9f6ec", header: "#3f9457", border: "#d3ecd9" },
};
const COLUMNA_COLOR_DEFAULT = { bg: "#f0ece2", header: "#6b6759", border: "#e4dfd3" };

function fechaLegible(fechaISOStr) {
  if (!fechaISOStr) return null;
  const [y, m, d] = fechaISOStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function TableroSection() {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [tab, setTab] = useState("bajados"); // "bajados" | "grandes"

  // --- Objetivos bajados a tierra (tablero original) ---
  const [columnas, setColumnas] = useState(COLUMNAS_BASE);
  const [tareas, setTareas] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [nuevaColumna, setNuevaColumna] = useState("");
  const [mostrarFormColumna, setMostrarFormColumna] = useState(false);
  const [arrastrando, setArrastrando] = useState(null);

  // --- Grandes objetivos ---
  const [objetivos, setObjetivos] = useState([]);
  const [objetivoAbiertoId, setObjetivoAbiertoId] = useState(null);
  const [nuevoObjetivoTitulo, setNuevoObjetivoTitulo] = useState("");
  const [nuevoObjetivoMes, setNuevoObjetivoMes] = useState("");
  const [mostrarFormObjetivo, setMostrarFormObjetivo] = useState(false);
  const [nuevaTareaObjTexto, setNuevaTareaObjTexto] = useState("");
  const [nuevaTareaObjFecha, setNuevaTareaObjFecha] = useState("");
  const [transcritas, setTranscritas] = useState({});

  useEffect(() => {
    if (!unidadId) return;
    loadData("tablero-columnas", COLUMNAS_BASE).then(setColumnas);
    loadData("tablero-tareas", []).then(async (d) => {
      const migradas = d.map((t) => ({ ...t, columna: migrarColumna(t.columna) }));
      setTareas(migradas);
      const huboCambios = d.some((t, i) => t.columna !== migradas[i].columna);
      if (huboCambios) await saveData("tablero-tareas", migradas);
    });
    loadData("grandes-objetivos", []).then(setObjetivos);
  }, [unidadId]);

  const columnasExtra = columnas.filter((c) => !c.fija).length;

  const agregarTarea = async () => {
    if (!nuevaTarea.trim()) return;
    const t = { id: uid(), texto: nuevaTarea.trim(), columna: "semana" };
    const actualizado = [...tareas, t];
    setTareas(actualizado);
    await saveData("tablero-tareas", actualizado);
    setNuevaTarea("");
  };

  const moverTarea = async (id, columna) => {
    const actualizado = tareas.map((t) => (t.id === id ? { ...t, columna } : t));
    setTareas(actualizado);
    await saveData("tablero-tareas", actualizado);
  };

  const eliminarTarea = async (id) => {
    const actualizado = tareas.filter((t) => t.id !== id);
    setTareas(actualizado);
    await saveData("tablero-tareas", actualizado);
  };

  const agregarColumna = async () => {
    if (!nuevaColumna.trim() || columnasExtra >= MAX_COLUMNAS_EXTRA) return;
    const nueva = { id: uid(), nombre: nuevaColumna.trim(), fija: false };
    const actualizado = [...columnas, nueva];
    setColumnas(actualizado);
    await saveData("tablero-columnas", actualizado);
    setNuevaColumna("");
    setMostrarFormColumna(false);
  };

  const eliminarColumna = async (id) => {
    const actualizado = columnas.filter((c) => c.id !== id);
    setColumnas(actualizado);
    await saveData("tablero-columnas", actualizado);
    // mover las tareas de esa columna a "semana" para no perderlas
    const tareasActualizadas = tareas.map((t) => (t.columna === id ? { ...t, columna: "semana" } : t));
    setTareas(tareasActualizadas);
    await saveData("tablero-tareas", tareasActualizadas);
  };

  // --- Grandes objetivos: acciones ---
  const agregarObjetivo = async () => {
    if (!nuevoObjetivoTitulo.trim()) return;
    const o = { id: uid(), titulo: nuevoObjetivoTitulo.trim(), mes: nuevoObjetivoMes || null, tareas: [] };
    const actualizado = [...objetivos, o];
    setObjetivos(actualizado);
    await saveData("grandes-objetivos", actualizado);
    setNuevoObjetivoTitulo("");
    setNuevoObjetivoMes("");
    setMostrarFormObjetivo(false);
    setObjetivoAbiertoId(o.id);
  };

  const eliminarObjetivo = async (id) => {
    const actualizado = objetivos.filter((o) => o.id !== id);
    setObjetivos(actualizado);
    await saveData("grandes-objetivos", actualizado);
    if (objetivoAbiertoId === id) setObjetivoAbiertoId(null);
  };

  const actualizarMesObjetivo = async (id, mes) => {
    const actualizado = objetivos.map((o) => (o.id === id ? { ...o, mes: mes || null } : o));
    setObjetivos(actualizado);
    await saveData("grandes-objetivos", actualizado);
  };

  const agregarTareaObjetivo = async (objetivoId) => {
    if (!nuevaTareaObjTexto.trim()) return;
    const nueva = { id: uid(), texto: nuevaTareaObjTexto.trim(), fecha: nuevaTareaObjFecha || null };
    const actualizado = objetivos.map((o) => (o.id === objetivoId ? { ...o, tareas: [...o.tareas, nueva] } : o));
    setObjetivos(actualizado);
    await saveData("grandes-objetivos", actualizado);
    setNuevaTareaObjTexto("");
    setNuevaTareaObjFecha("");
  };

  const eliminarTareaObjetivo = async (objetivoId, tareaId) => {
    const actualizado = objetivos.map((o) =>
      o.id === objetivoId ? { ...o, tareas: o.tareas.filter((t) => t.id !== tareaId) } : o
    );
    setObjetivos(actualizado);
    await saveData("grandes-objetivos", actualizado);
  };

  const transcribirATareaSemana = async (tareaObj) => {
    const t = { id: uid(), texto: tareaObj.texto, columna: "semana" };
    const actualizado = [...tareas, t];
    setTareas(actualizado);
    await saveData("tablero-tareas", actualizado);
    setTranscritas((prev) => ({ ...prev, [tareaObj.id]: true }));
    setTimeout(() => {
      setTranscritas((prev) => {
        const copia = { ...prev };
        delete copia[tareaObj.id];
        return copia;
      });
    }, 1500);
  };

  const objetivoAbierto = objetivos.find((o) => o.id === objetivoAbiertoId);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold">Organización</h2>
        <AudioAyuda texto={AUDIO_GUIONES[`tablero:${tab}`]} audioSrc={AUDIO_ARCHIVOS.tablero} />
      </div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">
        {tab === "bajados" ? "Arrastrá las tarjetas entre columnas, o usá los botones en mobile." : "Definí tus grandes objetivos y desglosalos en tareas concretas."}
      </p>

      <div className="flex gap-1.5 mb-5">
        <button onClick={() => setTab("bajados")} className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={tab === "bajados" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
          Objetivos bajados a tierra
        </button>
        <button onClick={() => setTab("grandes")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
          style={tab === "grandes" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
          <Target size={12} /> Grandes objetivos
        </button>
      </div>

      {tab === "bajados" ? (
        <>
          <div className="flex gap-2 mb-6">
            <input value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agregarTarea()}
              placeholder="Nueva tarea (va a 'Tareas de la semana')..." className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }} />
            <button onClick={agregarTarea} className="rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5"
              style={{ background: BRAND.teal, color: BRAND.navy }}>
              <Plus size={14} /> Agregar
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {columnas.map((col) => {
              const color = COLUMNA_COLOR[col.id] || COLUMNA_COLOR_DEFAULT;
              return (
              <div key={col.id} draggable={false}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => arrastrando && moverTarea(arrastrando, col.id)}
                className="rounded-xl p-3 shrink-0" style={{ background: color.bg, border: `1px solid ${color.border}`, width: "260px" }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span style={{ color: color.header }} className="text-xs font-semibold uppercase tracking-wide">
                    {col.nombre} ({tareas.filter((t) => t.columna === col.id).length})
                  </span>
                  {!col.fija && (
                    <button onClick={() => eliminarColumna(col.id)} style={{ color: color.header, opacity: 0.7 }}><X size={13} /></button>
                  )}
                </div>
                <div className="space-y-2 min-h-[40px]">
                  {tareas.filter((t) => t.columna === col.id).map((t) => (
                    <div key={t.id} draggable
                      onDragStart={() => setArrastrando(t.id)}
                      onDragEnd={() => setArrastrando(null)}
                      className="rounded-lg p-3 cursor-grab active:cursor-grabbing" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                      <div style={{ color: BRAND.navy, textDecoration: col.id === "hecho" ? "line-through" : "none" }} className="text-sm mb-2">
                        {t.texto}
                      </div>
                      <div className="flex items-center justify-between">
                        <select value={col.id} onChange={(e) => moverTarea(t.id, e.target.value)}
                          className="text-[10px] px-1.5 py-1 rounded-md font-medium outline-none" style={{ background: "#eee9dd", color: "#6b6759", border: "none" }}>
                          {columnas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                        <button onClick={() => eliminarTarea(t.id)} style={{ color: "#b3453f" }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                  {tareas.filter((t) => t.columna === col.id).length === 0 && (
                    <p style={{ color: "#a89f88" }} className="text-xs text-center py-3">Sin tarjetas</p>
                  )}
                </div>
              </div>
              );
            })}

            {/* columna para agregar una nueva */}
            {columnasExtra < MAX_COLUMNAS_EXTRA && (
              <div className="shrink-0" style={{ width: "260px" }}>
                {mostrarFormColumna ? (
                  <div className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px dashed #d8d2c3" }}>
                    <input value={nuevaColumna} onChange={(e) => setNuevaColumna(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && agregarColumna()} placeholder="Nombre de la columna"
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-2" style={{ border: "1px solid #e4dfd3" }} />
                    <div className="flex gap-2">
                      <button onClick={agregarColumna} className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{ background: BRAND.teal, color: BRAND.navy }}>Crear</button>
                      <button onClick={() => { setMostrarFormColumna(false); setNuevaColumna(""); }} className="rounded-lg px-3 py-1.5 text-xs font-medium"
                        style={{ color: "#6b6759" }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setMostrarFormColumna(true)}
                    className="w-full rounded-xl p-3 text-xs font-medium flex items-center justify-center gap-1.5"
                    style={{ background: "transparent", border: "1px dashed #d8d2c3", color: "#8a8578" }}>
                    <Plus size={13} /> Agregar columna
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {objetivos.map((o) => (
              <div key={o.id} role="button" tabIndex={0} onClick={() => setObjetivoAbiertoId(o.id)}
                onKeyDown={(e) => e.key === "Enter" && setObjetivoAbiertoId(o.id)}
                className="text-left rounded-xl p-4 relative hover:opacity-90 cursor-pointer"
                style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                <button onClick={(e) => { e.stopPropagation(); eliminarObjetivo(o.id); }}
                  className="absolute top-2 right-2" style={{ color: "#b3453f" }}><Trash2 size={13} /></button>

                <select value={o.mes || ""} onClick={(e) => e.stopPropagation()}
                  onChange={(e) => actualizarMesObjetivo(o.id, e.target.value)}
                  className="text-[10px] px-1.5 py-1 rounded-md font-semibold outline-none mb-2 inline-block"
                  style={{ background: "#eef7f6", color: BRAND.teal, border: "none" }}>
                  <option value="">Sin mes</option>
                  {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>

                <div className="flex items-center gap-2 mb-1">
                  <Target size={15} color={BRAND.teal} />
                  <span style={{ color: BRAND.navy }} className="text-sm font-semibold pr-4">{o.titulo}</span>
                </div>
                <span style={{ color: "#a89f88" }} className="text-xs">{o.tareas.length} {o.tareas.length === 1 ? "tarea" : "tareas"}</span>
              </div>
            ))}

            {mostrarFormObjetivo ? (
              <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px dashed #d8d2c3" }}>
                <select value={nuevoObjetivoMes} onChange={(e) => setNuevoObjetivoMes(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-2" style={{ border: "1px solid #e4dfd3", color: "#6b6759" }}>
                  <option value="">Sin mes</option>
                  {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <input value={nuevoObjetivoTitulo} onChange={(e) => setNuevoObjetivoTitulo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && agregarObjetivo()} placeholder="Título del objetivo"
                  autoFocus className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-2" style={{ border: "1px solid #e4dfd3" }} />
                <div className="flex gap-2">
                  <button onClick={agregarObjetivo} className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{ background: BRAND.teal, color: BRAND.navy }}>Crear</button>
                  <button onClick={() => { setMostrarFormObjetivo(false); setNuevoObjetivoTitulo(""); setNuevoObjetivoMes(""); }} className="rounded-lg px-3 py-1.5 text-xs font-medium"
                    style={{ color: "#6b6759" }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setMostrarFormObjetivo(true)}
                className="rounded-xl p-4 text-xs font-medium flex items-center justify-center gap-1.5 min-h-[80px]"
                style={{ background: "transparent", border: "1px dashed #d8d2c3", color: "#8a8578" }}>
                <Plus size={13} /> Nuevo gran objetivo
              </button>
            )}
          </div>

          {objetivos.length === 0 && !mostrarFormObjetivo && (
            <p style={{ color: "#a89f88" }} className="text-xs mt-3">Todavía no cargaste ningún gran objetivo.</p>
          )}
        </>
      )}

      {/* Modal de detalle de un gran objetivo — tapa toda la pantalla */}
      {objetivoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,20,32,0.55)" }}
          onClick={() => setObjetivoAbiertoId(null)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
            style={{ background: BRAND.cream }}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <select value={objetivoAbierto.mes || ""} onChange={(e) => actualizarMesObjetivo(objetivoAbierto.id, e.target.value)}
                  className="text-[10px] px-1.5 py-1 rounded-md font-semibold outline-none mb-1.5 inline-block"
                  style={{ background: "#eef7f6", color: BRAND.teal, border: "none" }}>
                  <option value="">Sin mes</option>
                  {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <Target size={17} color={BRAND.teal} />
                  <h3 style={{ color: BRAND.navy }} className="text-lg font-semibold">{objetivoAbierto.titulo}</h3>
                </div>
              </div>
              <button onClick={() => setObjetivoAbiertoId(null)} style={{ color: "#8a8578" }}><X size={18} /></button>
            </div>
            <p style={{ color: "#8a8578" }} className="text-xs mb-4">
              Sumá tareas chicas para este objetivo. El botón <Plus size={10} className="inline" style={{ verticalAlign: "middle" }} /> las manda a "Tareas de la semana" en la otra pestaña.
            </p>

            <div className="space-y-2 mb-4">
              {objetivoAbierto.tareas.map((t) => (
                <div key={t.id} className="rounded-lg p-3 flex items-center justify-between gap-2"
                  style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                  <div className="min-w-0">
                    <div style={{ color: BRAND.navy }} className="text-sm truncate">{t.texto}</div>
                    {t.fecha && <div style={{ color: "#a89f88" }} className="text-[10px] mt-0.5">{fechaLegible(t.fecha)}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => transcribirATareaSemana(t)} title="Pasar a 'Tareas de la semana'"
                      className="rounded-md p-1.5 flex items-center justify-center"
                      style={transcritas[t.id] ? { background: "#e9f6ec", color: "#3f9457" } : { background: BRAND.teal, color: BRAND.navy }}>
                      {transcritas[t.id] ? <Check size={13} /> : <Plus size={13} />}
                    </button>
                    <button onClick={() => eliminarTareaObjetivo(objetivoAbierto.id, t.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
              {objetivoAbierto.tareas.length === 0 && (
                <p style={{ color: "#a89f88" }} className="text-xs text-center py-3">Todavía no hay tareas cargadas.</p>
              )}
            </div>

            <div className="rounded-lg p-3" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
              <input value={nuevaTareaObjTexto} onChange={(e) => setNuevaTareaObjTexto(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agregarTareaObjetivo(objetivoAbierto.id)}
                placeholder="Nueva tarea chica..." className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-2" style={{ border: "1px solid #e4dfd3" }} />
              <div className="flex gap-2">
                <input type="date" value={nuevaTareaObjFecha} onChange={(e) => setNuevaTareaObjFecha(e.target.value)}
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
                <button onClick={() => agregarTareaObjetivo(objetivoAbierto.id)} className="rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 shrink-0"
                  style={{ background: BRAND.teal, color: BRAND.navy }}>
                  <Plus size={14} /> Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
