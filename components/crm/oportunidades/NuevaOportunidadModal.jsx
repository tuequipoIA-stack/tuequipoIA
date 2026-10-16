"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { C } from "@/lib/theme";
import { relISO } from "@/lib/fechas";
import { ETAPAS, ETAPAS_ORDEN, inp, btnTeal } from "./comun";

const vacio = (empresa) => ({ empresa: empresa || "", etapa: "calificado", cliente: "", rubro: "", valor: "", moneda: "USD", prox: relISO(3), contacto: "", tel: "" });

function Campo({ label, children, full }) {
  return (
    <div style={full ? { gridColumn: "1/-1" } : undefined}>
      <label className="block mb-1" style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{label}</label>
      {children}
    </div>
  );
}

// empresaNueva: id de una empresa recién creada desde este formulario (se selecciona sola)
export default function NuevaOportunidadModal(props) {
  if (!props.open) return null;
  return <Formulario {...props} />;
}

function Formulario({ onClose, empresas, empresaDefault, proxNum, onCrear, onNuevaEmpresa, empresaNueva }) {
  const [f, setF] = useState(() => vacio(empresaDefault));
  const [empresaVista, setEmpresaVista] = useState(empresaNueva);
  // Empresa recién creada desde el formulario: se selecciona sola
  if (empresaNueva !== empresaVista) {
    setEmpresaVista(empresaNueva);
    if (empresaNueva) setF((p) => ({ ...p, empresa: empresaNueva }));
  }
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const estilo = { ...inp, width: "100%" };

  const crear = () => {
    if (!f.cliente.trim()) return;
    onCrear(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,20,32,0.55)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ background: C.panel }}>
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-semibold" style={{ color: C.ink }}>Nueva oportunidad</h3>
          <button onClick={onClose} style={{ color: C.soft }}><X size={18} /></button>
        </div>
        <p className="mb-3.5" style={{ color: C.soft, fontSize: 12 }}>Se le asigna el número <b>#{proxNum}</b> automáticamente.</p>
        <div className="crmop-campos grid gap-2.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Campo label="Empresa">
            <select value={f.empresa} onChange={(e) => { if (e.target.value === "__nueva") onNuevaEmpresa(); else set("empresa")(e); }} style={estilo}>
              <option value="">Sin empresa</option>
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              <option value="__nueva">+ Nueva empresa…</option>
            </select>
          </Campo>
          <Campo label="Etapa">
            <select value={f.etapa} onChange={set("etapa")} style={estilo}>
              {ETAPAS_ORDEN.filter((k) => k !== "perdido").map((k) => <option key={k} value={k}>{ETAPAS[k].l}</option>)}
            </select>
          </Campo>
          <Campo label="Cliente">
            <input value={f.cliente} onChange={set("cliente")} placeholder="Nombre de la cuenta" style={estilo} autoFocus onKeyDown={(e) => e.key === "Enter" && crear()} />
          </Campo>
          <Campo label="Rubro / detalle">
            <input value={f.rubro} onChange={set("rubro")} placeholder="Ej: Alimentos · Mendoza" style={estilo} />
          </Campo>
          <Campo label="Valor estimado">
            <div className="flex gap-2">
              <input type="number" value={f.valor} onChange={set("valor")} placeholder="0" style={{ ...inp, flex: 1 }} />
              <select value={f.moneda} onChange={set("moneda")} style={{ ...inp, flex: "0 0 80px" }}>
                <option>USD</option><option>ARS</option>
              </select>
            </div>
          </Campo>
          <Campo label="Próximo contacto">
            <input type="date" value={f.prox} onChange={set("prox")} style={estilo} disabled={f.etapa === "ganado"} />
          </Campo>
          <Campo label="Contacto">
            <input value={f.contacto} onChange={set("contacto")} placeholder="Nombre / cargo" style={estilo} />
          </Campo>
          <Campo label="Teléfono">
            <input value={f.tel} onChange={set("tel")} placeholder="+54 9 …" style={estilo} />
          </Campo>
        </div>
        <div className="flex gap-2 mt-3.5 items-center">
          <button onClick={crear} disabled={!f.cliente.trim()} className="rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50" style={btnTeal}>Crear oportunidad</button>
          <button onClick={onClose} className="text-sm font-semibold px-2" style={{ color: C.muted }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
