"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BRAND, CRM_ESTADOS_SUSCRIPCION } from "@/lib/constants";

// Modal para crear o editar una suscripción del CRM (modo Suscripciones).
export default function SuscripcionModal({ open, initial, onClose, onSave, onDelete }) {
  const [cliente, setCliente] = useState("");
  const [plan, setPlan] = useState("");
  const [montoMensual, setMontoMensual] = useState("");
  const [estadoCobro, setEstadoCobro] = useState("al_dia");
  const [proximoCobro, setProximoCobro] = useState("");
  const [proximoTouchpoint, setProximoTouchpoint] = useState("");

  useEffect(() => {
    if (!open) return;
    setCliente(initial?.cliente || "");
    setPlan(initial?.plan || "");
    setMontoMensual(initial?.monto_mensual ?? "");
    setEstadoCobro(initial?.estado_cobro || "al_dia");
    setProximoCobro(initial?.proximo_cobro ? initial.proximo_cobro.slice(0, 10) : "");
    setProximoTouchpoint(initial?.proximo_touchpoint ? initial.proximo_touchpoint.slice(0, 10) : "");
  }, [open, initial]);

  if (!open) return null;

  const guardar = () => {
    if (!cliente.trim()) return;
    onSave({
      id: initial?.id,
      cliente: cliente.trim(),
      plan: plan.trim(),
      montoMensual: montoMensual === "" ? null : Number(montoMensual),
      estadoCobro,
      proximoCobro: proximoCobro || null,
      proximoTouchpoint: proximoTouchpoint || null,
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
          <h3 style={{ color: BRAND.navy }} className="text-base font-semibold">{initial ? "Editar suscripción" : "Nueva suscripción"}</h3>
          <button onClick={onClose} style={{ color: "#8a8578" }}><X size={18} /></button>
        </div>

        <div className="space-y-3">
          {campo("Cliente", <input value={cliente} onChange={(e) => setCliente(e.target.value)} className={inputCls} style={inputStyle} />)}
          {campo("Plan", <input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Plan Pro, mensual..." className={inputCls} style={inputStyle} />)}
          <div className="grid grid-cols-2 gap-3">
            {campo("Monto mensual", <input type="number" value={montoMensual} onChange={(e) => setMontoMensual(e.target.value)} placeholder="$" className={inputCls} style={inputStyle} />)}
            {campo("Estado de cobro", (
              <select value={estadoCobro} onChange={(e) => setEstadoCobro(e.target.value)} className={inputCls} style={inputStyle}>
                {CRM_ESTADOS_SUSCRIPCION.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {campo("Próximo cobro", <input type="date" value={proximoCobro} onChange={(e) => setProximoCobro(e.target.value)} className={inputCls} style={inputStyle} />)}
            {campo("Tocar al cliente", <input type="date" value={proximoTouchpoint} onChange={(e) => setProximoTouchpoint(e.target.value)} className={inputCls} style={inputStyle} />)}
          </div>
        </div>

        <div className="flex items-center justify-between mt-5">
          {initial ? (
            <button onClick={() => onDelete(initial.id)} className="text-xs font-medium" style={{ color: "#b3453f" }}>
              Eliminar suscripción
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
