"use client";

import { useEffect, useState } from "react";
import { Plus, Clock } from "lucide-react";
import { BRAND, CRM_FASES_PACIENTE } from "@/lib/constants";
import PacienteModal from "./PacienteModal";

function fechaLegible(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}`;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// Tablero del modo CRM "Pacientes": columnas por fase del vínculo, sin
// monto ni ganado/perdido — foco en la próxima sesión. Mismo patrón que
// el Pipeline.
export default function PacientesBoard({ unidadId }) {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [arrastrando, setArrastrando] = useState(null);

  useEffect(() => {
    if (!unidadId) return;
    setCargando(true);
    fetch(`/api/crm/pacientes?unidadId=${encodeURIComponent(unidadId)}`)
      .then((r) => r.json())
      .then((d) => setPacientes(d.pacientes || []))
      .finally(() => setCargando(false));
  }, [unidadId]);

  const abrirNuevo = () => { setEditando(null); setModalAbierto(true); };
  const abrirEditar = (p) => { setEditando(p); setModalAbierto(true); };

  const guardar = async (datos) => {
    if (datos.id) {
      const res = await fetch(`/api/crm/pacientes/${datos.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
      });
      const data = await res.json();
      if (data.paciente) setPacientes((prev) => prev.map((p) => (p.id === datos.id ? data.paciente : p)));
    } else {
      const res = await fetch("/api/crm/pacientes", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...datos, unidadId }),
      });
      const data = await res.json();
      if (data.paciente) setPacientes((prev) => [data.paciente, ...prev]);
    }
    setModalAbierto(false);
  };

  const eliminar = async (id) => {
    await fetch(`/api/crm/pacientes/${id}`, { method: "DELETE" });
    setPacientes((prev) => prev.filter((p) => p.id !== id));
    setModalAbierto(false);
  };

  const mover = async (id, fase) => {
    setPacientes((prev) => prev.map((p) => (p.id === id ? { ...p, fase } : p)));
    const res = await fetch(`/api/crm/pacientes/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fase }),
    });
    const data = await res.json();
    if (data.paciente) setPacientes((prev) => prev.map((p) => (p.id === id ? data.paciente : p)));
  };

  const activos = pacientes.filter((p) => p.fase !== "alta_pausa").length;

  return (
    <div>
      <div className="rounded-xl p-4 mb-5 inline-block" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div style={{ color: "#8a8578" }} className="text-xs mb-1">Pacientes activos</div>
        <div style={{ color: BRAND.navy }} className="text-xl font-semibold">{activos}</div>
      </div>

      <div>
        <button onClick={abrirNuevo} className="rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 mb-5"
          style={{ background: BRAND.teal, color: BRAND.navy }}>
          <Plus size={14} /> Nuevo paciente
        </button>
      </div>

      {cargando ? (
        <p style={{ color: "#8a8578" }} className="text-sm">Cargando...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {CRM_FASES_PACIENTE.map((col) => {
            const items = pacientes.filter((p) => p.fase === col.id);
            return (
              <div key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => arrastrando && mover(arrastrando, col.id)}
                className="rounded-xl p-3 shrink-0" style={{ background: "#f0ece2", border: "1px solid #e4dfd3", width: "260px" }}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span style={{ color: "#6b6759" }} className="text-xs font-semibold uppercase tracking-wide">
                    {col.label} ({items.length})
                  </span>
                </div>
                <div className="space-y-2 min-h-[40px]">
                  {items.map((p) => {
                    const vencida = p.proxima_sesion && p.proxima_sesion.slice(0, 10) < hoyISO();
                    return (
                      <div key={p.id} draggable
                        onDragStart={() => setArrastrando(p.id)}
                        onDragEnd={() => setArrastrando(null)}
                        onClick={() => abrirEditar(p)}
                        className="rounded-lg p-3 cursor-grab active:cursor-grabbing"
                        style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                        <div style={{ color: BRAND.navy }} className="text-sm font-semibold">{p.nombre}</div>
                        {p.motivo && <div style={{ color: "#8a8578" }} className="text-xs">{p.motivo}</div>}
                        {p.frecuencia && <div style={{ color: "#a89f88" }} className="text-[11px]">{p.frecuencia}</div>}
                        {p.proxima_sesion && (
                          <div className="flex items-center gap-1 text-[11px] mt-1.5" style={{ color: vencida ? "#b3453f" : "#8a8578" }}>
                            <Clock size={11} /> Próxima sesión: {fechaLegible(p.proxima_sesion)}
                          </div>
                        )}
                        <select value={p.fase}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => mover(p.id, e.target.value)}
                          className="mt-2 text-[10px] px-1.5 py-1 rounded-md font-medium outline-none w-full" style={{ background: "#eee9dd", color: "#6b6759", border: "none" }}>
                          {CRM_FASES_PACIENTE.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                      </div>
                    );
                  })}
                  {items.length === 0 && <p style={{ color: "#a89f88" }} className="text-xs text-center py-3">Sin pacientes</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PacienteModal open={modalAbierto} initial={editando} onClose={() => setModalAbierto(false)} onSave={guardar} onDelete={eliminar} />
    </div>
  );
}
