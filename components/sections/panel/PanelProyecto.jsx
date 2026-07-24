"use client";

import { useState } from "react";
import { BRAND } from "@/lib/constants";
import { PROJECTS, RUBROS, ESTADOS, labelCanal } from "@/lib/panel/constants";
import LeadsTable from "@/components/sections/panel/LeadsTable";

// Vista de un proyecto (Membresías o Apps a Medida): tarjeta de estrategia,
// checklist de contenido recurrente, formulario de alta y tabla de contactos.

function StrategyCard({ p }) {
  return (
    <div className="rounded-xl p-5 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3", borderLeft: `5px solid ${p.color}` }}>
      <h2 style={{ color: BRAND.navy }} className="text-lg font-semibold mb-0.5">{p.nombre}</h2>
      <div style={{ color: "#8a8578" }} className="text-xs mb-4">{p.objetivo}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div><div style={{ color: BRAND.navy }} className="font-semibold mb-0.5">Canal principal</div><div style={{ color: "#4a4740" }}>{p.canalPrincipal}</div></div>
        <div><div style={{ color: BRAND.navy }} className="font-semibold mb-0.5">Tono</div><div style={{ color: "#4a4740" }}>{p.tono}</div></div>
        <div><div style={{ color: BRAND.navy }} className="font-semibold mb-0.5">Cadencia sugerida</div><div style={{ color: "#4a4740" }}>{p.cadencia}</div></div>
        <div><div style={{ color: BRAND.navy }} className="font-semibold mb-0.5">Objetivo de contacto</div><div style={{ color: "#4a4740" }}>{p.objetivo}</div></div>
        <div className="md:col-span-2">
          <div style={{ color: BRAND.navy }} className="font-semibold mb-0.5">Tipo de contenido</div>
          <ul className="list-disc pl-4" style={{ color: "#4a4740" }}>
            {p.contenido.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Checklist({ proyectoKey, items, onSave }) {
  const [nuevo, setNuevo] = useState("");

  const toggle = (idx) => {
    const copia = items.map((it, i) => (i === idx ? { ...it, done: !it.done } : it));
    onSave(proyectoKey, copia);
  };
  const agregar = () => {
    if (!nuevo.trim()) return;
    onSave(proyectoKey, [...items, { text: nuevo.trim(), done: false }]);
    setNuevo("");
  };
  const reiniciar = () => {
    onSave(proyectoKey, items.map((it) => ({ ...it, done: false })));
  };

  return (
    <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
      {items.map((it, i) => (
        <label key={i} className="flex items-center gap-2 py-1.5 text-sm" style={it.done ? { color: "#a89f88", textDecoration: "line-through" } : { color: "#4a4740" }}>
          <input type="checkbox" checked={it.done} onChange={() => toggle(i)} />
          {it.text}
        </label>
      ))}
      <div className="flex gap-2 mt-3">
        <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="Agregar tarea recurrente..."
          className="flex-1 rounded-lg px-2.5 py-1.5 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }}
          onKeyDown={(e) => e.key === "Enter" && agregar()} />
        <button onClick={agregar} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "#eee9dd", color: "#6b6759" }}>Agregar</button>
        <button onClick={reiniciar} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "#eee9dd", color: "#6b6759" }}>Reiniciar semana</button>
      </div>
    </div>
  );
}

function LeadForm({ proyectoKey, onSubmit }) {
  const p = PROJECTS[proyectoKey];
  const [form, setForm] = useState({ nombre: "", empresa: "", rubro: "", canal: p.canales[0], telefono: "", mail: "", proximaAccion: "", estado: ESTADOS[0], notas: "" });

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const enviar = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    onSubmit({ proyecto: proyectoKey, ...form, nombre: form.nombre.trim() });
    setForm({ nombre: "", empresa: "", rubro: "", canal: p.canales[0], telefono: "", mail: "", proximaAccion: "", estado: ESTADOS[0], notas: "" });
  };

  return (
    <form onSubmit={enviar} className="rounded-xl p-4 mb-5 grid grid-cols-2 md:grid-cols-4 gap-3 items-end" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
      <div>
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Nombre</label>
        <input value={form.nombre} onChange={set("nombre")} required className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
      </div>
      <div>
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Empresa</label>
        <input value={form.empresa} onChange={set("empresa")} placeholder="Nombre de la empresa" className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
      </div>
      {proyectoKey === "apps" && (
        <div>
          <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Rubro</label>
          <input value={form.rubro} onChange={set("rubro")} list="rubros-datalist" placeholder="Ej: Inmobiliaria" className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
          <datalist id="rubros-datalist">{RUBROS.map((r) => <option key={r} value={r} />)}</datalist>
        </div>
      )}
      <div>
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Canal</label>
        <select value={form.canal} onChange={set("canal")} className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }}>
          {p.canales.map((c) => <option key={c} value={c}>{labelCanal(c)}</option>)}
        </select>
      </div>
      <div>
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Teléfono (WhatsApp)</label>
        <input value={form.telefono} onChange={set("telefono")} placeholder="549..." className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
      </div>
      <div>
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Email</label>
        <input type="email" value={form.mail} onChange={set("mail")} className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
      </div>
      <div>
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Próxima acción</label>
        <input type="date" value={form.proximaAccion} onChange={set("proximaAccion")} className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
      </div>
      <div>
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Estado</label>
        <select value={form.estado} onChange={set("estado")} className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }}>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <div className="col-span-2 md:col-span-3">
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Notas</label>
        <textarea value={form.notas} onChange={set("notas")} rows={1} className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
      </div>
      <div>
        <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold w-full" style={{ background: BRAND.navy, color: BRAND.cream }}>Agregar contacto</button>
      </div>
    </form>
  );
}

export default function PanelProyecto({ proyectoKey, leads, checklist, agregarLead, actualizarLead, eliminarLead, enviarASeguimiento, guardarChecklist, showToast }) {
  const p = PROJECTS[proyectoKey];
  const listaProyecto = leads.filter((l) => l.proyecto === proyectoKey);

  return (
    <div>
      <StrategyCard p={p} />
      <h3 style={{ color: BRAND.navy }} className="text-sm font-bold uppercase tracking-wide mt-6 mb-2">Plan de contenido recurrente</h3>
      <Checklist proyectoKey={proyectoKey} items={checklist[proyectoKey] || []} onSave={guardarChecklist} />

      <h3 style={{ color: BRAND.navy }} className="text-sm font-bold uppercase tracking-wide mt-6 mb-2">Cargar contacto / lead</h3>
      <LeadForm proyectoKey={proyectoKey} onSubmit={(lead) => agregarLead(lead).catch(() => showToast("No se pudo agregar el contacto"))} />

      <h3 style={{ color: BRAND.navy }} className="text-sm font-bold uppercase tracking-wide mt-6 mb-2">Contactos — {p.nombre}</h3>
      <LeadsTable
        leads={listaProyecto}
        onEstadoChange={(id, estado) => actualizarLead(id, { estado })}
        onProximaAccionChange={(id, proximaAccion) => actualizarLead(id, { proximaAccion })}
        onDelete={eliminarLead}
        onEnviarSeguimiento={enviarASeguimiento}
      />
    </div>
  );
}
