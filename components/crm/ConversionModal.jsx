"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BRAND } from "@/lib/constants";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// Primera fecha de cobro >= fechaInicio que caiga en diaCobro (1-31).
function calcularProximoCobro(fechaInicio, diaCobro) {
  if (!fechaInicio || !diaCobro) return null;
  const [y, m, d] = fechaInicio.split("-").map(Number);
  let año = y, mes = m; // mes en base 1
  if (d > diaCobro) { mes += 1; if (mes > 12) { mes = 1; año += 1; } }
  const ultimoDiaMes = new Date(año, mes, 0).getDate();
  const dia = Math.min(diaCobro, ultimoDiaMes);
  return `${año}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// Modal de conversión "Marcar como Ganado": convierte un prospecto del
// Pipeline en un proyecto de Ventas (ventas_proyectos), con la opción de
// dejarlo con mantenimiento mensual (ventas_mantenimiento).
export default function ConversionModal({ open, prospecto, onClose, onConfirm }) {
  const [cliente, setCliente] = useState("");
  const [servicio, setServicio] = useState("");
  const [monto, setMonto] = useState("");
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [formaPago, setFormaPago] = useState("");
  const [responsable, setResponsable] = useState("");
  const [conMantenimiento, setConMantenimiento] = useState(false);
  const [montoMensual, setMontoMensual] = useState("");
  const [diaCobro, setDiaCobro] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCliente(prospecto?.nombre || "");
    setServicio(prospecto?.servicio_interes || "");
    setMonto(prospecto?.valor_estimado ?? "");
    setFechaInicio(hoyISO());
    setFormaPago("");
    setResponsable(prospecto?.responsable || "");
    setConMantenimiento(false);
    setMontoMensual("");
    setDiaCobro("");
    setGuardando(false);
  }, [open, prospecto]);

  if (!open) return null;

  const confirmar = async () => {
    if (!cliente.trim() || !monto || (conMantenimiento && !montoMensual)) return;
    setGuardando(true);
    await onConfirm({
      cliente: cliente.trim(),
      servicio: servicio.trim(),
      monto: Number(monto),
      fechaInicio,
      formaPago: formaPago.trim(),
      responsable: responsable.trim(),
      mantenimientoActivo: conMantenimiento,
      montoMensual: conMantenimiento ? Number(montoMensual) : null,
      diaCobro: conMantenimiento && diaCobro ? Number(diaCobro) : null,
      proximoCobro: conMantenimiento && diaCobro ? calcularProximoCobro(fechaInicio, Number(diaCobro)) : null,
    });
    setGuardando(false);
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
        <div className="flex items-center justify-between mb-1">
          <h3 style={{ color: BRAND.navy }} className="text-base font-semibold">Marcar como Ganado</h3>
          <button onClick={onClose} style={{ color: "#8a8578" }}><X size={18} /></button>
        </div>
        <p style={{ color: "#8a8578" }} className="text-xs mb-4">Se crea el proyecto en Ventas y el prospecto pasa a &quot;Ganado&quot;.</p>

        <div className="space-y-3">
          {campo("Cliente", <input value={cliente} onChange={(e) => setCliente(e.target.value)} className={inputCls} style={inputStyle} />)}
          {campo("Servicio", <input value={servicio} onChange={(e) => setServicio(e.target.value)} className={inputCls} style={inputStyle} />)}
          <div className="grid grid-cols-2 gap-3">
            {campo("Monto final", <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="$" className={inputCls} style={inputStyle} />)}
            {campo("Fecha de inicio", <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={inputCls} style={inputStyle} />)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {campo("Forma de pago", <input value={formaPago} onChange={(e) => setFormaPago(e.target.value)} placeholder="Transferencia, cuotas..." className={inputCls} style={inputStyle} />)}
            {campo("Responsable", <input value={responsable} onChange={(e) => setResponsable(e.target.value)} className={inputCls} style={inputStyle} />)}
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input type="checkbox" checked={conMantenimiento} onChange={(e) => setConMantenimiento(e.target.checked)} />
            <span style={{ color: BRAND.navy }} className="text-sm font-medium">Queda con mantenimiento mensual</span>
          </label>

          {conMantenimiento && (
            <div className="grid grid-cols-2 gap-3 rounded-lg p-3" style={{ background: "#f0ece2" }}>
              {campo("Monto mensual", <input type="number" value={montoMensual} onChange={(e) => setMontoMensual(e.target.value)} placeholder="$" className={inputCls} style={inputStyle} />)}
              {campo("Día de cobro", <input type="number" min="1" max="31" value={diaCobro} onChange={(e) => setDiaCobro(e.target.value)} placeholder="Ej: 10" className={inputCls} style={inputStyle} />)}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: "#eee9dd", color: "#6b6759" }}>
            Cancelar
          </button>
          <button onClick={confirmar} disabled={guardando} className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: BRAND.teal, color: BRAND.navy }}>
            {guardando ? "Guardando..." : "Confirmar y crear proyecto"}
          </button>
        </div>
      </div>
    </div>
  );
}
