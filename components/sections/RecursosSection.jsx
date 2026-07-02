"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { BRAND, RECURSO_CATEGORIAS } from "@/lib/constants";
import { loadData, saveData } from "@/lib/storage";
import { uid } from "@/lib/helpers";

export default function RecursosSection() {
  const [recursos, setRecursos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoria: "marketing", titulo: "", contenido: "" });

  useEffect(() => {
    loadData("recursos-biblioteca", []).then((d) => {
      setRecursos(d);
      setLoaded(true);
    });
  }, []);

  const agregar = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) return;
    const nuevo = { id: uid(), ...form, fecha: new Date().toISOString().slice(0, 10) };
    const actualizado = [nuevo, ...recursos];
    setRecursos(actualizado);
    await saveData("recursos-biblioteca", actualizado);
    setForm({ categoria: "marketing", titulo: "", contenido: "" });
    setShowForm(false);
  };

  const eliminar = async (id) => {
    const actualizado = recursos.filter((r) => r.id !== id);
    setRecursos(actualizado);
    await saveData("recursos-biblioteca", actualizado);
  };

  const visibles = filtro === "todos" ? recursos : recursos.filter((r) => r.categoria === filtro);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold">Recursos</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
          style={{ background: BRAND.teal, color: BRAND.navy }}>
          <Plus size={14} /> Nuevo recurso
        </button>
      </div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-1">Contenido cargado para que los emprendedores lo consulten.</p>
      <p style={{ color: "#a89f88" }} className="text-xs mb-5">Lo que publiques acá lo ven todos los usuarios de la app.</p>

      {showForm && (
        <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" style={{ border: "1px solid #e4dfd3" }}>
            {RECURSO_CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título"
            className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" style={{ border: "1px solid #e4dfd3" }} />
          <textarea value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} placeholder="Contenido"
            rows={4} className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none" style={{ border: "1px solid #e4dfd3" }} />
          <button onClick={agregar} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: BRAND.navy, color: BRAND.cream }}>
            Publicar
          </button>
        </div>
      )}

      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button onClick={() => setFiltro("todos")} className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={filtro === "todos" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>Todos</button>
        {RECURSO_CATEGORIAS.map((c) => (
          <button key={c.id} onClick={() => setFiltro(c.id)} className="px-3 py-1.5 rounded-md text-xs font-medium"
            style={filtro === c.id ? { background: c.color, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>{c.label}</button>
        ))}
      </div>

      {loaded && visibles.length === 0 && (
        <div className="rounded-xl p-6 text-center" style={{ background: "#ffffff", border: "1px dashed #d8d2c3" }}>
          <BookOpen size={20} color="#b3ab98" className="mx-auto mb-2" />
          <p style={{ color: "#8a8578" }} className="text-sm">Todavía no hay recursos en esta categoría.</p>
        </div>
      )}
      <div className="space-y-3">
        {visibles.map((r) => {
          const cat = RECURSO_CATEGORIAS.find((c) => c.id === r.categoria);
          return (
            <div key={r.id} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: cat?.color, color: BRAND.cream }}>
                  {cat?.label}
                </span>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#8a8578" }} className="text-xs">{r.fecha}</span>
                  <button onClick={() => eliminar(r.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
                </div>
              </div>
              <div style={{ color: BRAND.navy }} className="font-medium text-sm mb-1">{r.titulo}</div>
              <p style={{ color: "#4a4740" }} className="text-sm leading-relaxed whitespace-pre-wrap">{r.contenido}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
