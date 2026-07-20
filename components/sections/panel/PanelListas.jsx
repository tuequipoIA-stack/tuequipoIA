"use client";

import { useMemo, useState } from "react";
import { BRAND } from "@/lib/constants";
import { PROJECTS, RUBROS, ESTADOS, labelCanal } from "@/lib/panel/constants";

// Armado de listas reutilizables: se arman una vez con filtros + tildes
// puntuales y después se usan tanto en Armado de Correos como en Difusión
// WhatsApp, sin tener que volver a elegir contacto por contacto cada vez.

export default function PanelListas({ leads, listas, guardarLista, eliminarLista, showToast }) {
  const [filtroProyecto, setFiltroProyecto] = useState("");
  const [filtroRubro, setFiltroRubro] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [seleccion, setSeleccion] = useState(new Set());
  const [nombreLista, setNombreLista] = useState("");
  const [editId, setEditId] = useState(null);

  const candidatos = useMemo(() => leads.filter((l) =>
    (!filtroProyecto || l.proyecto === filtroProyecto) &&
    (!filtroRubro || l.rubro === filtroRubro) &&
    (!filtroEstado || l.estado === filtroEstado) &&
    (!filtroCanal || l.canal === filtroCanal) &&
    (!busqueda || l.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  ), [leads, filtroProyecto, filtroRubro, filtroEstado, filtroCanal, busqueda]);

  const todosVisiblesSeleccionados = candidatos.length > 0 && candidatos.every((l) => seleccion.has(l.id));

  const toggleUno = (id) => {
    setSeleccion((prev) => {
      const copia = new Set(prev);
      if (copia.has(id)) copia.delete(id); else copia.add(id);
      return copia;
    });
  };
  const toggleTodos = () => {
    setSeleccion((prev) => {
      const copia = new Set(prev);
      if (todosVisiblesSeleccionados) candidatos.forEach((l) => copia.delete(l.id));
      else candidatos.forEach((l) => copia.add(l.id));
      return copia;
    });
  };

  const resetBuilder = () => {
    setSeleccion(new Set());
    setEditId(null);
    setNombreLista("");
  };

  const editar = (lista) => {
    setEditId(lista.id);
    setSeleccion(new Set(lista.lead_ids || []));
    setNombreLista(lista.nombre);
    showToast(`Editando lista "${lista.nombre}"`);
  };

  const guardar = async () => {
    if (!nombreLista.trim()) { showToast("Ponele un nombre a la lista"); return; }
    if (seleccion.size === 0) { showToast("Seleccioná al menos un contacto"); return; }
    await guardarLista(nombreLista.trim(), Array.from(seleccion), editId);
    resetBuilder();
  };

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Listas de Contactos</h2>
      <div className="rounded-lg p-3 mb-5 text-xs" style={{ background: "#eef3ff", border: "1px solid #bfdbfe", color: "#1e40af" }}>
        Armá una lista una vez (con filtros + tildando contactos puntuales) y después usala tanto en &ldquo;Armado de Correos&rdquo; como en &ldquo;Difusión WhatsApp&rdquo;, sin tener que volver a elegir contacto por contacto cada vez.
      </div>

      <h3 style={{ color: BRAND.navy }} className="text-sm font-bold uppercase tracking-wide mb-2">Mis listas</h3>
      {listas.length === 0 ? (
        <div className="rounded-xl p-6 text-center text-sm mb-6" style={{ background: "#ffffff", border: "1px solid #e4dfd3", color: "#8a8578" }}>
          Todavía no armaste ninguna lista.
        </div>
      ) : (
        <div className="rounded-xl overflow-x-auto mb-6" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f7f4ed" }}>
                {["Nombre", "Contactos", "Acciones"].map((h) => <th key={h} style={{ color: "#8a8578" }} className="text-left text-[11px] uppercase font-semibold px-3 py-2">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {listas.map((l) => {
                const vigentes = (l.lead_ids || []).filter((id) => leads.some((x) => x.id === id)).length;
                return (
                  <tr key={l.id} style={{ borderTop: "1px solid #f0ece2" }}>
                    <td className="px-3 py-2" style={{ color: BRAND.navy }}>{l.nombre}</td>
                    <td className="px-3 py-2" style={{ color: "#4a4740" }}>{vigentes} contacto(s)</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1.5">
                        <button onClick={() => editar(l)} className="text-[11px] font-bold px-2 py-1 rounded-md text-white" style={{ background: "#7c3aed" }}>Editar</button>
                        <button onClick={() => eliminarLista(l.id)} className="text-[11px] font-bold px-2 py-1 rounded-md text-white" style={{ background: "#ef4444" }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ color: BRAND.navy }} className="text-sm font-bold uppercase tracking-wide mb-2">{editId ? `Editando: ${nombreLista}` : "Crear nueva lista"}</h3>
      <div className="flex flex-wrap gap-2 mb-2">
        <select value={filtroProyecto} onChange={(e) => setFiltroProyecto(e.target.value)} className="rounded-lg px-2.5 py-1.5 text-sm" style={{ border: "1px solid #e4dfd3" }}>
          <option value="">Todos los proyectos</option>
          <option value="ia">Membresías</option>
          <option value="apps">Apps a Medida</option>
        </select>
        <select value={filtroRubro} onChange={(e) => setFiltroRubro(e.target.value)} className="rounded-lg px-2.5 py-1.5 text-sm" style={{ border: "1px solid #e4dfd3" }}>
          <option value="">Todos los rubros</option>
          {RUBROS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="rounded-lg px-2.5 py-1.5 text-sm" style={{ border: "1px solid #e4dfd3" }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filtroCanal} onChange={(e) => setFiltroCanal(e.target.value)} className="rounded-lg px-2.5 py-1.5 text-sm" style={{ border: "1px solid #e4dfd3" }}>
          <option value="">Todos los canales</option>
          <option value="instagram">Instagram</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </select>
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre..." className="rounded-lg px-2.5 py-1.5 text-sm" style={{ border: "1px solid #e4dfd3" }} />
      </div>
      <div style={{ color: "#8a8578" }} className="text-xs mb-2">
        {seleccion.size} contacto(s) seleccionado(s) para esta lista · {candidatos.length} visible(s) con el filtro actual.
      </div>

      {candidatos.length === 0 ? (
        <div className="rounded-xl p-4 text-xs mb-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3", color: "#8a8578" }}>Nadie coincide con este filtro.</div>
      ) : (
        <div className="rounded-xl overflow-y-auto mb-4" style={{ maxHeight: 380, background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f7f4ed" }}>
                <th className="px-3 py-2"><input type="checkbox" checked={todosVisiblesSeleccionados} onChange={toggleTodos} /></th>
                {["Nombre / Proyecto", "Empresa / Rubro", "Canal", "Contacto"].map((h) => <th key={h} style={{ color: "#8a8578" }} className="text-left text-[11px] uppercase font-semibold px-3 py-2">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {candidatos.map((l) => (
                <tr key={l.id} style={{ borderTop: "1px solid #f0ece2" }}>
                  <td className="px-3 py-2"><input type="checkbox" checked={seleccion.has(l.id)} onChange={() => toggleUno(l.id)} /></td>
                  <td className="px-3 py-2">
                    <div style={{ color: BRAND.navy }}>{l.nombre}</div>
                    <div style={{ color: "#a89f88" }} className="text-[11px]">{PROJECTS[l.proyecto]?.nombre}</div>
                  </td>
                  <td className="px-3 py-2" style={{ color: "#4a4740" }}>
                    {l.empresa || "—"}
                    {l.rubro && <div><span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#eee9dd", color: "#6b6759" }}>{l.rubro}</span></div>}
                  </td>
                  <td className="px-3 py-2" style={{ color: "#4a4740" }}>{labelCanal(l.canal)}</td>
                  <td className="px-3 py-2" style={{ color: "#4a4740" }}>{l.mail || l.telefono || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Nombre de la lista</label>
        <input value={nombreLista} onChange={(e) => setNombreLista(e.target.value)} placeholder="Ej: Inmobiliarias activas julio"
          className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
        <div className="flex gap-2">
          <button onClick={guardar} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: BRAND.navy, color: BRAND.cream }}>
            {editId ? "Actualizar lista" : "Guardar lista"}
          </button>
          {editId && (
            <button onClick={resetBuilder} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#eee9dd", color: "#6b6759" }}>Cancelar edición</button>
          )}
        </div>
      </div>
    </div>
  );
}
