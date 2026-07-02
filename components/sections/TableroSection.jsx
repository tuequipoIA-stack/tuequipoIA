"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { BRAND, COLUMNAS_BASE, MAX_COLUMNAS_EXTRA } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid, migrarColumna } from "@/lib/helpers";

// Colores pastel por columna: semana (naranja clarito), hoy (celeste), hecho (verde clarito).
// Las columnas extra que arme el usuario quedan con el tono neutro de siempre.
const COLUMNA_COLOR = {
  semana: { bg: "#fdf1e2", header: "#c98a3d", border: "#f5e2c4" },
  hoy: { bg: "#e8f1fb", header: "#3b74ad", border: "#d3e5f7" },
  hecho: { bg: "#e9f6ec", header: "#3f9457", border: "#d3ecd9" },
};
const COLUMNA_COLOR_DEFAULT = { bg: "#f0ece2", header: "#6b6759", border: "#e4dfd3" };

export default function TableroSection() {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [columnas, setColumnas] = useState(COLUMNAS_BASE);
  const [tareas, setTareas] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [nuevaColumna, setNuevaColumna] = useState("");
  const [mostrarFormColumna, setMostrarFormColumna] = useState(false);
  const [arrastrando, setArrastrando] = useState(null);

  useEffect(() => {
    if (!unidadId) return;
    loadData("tablero-columnas", COLUMNAS_BASE).then(setColumnas);
    loadData("tablero-tareas", []).then(async (d) => {
      const migradas = d.map((t) => ({ ...t, columna: migrarColumna(t.columna) }));
      setTareas(migradas);
      const huboCambios = d.some((t, i) => t.columna !== migradas[i].columna);
      if (huboCambios) await saveData("tablero-tareas", migradas);
    });
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

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Organización</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">Arrastrá las tarjetas entre columnas, o usá los botones en mobile.</p>

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
    </div>
  );
}
