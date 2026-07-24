"use client";

import { useEffect, useMemo, useState } from "react";
import { BRAND } from "@/lib/constants";
import { PROJECTS, todayStr } from "@/lib/panel/constants";
import { leadsApi, cobrosApi, listasApi, checklistApi } from "@/lib/panel/api";
import PanelProyecto from "@/components/sections/panel/PanelProyecto";
import PanelSeguimiento from "@/components/sections/panel/PanelSeguimiento";
import PanelCobros from "@/components/sections/panel/PanelCobros";
import PanelContactos from "@/components/sections/panel/PanelContactos";
import PanelListas from "@/components/sections/panel/PanelListas";

// Punto de entrada único del Panel de Comunicación (CRM interno de Marisa).
// Solo se monta cuando isAdmin === true (ver app/page.js). Cada botón del
// grupo "TuequipoIA Panel" del Sidebar corresponde a un valor de `vista`
// ("panel-resumen", "panel-membresias", etc). Todos los datos (leads,
// cobros, listas, checklist) se cargan acá una sola vez y se
// pasan hacia abajo, así todas las vistas ven siempre lo mismo.

function Toast({ mensaje }) {
  if (!mensaje) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg" style={{ background: BRAND.navy }}>
      {mensaje}
    </div>
  );
}

export default function PanelSection({ vista }) {
  const [leads, setLeads] = useState(null);
  const [cobros, setCobros] = useState(null);
  const [listas, setListas] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const cargarTodo = () => {
    Promise.all([leadsApi.list(), cobrosApi.list(), listasApi.list(), checklistApi.list()])
      .then(([ls, cs, lis, chk]) => {
        setLeads(ls);
        setCobros(cs);
        setListas(lis);
        const porProyecto = {};
        Object.keys(PROJECTS).forEach((k) => {
          const fila = chk.find((c) => c.proyecto === k);
          porProyecto[k] = fila ? fila.items : PROJECTS[k].defaultCheck.map((t) => ({ text: t, done: false }));
        });
        setChecklist(porProyecto);
      })
      .catch((e) => setError(e.message || "No se pudo cargar el panel."));
  };

  useEffect(() => { cargarTodo(); }, []);

  // ---- Leads ----
  const agregarLead = async (lead) => {
    const nuevo = await leadsApi.create(lead);
    setLeads((prev) => [nuevo, ...(prev || [])]);
    showToast("Contacto agregado");
  };
  const actualizarLead = async (id, patch) => {
    const actualizado = await leadsApi.update(id, patch);
    setLeads((prev) => (prev || []).map((l) => (l.id === id ? actualizado : l)));
    return actualizado;
  };
  const eliminarLead = async (id) => {
    await leadsApi.remove(id);
    setLeads((prev) => (prev || []).filter((l) => l.id !== id));
    setCobros((prev) => (prev || []).filter((c) => c.lead_id !== id));
    showToast("Contacto eliminado");
  };
  const importarLeads = async (leadsNuevos) => {
    const creados = [];
    for (const l of leadsNuevos) {
      try { creados.push(await leadsApi.create(l)); } catch (e) { /* seguimos con el resto */ }
    }
    setLeads((prev) => [...creados, ...(prev || [])]);
    return creados.length;
  };

  // ---- Seguimiento / kanban ----
  const enviarASeguimiento = async (leadId) => {
    await actualizarLead(leadId, { enSeguimiento: true, etapa: "Reunión coordinada" });
    showToast("Enviado a Seguimiento de Interesados");
  };
  const moverEtapa = async (leadId, nuevaEtapa) => {
    const lead = (leads || []).find((l) => l.id === leadId);
    if (!lead) return;
    if (nuevaEtapa === "Confirmado") {
      const montoTexto = window.prompt(`Monto acordado para ${lead.nombre}${lead.empresa ? ` (${lead.empresa})` : ""}:`, "");
      if (montoTexto === null) return;
      const monto = parseFloat(String(montoTexto).replace(",", ".")) || 0;
      const cobro = await cobrosApi.create({ leadId: lead.id, nombre: lead.nombre, empresa: lead.empresa, monto, proximoCobro: null, notas: null });
      setCobros((prev) => [cobro, ...(prev || [])]);
      await actualizarLead(leadId, { enSeguimiento: false, etapa: null, estado: "Cerrado ganado" });
      showToast("Confirmado — movido a Cobros");
      return;
    }
    const patch = { etapa: nuevaEtapa };
    if (nuevaEtapa === "Perdido") patch.estado = "Cerrado perdido";
    else if (lead.estado === "Cerrado perdido") patch.estado = "Seguimiento";
    await actualizarLead(leadId, patch);
  };

  // ---- Cobros ----
  const actualizarCobro = async (id, patch) => {
    const actualizado = await cobrosApi.update(id, patch);
    setCobros((prev) => (prev || []).map((c) => (c.id === id ? actualizado : c)));
  };
  const eliminarCobro = async (id) => {
    await cobrosApi.remove(id);
    setCobros((prev) => (prev || []).filter((c) => c.id !== id));
    showToast("Registro de cobro eliminado");
  };

  // ---- Listas ----
  const guardarLista = async (nombre, leadIds, editId) => {
    if (editId) {
      const actualizada = await listasApi.update(editId, { nombre, leadIds });
      setListas((prev) => (prev || []).map((l) => (l.id === editId ? actualizada : l)));
      showToast("Lista actualizada");
    } else {
      const creada = await listasApi.create({ nombre, leadIds });
      setListas((prev) => [creada, ...(prev || [])]);
      showToast("Lista creada");
    }
  };
  const eliminarLista = async (id) => {
    await listasApi.remove(id);
    setListas((prev) => (prev || []).filter((l) => l.id !== id));
    showToast("Lista eliminada");
  };

  // ---- Checklist ----
  const guardarChecklist = async (proyecto, items) => {
    await checklistApi.save(proyecto, items);
    setChecklist((prev) => ({ ...prev, [proyecto]: items }));
  };

  const cargando = leads === null || cobros === null || listas === null || checklist === null;

  if (error) {
    return <p style={{ color: "#b3453f" }} className="text-sm">{error}</p>;
  }
  if (cargando) {
    return <p style={{ color: "#8a8578" }} className="text-sm">Cargando panel...</p>;
  }

  const props = {
    leads, cobros, listas, checklist,
    agregarLead, actualizarLead, eliminarLead, importarLeads,
    enviarASeguimiento, moverEtapa,
    actualizarCobro, eliminarCobro,
    guardarLista, eliminarLista,
    guardarChecklist,
    showToast,
  };

  return (
    <div>
      {vista === "panel-resumen" && <PanelResumen {...props} />}
      {vista === "panel-membresias" && <PanelProyecto proyectoKey="ia" {...props} />}
      {vista === "panel-apps" && <PanelProyecto proyectoKey="apps" {...props} />}
      {vista === "panel-seguimiento" && <PanelSeguimiento {...props} />}
      {vista === "panel-cobros" && <PanelCobros {...props} />}
      {vista === "panel-contactos" && <PanelContactos {...props} />}
      {vista === "panel-listas" && <PanelListas {...props} />}
      <Toast mensaje={toast} />
    </div>
  );
}

function PanelResumen({ leads }) {
  const cards = Object.keys(PROJECTS).map((key) => {
    const p = PROJECTS[key];
    const list = leads.filter((l) => l.proyecto === key);
    const enSeguimiento = list.filter((l) => l.estado === "Seguimiento" || l.estado === "Contactado").length;
    return { key, p, total: list.length, enSeguimiento };
  });
  const maxTotal = Math.max(1, ...cards.map((c) => c.total));

  const urgentes = leads
    .filter((l) => l.proxima_accion && l.proxima_accion <= todayStr())
    .sort((a, b) => a.proxima_accion.localeCompare(b.proxima_accion));

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Resumen del Panel</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">Membresías (Portal para Emprendedores) · Apps a Medida (por rubro).</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {cards.map(({ key, p, total, enSeguimiento }) => (
          <div key={key} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3", borderTop: `3px solid ${p.color}` }}>
            <h3 style={{ color: BRAND.navy }} className="text-sm font-semibold mb-1">{p.nombre}</h3>
            <div style={{ color: BRAND.navy }} className="text-2xl font-bold">{total}</div>
            <div style={{ color: "#8a8578" }} className="text-xs mt-1">contactos totales · {enSeguimiento} en seguimiento</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 mb-6" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <h3 style={{ color: BRAND.navy }} className="text-sm font-semibold mb-3">Contactos por proyecto</h3>
        <div className="flex items-end gap-6 h-40">
          {cards.map(({ key, p, total }) => (
            <div key={key} className="flex flex-col items-center gap-2">
              <div className="w-14 rounded-t-md" style={{ height: `${Math.max(6, (total / maxTotal) * 120)}px`, background: p.color }} />
              <span style={{ color: "#6b6759" }} className="text-xs text-center">{p.nombre.split(" ")[0]}</span>
              <span style={{ color: BRAND.navy }} className="text-xs font-semibold">{total}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <h3 style={{ color: BRAND.navy }} className="text-sm font-semibold mb-3">Próximas acciones (hoy o vencidas)</h3>
        {urgentes.length === 0 ? (
          <p style={{ color: "#8a8578" }} className="text-sm">No hay acciones pendientes vencidas ni para hoy.</p>
        ) : (
          <div className="space-y-2">
            {urgentes.map((l) => {
              const vencida = l.proxima_accion < todayStr();
              return (
                <div key={l.id} className="flex items-center justify-between text-sm py-1.5" style={{ borderBottom: "1px solid #f0ece2" }}>
                  <span style={{ color: "#4a4740" }}>{l.nombre} — {PROJECTS[l.proyecto].nombre}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={vencida ? { background: "#fbeceb", color: "#b3453f" } : { background: "#fdf0e6", color: "#b3703f" }}>
                    {vencida ? "Vencida" : "Hoy"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
