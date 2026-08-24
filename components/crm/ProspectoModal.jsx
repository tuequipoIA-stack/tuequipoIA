"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BRAND, CRM_ETAPAS_PIPELINE } from "@/lib/constants";

const PRIORIDADES = [
  { id: "alta", label: "Alta" },
  { id: "media", label: "Media" },
  { id: "baja", label: "Baja" },
];

// Modal para crear o editar un prospecto del CRM (modo Pipeline). Mismo
// patrón visual que ClienteModal.
export default function ProspectoModal({ open, initial, onClose, onSave, onDelete }) {
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [servicioInteres, setServicioInteres] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");
  const [etapa, setEtapa] = useState("contacto_inicial");
  const [canalOrigen, setCanalOrigen] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [proximaAccion, setProximaAccion] = useState("");
  const [fechaProximoContacto, setFechaProximoContacto] = useState("");
  const [responsable, setResponsable] = useState("");
  const [motivoEstancamiento, setMotivoEstancamiento] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (!open) return;
    setNombre(initial?.nombre || "");
    setEmpresa(initial?.empresa || "");
    setCargo(initial?.cargo || "");
    setTelefono(initial?.telefono || "");
    setEmail(initial?.email || "");
    setServicioInteres(initial?.servicio_interes || "");
    setValorEstimado(initial?.valor_estimado ?? "");
    setEtapa(initial?.etapa || "contacto_inicial");
    setCanalOrigen(initial?.canal_origen || "");
    setPrioridad(initial?.prioridad || "");
    setProximaAccion(initial?.proxima_accion || "");
    setFechaProximoContacto(initial?.fecha_proximo_contacto ? initial.fecha_proximo_contacto.slice(0, 10) : "");
    setResponsable(initial?.responsable || "");
    setMotivoEstancamiento(initial?.motivo_estancamiento || "");
    setNotas(initial?.notas || "");
  }, [open, initial]);

  if (!open) return null;

  const guardar = () => {
    if (!nombre.trim()) return;
    onSave({
      id: initial?.id,
      nombre: nombre.trim(),
      empresa: empresa.trim(),
      cargo: cargo.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      servicioInteres: servicioInteres.trim(),
      valorEstimado: valorEstimado === "" ? null : Number(valorEstimado),
      etapa,
      canalOrigen: canalOrigen.trim(),
      prioridad: prioridad || null,
      proximaAccion: proximaAccion.trim(),
      fechaProximoContacto: fechaProximoContacto || null,
      responsable: responsable.trim(),
      motivoEstancamiento: motivoEstancamiento.trim(),
      notas: notas.trim(),
    });
  };

  const campo = (label, input) => (
    <div>
      <span style={{ color: "#8a8578" }} className="text-[11px] block mb-1">{label}</span>
      {input}
    </div>
  );

  const inputCls = "rounded-lg px-3 py-2 text-sm outline-none w-full";
  const inputStyle = { border: "1px solid #e4dfd3" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,20,32,0.55)" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ background: BRAND.cream }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ color: BRAND.navy }} className="text-base font-semibold">{initial ? "Editar prospecto" : "Nuevo prospecto"}</h3>
          <button onClick={onClose} style={{ color: "#8a8578" }}><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            {campo("Nombre", <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido"
              className={inputCls} style={inputStyle} />)}
          </div>
          {campo("Empresa", <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} className={inputCls} style={inputStyle} />)}
          {campo("Cargo", <input value={cargo} onChange={(e) => setCargo(e.target.value)} className={inputCls} style={inputStyle} />)}
          {campo("Teléfono", <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputCls} style={inputStyle} />)}
          {campo("Email", <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} style={inputStyle} />)}
          <div className="col-span-2">
            {campo("Servicio de interés", <input value={servicioInteres} onChange={(e) => setServicioInteres(e.target.value)} className={inputCls} style={inputStyle} />)}
          </div>
          {campo("Valor estimado", <input type="number" value={valorEstimado} onChange={(e) => setValorEstimado(e.target.value)} placeholder="$" className={inputCls} style={inputStyle} />)}
          {campo("Etapa", (
            <select value={etapa} onChange={(e) => setEtapa(e.target.value)} className={inputCls} style={inputStyle}>
              {CRM_ETAPAS_PIPELINE.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          ))}
          {campo("Canal de origen", <input value={canalOrigen} onChange={(e) => setCanalOrigen(e.target.value)} placeholder="Instagram, referido..." className={inputCls} style={inputStyle} />)}
          {campo("Prioridad", (
            <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">Sin definir</option>
              {PRIORIDADES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          ))}
          {campo("Responsable", <input value={responsable} onChange={(e) => setResponsable(e.target.value)} className={inputCls} style={inputStyle} />)}
          {campo("Próximo contacto", <input type="date" value={fechaProximoContacto} onChange={(e) => setFechaProximoContacto(e.target.value)} className={inputCls} style={inputStyle} />)}
          <div className="col-span-2">
            {campo("Próxima acción", <input value={proximaAccion} onChange={(e) => setProximaAccion(e.target.value)} placeholder="Ej: mandar propuesta" className={inputCls} style={inputStyle} />)}
          </div>
          <div className="col-span-2">
            {campo("Motivo de estancamiento", <input value={motivoEstancamiento} onChange={(e) => setMotivoEstancamiento(e.target.value)} placeholder="Si está trabado, por qué" className={inputCls} style={inputStyle} />)}
          </div>
          <div className="col-span-2">
            {campo("Notas", <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} className={`${inputCls} resize-none`} style={inputStyle} />)}
          </div>
        </div>

        <div className="flex items-center justify-between mt-5">
          {initial ? (
            <button onClick={() => onDelete(initial.id)} className="text-xs font-medium" style={{ color: "#b3453f" }}>
              Eliminar prospecto
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
