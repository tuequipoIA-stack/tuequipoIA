"use client";

import { useEffect, useState } from "react";
import { Plus, Clock } from "lucide-react";
import { BRAND, CRM_ESTADOS_SUSCRIPCION } from "@/lib/constants";
import { money } from "@/lib/helpers";
import SuscripcionModal from "./SuscripcionModal";

function fechaLegible(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}`;
}

// Tablero del modo CRM "Suscripciones": columnas por estado de cobro (Al
// día / Por vencer / Vencida / Pausada). Mismo patrón que el Pipeline.
export default function SuscripcionesBoard({ unidadId }) {
  const [suscripciones, setSuscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [arrastrando, setArrastrando] = useState(null);

  useEffect(() => {
    if (!unidadId) return;
    setCargando(true);
    fetch(`/api/crm/suscripciones?unidadId=${encodeURIComponent(unidadId)}`)
      .then((r) => r.json())
      .then((d) => setSuscripciones(d.suscripciones || []))
      .finally(() => setCargando(false));
  }, [unidadId]);

  const abrirNueva = () => { setEditando(null); setModalAbierto(true); };
  const abrirEditar = (s) => { setEditando(s); setModalAbierto(true); };

  const guardar = async (datos) => {
    if (datos.id) {
      const res = await fetch(`/api/crm/suscripciones/${datos.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
      });
      const data = await res.json();
      if (data.suscripcion) setSuscripciones((prev) => prev.map((s) => (s.id === datos.id ? data.suscripcion : s)));
    } else {
      const res = await fetch("/api/crm/suscripciones", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...datos, unidadId }),
      });
      const data = await res.json();
      if (data.suscripcion) setSuscripciones((prev) => [data.suscripcion, ...prev]);
    }
    setModalAbierto(false);
  };

  const eliminar = async (id) => {
    await fetch(`/api/crm/suscripciones/${id}`, { method: "DELETE" });
    setSuscripciones((prev) => prev.filter((s) => s.id !== id));
    setModalAbierto(false);
  };

  const mover = async (id, estadoCobro) => {
    setSuscripciones((prev) => prev.map((s) => (s.id === id ? { ...s, estado_cobro: estadoCobro } : s)));
    const res = await fetch(`/api/crm/suscripciones/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estadoCobro }),
    });
    const data = await res.json();
    if (data.suscripcion) setSuscripciones((prev) => prev.map((s) => (s.id === id ? data.suscripcion : s)));
  };

  const mrrActivo = suscripciones
    .filter((s) => s.estado_cobro !== "pausada")
    .reduce((acc, s) => acc + Number(s.monto_mensual || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div style={{ color: "#8a8578" }} className="text-xs mb-1">Suscripciones</div>
          <div style={{ color: BRAND.navy }} className="text-xl font-semibold">{suscripciones.length}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div style={{ color: "#8a8578" }} className="text-xs mb-1">MRR activo</div>
          <div style={{ color: BRAND.teal }} className="text-xl font-semibold">{money(mrrActivo)}</div>
        </div>
      </div>

      <button onClick={abrirNueva} className="rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 mb-5"
        style={{ background: BRAND.teal, color: BRAND.navy }}>
        <Plus size={14} /> Nueva suscripción
      </button>

      {cargando ? (
        <p style={{ color: "#8a8578" }} className="text-sm">Cargando...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {CRM_ESTADOS_SUSCRIPCION.map((col) => {
            const items = suscripciones.filter((s) => s.estado_cobro === col.id);
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
                  {items.map((s) => (
                    <div key={s.id} draggable
                      onDragStart={() => setArrastrando(s.id)}
                      onDragEnd={() => setArrastrando(null)}
                      onClick={() => abrirEditar(s)}
                      className="rounded-lg p-3 cursor-grab active:cursor-grabbing"
                      style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                      <div style={{ color: BRAND.navy }} className="text-sm font-semibold">{s.cliente}</div>
                      {s.plan && <div style={{ color: "#8a8578" }} className="text-xs">{s.plan}</div>}
                      {s.monto_mensual > 0 && <div style={{ color: BRAND.teal }} className="text-xs font-semibold mt-1">{money(s.monto_mensual)}</div>}
                      {s.proximo_cobro && (
                        <div className="flex items-center gap-1 text-[11px] mt-1.5" style={{ color: "#8a8578" }}>
                          <Clock size={11} /> Cobro: {fechaLegible(s.proximo_cobro)}
                        </div>
                      )}
                      {s.proximo_touchpoint && (
                        <div className="flex items-center gap-1 text-[11px]" style={{ color: "#8a8578" }}>
                          <Clock size={11} /> Tocar al cliente: {fechaLegible(s.proximo_touchpoint)}
                        </div>
                      )}
                      <select value={s.estado_cobro}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => mover(s.id, e.target.value)}
                        className="mt-2 text-[10px] px-1.5 py-1 rounded-md font-medium outline-none w-full" style={{ background: "#eee9dd", color: "#6b6759", border: "none" }}>
                        {CRM_ESTADOS_SUSCRIPCION.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                      </select>
                    </div>
                  ))}
                  {items.length === 0 && <p style={{ color: "#a89f88" }} className="text-xs text-center py-3">Sin suscripciones</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SuscripcionModal open={modalAbierto} initial={editando} onClose={() => setModalAbierto(false)} onSave={guardar} onDelete={eliminar} />
    </div>
  );
}
