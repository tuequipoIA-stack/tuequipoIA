"use client";

import { useEffect, useState } from "react";
import { Plus, Clock, Trophy } from "lucide-react";
import { BRAND, CRM_MODOS, CRM_ETAPAS_PIPELINE } from "@/lib/constants";
import { useUnidad } from "@/components/UnidadProvider";
import { money } from "@/lib/helpers";
import ProspectoModal from "@/components/crm/ProspectoModal";
import ConversionModal from "@/components/crm/ConversionModal";
import SuscripcionesBoard from "@/components/crm/SuscripcionesBoard";
import PacientesBoard from "@/components/crm/PacientesBoard";
import CrmDashboard from "@/components/crm/CrmDashboard";

// Columnas visuales del tablero: las 4 etapas intermedias + una columna
// final que agrupa "ganado" y "perdido" (igual que el mockup de referencia).
const COLUMNAS_TABLERO = [
  { id: "contacto_inicial", label: "Contacto inicial", etapas: ["contacto_inicial"] },
  { id: "calificado", label: "Calificado", etapas: ["calificado"] },
  { id: "propuesta_enviada", label: "Propuesta enviada", etapas: ["propuesta_enviada"] },
  { id: "negociacion", label: "Negociación", etapas: ["negociacion"] },
  { id: "ganado_perdido", label: "Ganado / Perdido", etapas: ["ganado", "perdido"] },
];

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function fechaLegible(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}`;
}

function PipelineBoard({ unidadId }) {
  const [prospectos, setProspectos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [prospectoEditando, setProspectoEditando] = useState(null);
  const [arrastrando, setArrastrando] = useState(null);
  const [prospectoConvirtiendo, setProspectoConvirtiendo] = useState(null);

  useEffect(() => {
    if (!unidadId) return;
    setCargando(true);
    fetch(`/api/crm/prospectos?unidadId=${encodeURIComponent(unidadId)}`)
      .then((r) => r.json())
      .then((d) => setProspectos(d.prospectos || []))
      .finally(() => setCargando(false));
  }, [unidadId]);

  const abrirNuevo = () => { setProspectoEditando(null); setModalAbierto(true); };
  const abrirEditar = (p) => { setProspectoEditando(p); setModalAbierto(true); };
  const cerrarModal = () => setModalAbierto(false);

  const guardarProspecto = async (datos) => {
    if (datos.id) {
      const res = await fetch(`/api/crm/prospectos/${datos.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const data = await res.json();
      if (data.prospecto) setProspectos((prev) => prev.map((p) => (p.id === datos.id ? data.prospecto : p)));
    } else {
      const res = await fetch("/api/crm/prospectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, unidadId }),
      });
      const data = await res.json();
      if (data.prospecto) setProspectos((prev) => [data.prospecto, ...prev]);
    }
    setModalAbierto(false);
  };

  const eliminarProspecto = async (id) => {
    await fetch(`/api/crm/prospectos/${id}`, { method: "DELETE" });
    setProspectos((prev) => prev.filter((p) => p.id !== id));
    setModalAbierto(false);
  };

  const moverProspecto = async (id, etapa) => {
    setProspectos((prev) => prev.map((p) => (p.id === id ? { ...p, etapa } : p)));
    const res = await fetch(`/api/crm/prospectos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapa }),
    });
    const data = await res.json();
    if (data.prospecto) setProspectos((prev) => prev.map((p) => (p.id === id ? data.prospecto : p)));
  };

  const confirmarConversion = async (datos) => {
    const prospecto = prospectoConvirtiendo;
    const resProyecto = await fetch("/api/crm/proyectos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unidadId,
        prospectoOrigenId: prospecto.id,
        cliente: datos.cliente,
        servicio: datos.servicio,
        monto: datos.monto,
        formaPago: datos.formaPago,
        responsable: datos.responsable,
        fechaInicio: datos.fechaInicio,
        mantenimientoActivo: datos.mantenimientoActivo,
      }),
    });
    const dataProyecto = await resProyecto.json();
    if (!dataProyecto.proyecto) return;

    if (datos.mantenimientoActivo) {
      await fetch("/api/crm/mantenimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unidadId,
          proyectoId: dataProyecto.proyecto.id,
          montoMensual: datos.montoMensual,
          diaCobro: datos.diaCobro,
          proximoCobro: datos.proximoCobro,
        }),
      });
    }

    await moverProspecto(prospecto.id, "ganado");
    setProspectoConvirtiendo(null);
  };

  const prospectosActivos = prospectos.filter((p) => p.etapa !== "ganado" && p.etapa !== "perdido");
  const valorPropuestaEnviada = prospectos
    .filter((p) => p.etapa === "propuesta_enviada")
    .reduce((acc, p) => acc + Number(p.valor_estimado || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div style={{ color: "#8a8578" }} className="text-xs mb-1">Prospectos activos</div>
          <div style={{ color: BRAND.navy }} className="text-xl font-semibold">{prospectosActivos.length}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div style={{ color: "#8a8578" }} className="text-xs mb-1">Valor en propuestas enviadas</div>
          <div style={{ color: BRAND.teal }} className="text-xl font-semibold">{money(valorPropuestaEnviada)}</div>
        </div>
      </div>

      <button onClick={abrirNuevo} className="rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 mb-5"
        style={{ background: BRAND.teal, color: BRAND.navy }}>
        <Plus size={14} /> Nuevo prospecto
      </button>

      {cargando ? (
        <p style={{ color: "#8a8578" }} className="text-sm">Cargando...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMNAS_TABLERO.map((col) => {
            const items = prospectos.filter((p) => col.etapas.includes(p.etapa));
            const valorColumna = items.reduce((acc, p) => acc + Number(p.valor_estimado || 0), 0);
            return (
              <div key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => arrastrando && moverProspecto(arrastrando, col.etapas[0])}
                className="rounded-xl p-3 shrink-0" style={{ background: "#f0ece2", border: "1px solid #e4dfd3", width: "260px" }}>
                <div className="flex items-center justify-between mb-1 px-1">
                  <span style={{ color: "#6b6759" }} className="text-xs font-semibold uppercase tracking-wide">
                    {col.label} ({items.length})
                  </span>
                </div>
                {valorColumna > 0 && (
                  <div style={{ color: "#a89f88" }} className="text-[11px] px-1 mb-2">{money(valorColumna)}</div>
                )}
                <div className="space-y-2 min-h-[40px]">
                  {items.map((p) => {
                    const vencido = p.fecha_proximo_contacto && p.fecha_proximo_contacto.slice(0, 10) < hoyISO();
                    return (
                      <div key={p.id} draggable
                        onDragStart={() => setArrastrando(p.id)}
                        onDragEnd={() => setArrastrando(null)}
                        onClick={() => abrirEditar(p)}
                        className="rounded-lg p-3 cursor-grab active:cursor-grabbing"
                        style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                        <div style={{ color: BRAND.navy }} className="text-sm font-semibold">{p.nombre}</div>
                        {p.empresa && <div style={{ color: "#8a8578" }} className="text-xs">{p.empresa}</div>}
                        {p.valor_estimado > 0 && (
                          <div style={{ color: BRAND.teal }} className="text-xs font-semibold mt-1">{money(p.valor_estimado)}</div>
                        )}
                        {p.fecha_proximo_contacto && (
                          <div className="flex items-center gap-1 text-[11px] mt-1.5" style={{ color: vencido ? "#b3453f" : "#8a8578" }}>
                            <Clock size={11} /> {vencido ? "Vencido" : "Seguimiento"}: {fechaLegible(p.fecha_proximo_contacto)}
                          </div>
                        )}
                        <select value={col.etapas.includes(p.etapa) ? p.etapa : col.etapas[0]}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => moverProspecto(p.id, e.target.value)}
                          className="mt-2 text-[10px] px-1.5 py-1 rounded-md font-medium outline-none w-full" style={{ background: "#eee9dd", color: "#6b6759", border: "none" }}>
                          {CRM_ETAPAS_PIPELINE.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                        </select>
                        {p.etapa !== "ganado" && p.etapa !== "perdido" && (
                          <button onClick={(e) => { e.stopPropagation(); setProspectoConvirtiendo(p); }}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold"
                            style={{ background: BRAND.teal, color: BRAND.navy }}>
                            <Trophy size={11} /> Marcar como Ganado
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <p style={{ color: "#a89f88" }} className="text-xs text-center py-3">Sin prospectos</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProspectoModal open={modalAbierto} initial={prospectoEditando} onClose={cerrarModal} onSave={guardarProspecto} onDelete={eliminarProspecto} />
      <ConversionModal open={!!prospectoConvirtiendo} prospecto={prospectoConvirtiendo} onClose={() => setProspectoConvirtiendo(null)} onConfirm={confirmarConversion} />
    </div>
  );
}

export default function CrmSection({ business }) {
  const { unidadId } = useUnidad();
  const modosActivos = business?.crmModos || [];
  const [modoActivo, setModoActivo] = useState(modosActivos[0] || "pipeline");

  useEffect(() => {
    if (modosActivos.length && !modosActivos.includes(modoActivo)) setModoActivo(modosActivos[0]);
  }, [business?.crmModos]);

  if (!modosActivos.length) {
    return (
      <div>
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">CRM</h2>
        <p style={{ color: "#6b6759" }} className="text-sm">
          Todavía no activaste ningún modo de CRM. Podés hacerlo desde Perfil.
        </p>
      </div>
    );
  }

  const labelModo = (id) => (id === "dashboard" ? "Dashboard" : CRM_MODOS.find((m) => m.id === id)?.label || id);
  const SUBTITULOS = {
    pipeline: "Seguimiento de posibles clientes, desde el primer contacto hasta que cierran.",
    suscripciones: "Clientes con cobro recurrente. El cobro y el vínculo se siguen por separado.",
    pacientes: "Pacientes o clientes recurrentes, organizados por fase del vínculo.",
    dashboard: "KPIs y embudo del CRM, de un vistazo.",
  };
  const tabsAMostrar = [...modosActivos, "dashboard"];

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">CRM</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">{SUBTITULOS[modoActivo]}</p>

      <div className="flex gap-1.5 mb-5">
        {tabsAMostrar.map((m) => (
          <button key={m} onClick={() => setModoActivo(m)} className="px-3 py-1.5 rounded-md text-xs font-medium"
            style={modoActivo === m ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
            {labelModo(m)}
          </button>
        ))}
      </div>

      {modoActivo === "pipeline" && <PipelineBoard unidadId={unidadId} />}
      {modoActivo === "suscripciones" && <SuscripcionesBoard unidadId={unidadId} />}
      {modoActivo === "pacientes" && <PacientesBoard unidadId={unidadId} />}
      {modoActivo === "dashboard" && <CrmDashboard unidadId={unidadId} />}
    </div>
  );
}
