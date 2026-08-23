"use client";

import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { BRAND, VENTAS_ETAPAS_SEGUIMIENTO } from "@/lib/constants";
import { money } from "@/lib/helpers";
import ProyectoFicha from "./ProyectoFicha";

// Kanban de ventas_proyectos: Contrato firmado → Kickoff → En desarrollo →
// Revisión/Entrega → Cobrado → En mantenimiento (esta última solo alcanzable
// si el proyecto tiene mantenimiento_activo).
export default function SeguimientoBoard({ unidadId }) {
  const [proyectos, setProyectos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [arrastrando, setArrastrando] = useState(null);
  const [proyectoAbierto, setProyectoAbierto] = useState(null);

  useEffect(() => {
    if (!unidadId) return;
    setCargando(true);
    fetch(`/api/crm/proyectos?unidadId=${encodeURIComponent(unidadId)}`)
      .then((r) => r.json())
      .then((d) => setProyectos(d.proyectos || []))
      .finally(() => setCargando(false));
  }, [unidadId]);

  const moverProyecto = async (id, etapaSeguimiento) => {
    const proyecto = proyectos.find((p) => p.id === id);
    if (etapaSeguimiento === "en_mantenimiento" && !proyecto?.mantenimiento_activo) return;
    setProyectos((prev) => prev.map((p) => (p.id === id ? { ...p, etapa_seguimiento: etapaSeguimiento } : p)));
    const res = await fetch(`/api/crm/proyectos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapaSeguimiento }),
    });
    const data = await res.json();
    if (data.proyecto) setProyectos((prev) => prev.map((p) => (p.id === id ? data.proyecto : p)));
  };

  const guardarResumen = async (cambios) => {
    const res = await fetch(`/api/crm/proyectos/${proyectoAbierto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });
    const data = await res.json();
    if (data.proyecto) {
      setProyectos((prev) => prev.map((p) => (p.id === data.proyecto.id ? data.proyecto : p)));
      setProyectoAbierto(data.proyecto);
    }
  };

  if (cargando) return <p style={{ color: "#8a8578" }} className="text-sm">Cargando...</p>;

  if (proyectos.length === 0) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: "#ffffff", border: "1px dashed #d8d2c3" }}>
        <Briefcase size={20} color="#b3ab98" className="mx-auto mb-2" />
        <p style={{ color: "#8a8578" }} className="text-sm">Todavía no hay proyectos. Se crean automáticamente al marcar un prospecto del CRM como &quot;Ganado&quot;.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {VENTAS_ETAPAS_SEGUIMIENTO.map((col) => {
          const items = proyectos.filter((p) => p.etapa_seguimiento === col.id);
          if (col.id === "en_mantenimiento" && items.length === 0 && !proyectos.some((p) => p.mantenimiento_activo)) return null;
          return (
            <div key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => arrastrando && moverProyecto(arrastrando, col.id)}
              className="rounded-xl p-3 shrink-0" style={{ background: "#f0ece2", border: "1px solid #e4dfd3", width: "260px" }}>
              <div className="flex items-center justify-between mb-2 px-1">
                <span style={{ color: "#6b6759" }} className="text-xs font-semibold uppercase tracking-wide">
                  {col.label} ({items.length})
                </span>
              </div>
              <div className="space-y-2 min-h-[40px]">
                {items.map((p) => (
                  <div key={p.id} draggable
                    onDragStart={() => setArrastrando(p.id)}
                    onDragEnd={() => setArrastrando(null)}
                    onClick={() => setProyectoAbierto(p)}
                    className="rounded-lg p-3 cursor-grab active:cursor-grabbing"
                    style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                    <div style={{ color: BRAND.navy }} className="text-sm font-semibold">{p.cliente}</div>
                    {p.servicio && <div style={{ color: "#8a8578" }} className="text-xs">{p.servicio}</div>}
                    {p.monto > 0 && <div style={{ color: BRAND.teal }} className="text-xs font-semibold mt-1">{money(p.monto)}</div>}
                    {p.mantenimiento_activo && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full inline-block mt-1.5" style={{ background: "#eef7f6", color: "#127a79" }}>
                        Con mantenimiento
                      </span>
                    )}
                    <select value={p.etapa_seguimiento}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => moverProyecto(p.id, e.target.value)}
                      className="mt-2 text-[10px] px-1.5 py-1 rounded-md font-medium outline-none w-full" style={{ background: "#eee9dd", color: "#6b6759", border: "none" }}>
                      {VENTAS_ETAPAS_SEGUIMIENTO.filter((e) => e.id !== "en_mantenimiento" || p.mantenimiento_activo).map((e) => (
                        <option key={e.id} value={e.id}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
                {items.length === 0 && <p style={{ color: "#a89f88" }} className="text-xs text-center py-3">Sin proyectos</p>}
              </div>
            </div>
          );
        })}
      </div>

      <ProyectoFicha open={!!proyectoAbierto} proyecto={proyectoAbierto} onClose={() => setProyectoAbierto(null)} onGuardarResumen={guardarResumen} />
    </div>
  );
}
