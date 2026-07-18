"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BRAND } from "@/lib/constants";

// Modal para crear o editar un cliente (nombre, teléfono, correo, anotaciones).
// Se usa tanto desde la sección Clientes ("+ Nuevo cliente") como desde el
// desplegable de cliente en Ventas ("+ Crear cliente nuevo"), sin salir de
// la vista en la que estás.
export default function ClienteModal({ open, initial, onClose, onSave }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [anotaciones, setAnotaciones] = useState("");

  useEffect(() => {
    if (open) {
      setNombre(initial?.nombre || "");
      setTelefono(initial?.telefono || "");
      setCorreo(initial?.correo || "");
      setAnotaciones(initial?.anotaciones || "");
    }
  }, [open, initial]);

  if (!open) return null;

  const guardar = () => {
    if (!nombre.trim()) return;
    onSave({
      id: initial?.id,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
      anotaciones: anotaciones.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,20,32,0.55)" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl p-5" style={{ background: BRAND.cream }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ color: BRAND.navy }} className="text-base font-semibold">{initial ? "Editar cliente" : "Nuevo cliente"}</h3>
          <button onClick={onClose} style={{ color: "#8a8578" }}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <span style={{ color: "#8a8578" }} className="text-[11px] block mb-1">Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido"
              onKeyDown={(e) => e.key === "Enter" && guardar()}
              className="rounded-lg px-3 py-2 text-sm outline-none w-full" style={{ border: "1px solid #e4dfd3" }} />
          </div>
          <div>
            <span style={{ color: "#8a8578" }} className="text-[11px] block mb-1">Teléfono</span>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 2617039143"
              onKeyDown={(e) => e.key === "Enter" && guardar()}
              className="rounded-lg px-3 py-2 text-sm outline-none w-full" style={{ border: "1px solid #e4dfd3" }} />
          </div>
          <div>
            <span style={{ color: "#8a8578" }} className="text-[11px] block mb-1">Correo</span>
            <input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="nombre@mail.com"
              onKeyDown={(e) => e.key === "Enter" && guardar()}
              className="rounded-lg px-3 py-2 text-sm outline-none w-full" style={{ border: "1px solid #e4dfd3" }} />
          </div>
          <div>
            <span style={{ color: "#8a8578" }} className="text-[11px] block mb-1">Anotaciones</span>
            <textarea value={anotaciones} onChange={(e) => setAnotaciones(e.target.value)} rows={3}
              placeholder="Preferencias, historial, lo que quieras recordar..."
              className="rounded-lg px-3 py-2 text-sm outline-none w-full resize-none" style={{ border: "1px solid #e4dfd3" }} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: "#eee9dd", color: "#6b6759" }}>
            Cancelar
          </button>
          <button onClick={guardar} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: BRAND.teal, color: BRAND.navy }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
