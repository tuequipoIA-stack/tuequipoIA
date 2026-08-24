"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BRAND, CRM_FASES_PACIENTE } from "@/lib/constants";

// Modal para crear o editar un paciente/cliente recurrente del CRM (modo
// Pacientes). Sin monto, sin ganado/perdido — el foco está en la próxima sesión.
export default function PacienteModal({ open, initial, onClose, onSave, onDelete }) {
  const [nombre, setNombre] = useState("");
  const [motivo, setMotivo] = useState("");
  const [frecuencia, setFrecuencia] = useState("");
  const [fase, setFase] = useState("primera_consulta");
  const [ultimaSesion, setUltimaSesion] = useState("");
  const [proximaSesion, setProximaSesion] = useState("");

  useEffect(() => {
    if (!open) return;
    setNombre(initial?.nombre || "");
    setMotivo(initial?.motivo || "");
    setFrecuencia(initial?.frecuencia || "");
    setFase(initial?.fase || "primera_consulta");
    setUltimaSesion(initial?.ultima_sesion ? initial.ultima_sesion.slice(0, 10) : "");
    setProximaSesion(initial?.proxima_sesion ? initial.proxima_sesion.slice(0, 10) : "");
  }, [open, initial]);

  if (!open) return null;

  const guardar = () => {
    if (!nombre.trim()) return;
    onSave({
      id: initial?.id,
      nombre: nombre.trim(),
      motivo: motivo.trim(),
      frecuencia: frecuencia.trim(),
      fase,
      ultimaSesion: ultimaSesion || null,
      proximaSesion: proximaSesion || null,
    });
  };

  const inputCls = "rounded-lg px-3 py-2 text-sm outline-none w-full";
  const inputStyle = { border: "1px solid #e4dfd3" };
  const campo = (label, input) => (
    <div>
      <span style={{ color: "#8a8578" }} className="text-[11px] block mb-1">{label}</span>
      {input}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,20,32,0.55)" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ background: BRAND.cream }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ color: BRAND.navy }} className="text-base font-semibold">{initial ? "Editar paciente" : "Nuevo paciente"}</h3>
          <button onClick={onClose} style={{ color: "#8a8578" }}><X size={18} /></button>
        </div>

        <div className="space-y-3">
          {campo("Nombre", <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} style={inputStyle} />)}
          {campo("Motivo / tipo", <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: kinesiología, terapia..." className={inputCls} style={inputStyle} />)}
          <div className="grid grid-cols-2 gap-3">
            {campo("Frecuencia", <input value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} placeholder="Semanal, quincenal..." className={inputCls} style={inputStyle} />)}
            {campo("Fase", (
              <select value={fase} onChange={(e) => setFase(e.target.value)} className={inputCls} style={inputStyle}>
                {CRM_FASES_PACIENTE.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {campo("Última sesión", <input type="date" value={ultimaSesion} onChange={(e) => setUltimaSesion(e.target.value)} className={inputCls} style={inputStyle} />)}
            {campo("Próxima sesión", <input type="date" value={proximaSesion} onChange={(e) => setProximaSesion(e.target.value)} className={inputCls} style={inputStyle} />)}
          </div>
        </div>

        <div className="flex items-center justify-between mt-5">
          {initial ? (
            <button onClick={() => onDelete(initial.id)} className="text-xs font-medium" style={{ color: "#b3453f" }}>
              Eliminar paciente
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: "#eee9dd", color: "#6b6759" }}>
              Cancelar
            </button>
            <button onClick={guardar} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: BRAND.teal, color: BRAND.navy }}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
