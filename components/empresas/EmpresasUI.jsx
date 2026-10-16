"use client";

import { useState } from "react";
import { Settings, Trash2, X, Plus } from "lucide-react";
import { C, tint } from "@/lib/theme";
import { PALETA_EMPRESAS, MODELOS_GANANCIA } from "@/lib/empresas";

// Etiqueta de empresa para tarjetas y tablas.
export function EmpresaTag({ empresa }) {
  if (!empresa) {
    return (
      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.chip, color: C.soft }}>
        Sin empresa
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: tint(empresa.color, 0.15), color: empresa.color }}>
      ● {empresa.nombre}
    </span>
  );
}

// Chips de filtro: Todas · cada empresa · (Sin empresa) · + Nueva empresa
// conteo(id) devuelve la cantidad a mostrar; id "todas" y "sin" son especiales.
export function FiltroEmpresas({ empresas, filtro, onChange, conteo, mostrarSin = false, onNueva, onGestionar, titulo = "Ver" }) {
  const chip = (activo, color) => ({
    background: activo && color ? tint(color, 0.14) : C.chip,
    color: activo ? color || C.ink : C.muted,
    border: `1.5px solid ${activo ? color || C.ink : "transparent"}`,
  });
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      {(titulo || onGestionar) && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wide" style={{ color: C.soft }}>{titulo}</span>
          {onGestionar && (
            <button onClick={onGestionar} className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.tealDark }}>
              <Settings size={12} /> Gestionar empresas
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => onChange("todas")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={chip(filtro === "todas")}>
          Todas {conteo && <span className="text-[10px] font-bold opacity-70">{conteo("todas")}</span>}
        </button>
        {empresas.map((e) => (
          <button key={e.id} onClick={() => onChange(e.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={chip(filtro === e.id, e.color)}>
            <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
            {e.nombre} {conteo && <span className="text-[10px] font-bold opacity-70">{conteo(e.id)}</span>}
          </button>
        ))}
        {mostrarSin && conteo && conteo("sin") > 0 && (
          <button onClick={() => onChange("sin")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={chip(filtro === "sin")}>
            <span className="w-2 h-2 rounded-full" style={{ background: C.soft }} /> Sin empresa
            <span className="text-[10px] font-bold opacity-70">{conteo("sin")}</span>
          </button>
        )}
        {onNueva && (
          <button onClick={onNueva} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ border: `1.5px dashed ${C.line}`, color: C.muted }}>
            <Plus size={12} /> Nueva empresa
          </button>
        )}
      </div>
    </div>
  );
}

// Selector de empresa (select) con opción "Sin empresa".
export function SelectEmpresa({ empresas, value, onChange, conSin = true, className = "", style = {} }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value || null)} className={className}
      style={{ background: C.card, border: `1px solid ${C.line}`, outline: "none", ...style }}>
      {conSin && <option value="">Sin empresa</option>}
      {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
    </select>
  );
}

// Modal para ver, crear y borrar empresas (incluye el modelo de ganancia).
// usos(id) → cantidad de cosas que usan la empresa (para mostrar al costado).
export function EmpresasModal({ open, onClose, empresasApi, usos, soloCrear = false, onCreada }) {
  const { empresas, crear, eliminar } = empresasApi;
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(PALETA_EMPRESAS[3]);
  const [modelo, setModelo] = useState("ninguno");
  const [pct, setPct] = useState("");
  const [agencia, setAgencia] = useState("25");
  const [hora, setHora] = useState("");
  if (!open) return null;

  const confirmar = async () => {
    if (!nombre.trim()) return;
    const nueva = await crear({
      nombre, color, modelo,
      pct: pct === "" ? undefined : parseFloat(pct),
      agencia: modelo === "agencia" ? parseFloat(agencia) || 0 : undefined,
      hora: modelo === "propio" ? parseFloat(hora) || 0 : undefined,
    });
    setNombre(""); setPct(""); setHora(""); setModelo("ninguno");
    setColor(PALETA_EMPRESAS[(empresas.length + 1) % PALETA_EMPRESAS.length]);
    onCreada?.(nueva);
    if (soloCrear) onClose();
  };

  const input = { background: C.panel, border: `1px solid ${C.line}`, outline: "none" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,20,32,0.55)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl p-5 max-h-[88vh] overflow-y-auto" style={{ background: C.panel }}>
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-semibold" style={{ color: C.ink }}>{soloCrear ? "Nueva empresa" : "Tus empresas"}</h3>
          <button onClick={onClose} style={{ color: C.soft }}><X size={18} /></button>
        </div>
        <p className="text-xs mb-4" style={{ color: C.soft }}>Se comparten entre Organización, CRM y Ventas.</p>

        {!soloCrear && empresas.map((e) => (
          <div key={e.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 mb-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <span className="w-3.5 h-3.5 rounded shrink-0" style={{ background: e.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: C.ink }}>{e.nombre}</div>
              <div className="text-[11px] truncate" style={{ color: C.soft }}>{MODELOS_GANANCIA.find((m) => m.id === (e.modelo || "ninguno"))?.label}</div>
            </div>
            {usos && <span className="text-[11px]" style={{ color: C.soft }}>{usos(e.id)}</span>}
            <button title="Eliminar empresa (lo asignado queda sin empresa)" onClick={() => eliminar(e.id)} style={{ color: C.danger }}><Trash2 size={13} /></button>
          </div>
        ))}

        <div className="rounded-xl p-3 mt-3" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
          <label className="text-[11px] font-bold block mb-1" style={{ color: C.muted }}>Nueva empresa</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmar()}
            placeholder="Ej: LiftyFive" className="w-full rounded-lg px-3 py-2 text-sm mb-3" style={input} autoFocus />
          <label className="text-[11px] font-bold block mb-1.5" style={{ color: C.muted }}>Color</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PALETA_EMPRESAS.map((c) => (
              <button key={c} onClick={() => setColor(c)} className="w-6 h-6 rounded-full"
                style={{ background: c, boxShadow: c === color ? `0 0 0 2px ${C.ink}` : `0 0 0 1px ${C.line}`, border: `3px solid ${C.card}` }} />
            ))}
          </div>
          <label className="text-[11px] font-bold block mb-1" style={{ color: C.muted }}>Cómo ganás en esta empresa</label>
          <select value={modelo} onChange={(e) => setModelo(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm mb-2" style={input}>
            {MODELOS_GANANCIA.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          {(modelo === "cuotas" || modelo === "agencia") && (
            <div className="flex gap-2 mb-2">
              <label className="flex-1 text-[11px]" style={{ color: C.muted }}>Tu comisión %
                <input type="number" value={pct} onChange={(e) => setPct(e.target.value)} className="w-full rounded-lg px-2 py-1.5 text-sm mt-1" style={input} />
              </label>
              {modelo === "agencia" && (
                <label className="flex-1 text-[11px]" style={{ color: C.muted }}>Agencia % (predeterminada)
                  <input type="number" value={agencia} onChange={(e) => setAgencia(e.target.value)} className="w-full rounded-lg px-2 py-1.5 text-sm mt-1" style={input} />
                </label>
              )}
            </div>
          )}
          {modelo === "propio" && (
            <label className="block text-[11px] mb-2" style={{ color: C.muted }}>Valor de tu hora ($)
              <input type="number" value={hora} onChange={(e) => setHora(e.target.value)} className="w-full rounded-lg px-2 py-1.5 text-sm mt-1" style={input} />
            </label>
          )}
          <button onClick={confirmar} disabled={!nombre.trim()} className="rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
            style={{ background: "#1AABAA", color: "#1A1A2E" }}>
            Crear empresa
          </button>
        </div>
      </div>
    </div>
  );
}
