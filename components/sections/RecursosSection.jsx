"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, ExternalLink, FileText, Link2, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { BRAND, RECURSO_CATEGORIAS } from "@/lib/constants";
import { uid } from "@/lib/helpers";
import { createClient } from "@/lib/supabase/client";

const TIPOS = [
  { id: "nota", label: "Nota de texto" },
  { id: "link", label: "Link (web, podcast, video...)" },
  { id: "archivo", label: "Archivo (PDF, doc, imagen...)" },
];

const FORM_VACIO = { categoria: "marketing", titulo: "", descripcion: "", tipo: "nota", url: "" };

export default function RecursosSection({ isAdmin }) {
  const [recursos, setRecursos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const cargar = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("recursos").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRecursos(data || []);
    setLoaded(true);
  };

  useEffect(() => { cargar(); }, []);

  const agregar = async () => {
    if (!form.titulo.trim()) return;
    if (form.tipo === "link" && !form.url.trim()) return;
    if (form.tipo === "archivo" && !archivo) return;

    setError("");
    setSubiendo(true);
    const supabase = createClient();

    try {
      let url = form.url.trim() || null;
      let nombreArchivo = null;

      if (form.tipo === "archivo" && archivo) {
        const path = `${uid()}-${archivo.name}`;
        const { error: uploadError } = await supabase.storage
          .from("recursos-archivos")
          .upload(path, archivo, { contentType: archivo.type });
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from("recursos-archivos").getPublicUrl(path);
        url = pub.publicUrl;
        nombreArchivo = archivo.name;
      }

      const { error: insertError } = await supabase.from("recursos").insert({
        categoria: form.categoria,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        tipo: form.tipo,
        url,
        nombre_archivo: nombreArchivo,
      });
      if (insertError) throw insertError;

      setForm(FORM_VACIO);
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowForm(false);
      cargar();
    } catch (e) {
      setError(e.message || "No se pudo publicar el recurso.");
    } finally {
      setSubiendo(false);
    }
  };

  const eliminar = async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("recursos").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    cargar();
  };

  const visibles = filtro === "todos" ? recursos : recursos.filter((r) => r.categoria === filtro);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold">Recursos</h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
            style={{ background: BRAND.teal, color: BRAND.navy }}>
            <Plus size={14} /> Nuevo recurso
          </button>
        )}
      </div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-1">Contenido curado para vos, semana a semana.</p>
      <p style={{ color: "#a89f88" }} className="text-xs mb-5">
        {isAdmin ? "Lo que publiques acá lo ven todos los usuarios de la app." : "Biblioteca compartida — la actualiza el equipo de Tu Equipo IA."}
      </p>

      {error && <p className="text-xs mb-4" style={{ color: "#b3453f" }}>{error}</p>}

      {isAdmin && showForm && (
        <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }}>
              {RECURSO_CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }}>
              {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título"
            className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" style={{ border: "1px solid #e4dfd3" }} />

          {form.tipo === "link" && (
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none" style={{ border: "1px solid #e4dfd3" }} />
          )}

          {form.tipo === "archivo" && (
            <div className="mb-2">
              <input ref={fileInputRef} type="file" onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                className="hidden" id="recurso-archivo-input" />
              <label htmlFor="recurso-archivo-input"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer"
                style={{ background: "#eee9dd", color: BRAND.navy }}>
                <Upload size={13} /> {archivo ? archivo.name : "Elegir archivo"}
              </label>
            </div>
          )}

          <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder={form.tipo === "nota" ? "Contenido" : "Descripción (opcional)"}
            rows={form.tipo === "nota" ? 5 : 3}
            className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none" style={{ border: "1px solid #e4dfd3" }} />

          <button onClick={agregar} disabled={subiendo}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ background: BRAND.navy, color: BRAND.cream }}>
            {subiendo && <Loader2 size={14} className="animate-spin" />}
            {subiendo ? "Publicando..." : "Publicar"}
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
                  <span style={{ color: "#8a8578" }} className="text-xs">{new Date(r.created_at).toLocaleDateString("es-AR")}</span>
                  {isAdmin && (
                    <button onClick={() => eliminar(r.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
                  )}
                </div>
              </div>
              <div style={{ color: BRAND.navy }} className="font-medium text-sm mb-1">{r.titulo}</div>

              {r.tipo === "link" && r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm mb-1" style={{ color: "#127a79" }}>
                  <Link2 size={13} /> {r.url}
                </a>
              )}
              {r.tipo === "archivo" && r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm mb-1" style={{ color: "#127a79" }}>
                  <FileText size={13} /> {r.nombre_archivo || "Descargar archivo"} <ExternalLink size={11} />
                </a>
              )}

              {r.descripcion && (
                <p style={{ color: "#4a4740" }} className="text-sm leading-relaxed whitespace-pre-wrap">{r.descripcion}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
