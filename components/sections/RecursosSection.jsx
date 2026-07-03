"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Clock, ExternalLink, FileText, Lightbulb, Link2, Loader2, Music, Plus, Trash2, Upload, Video, X } from "lucide-react";
import { BRAND, RECURSO_CATEGORIAS } from "@/lib/constants";
import { uid } from "@/lib/helpers";
import { createClient } from "@/lib/supabase/client";

const EXT_AUDIO = ["mp3", "wav", "m4a", "ogg", "aac"];
const EXT_VIDEO = ["mp4", "mov", "webm", "avi", "m4v"];
function extension(nombre) {
  return (nombre || "").split(".").pop()?.toLowerCase() || "";
}

const TIPOS = [
  { id: "nota", label: "Nota de texto" },
  { id: "link", label: "Link (web, podcast, video...)" },
  { id: "archivo", label: "Archivo (PDF, doc, imagen...)" },
  { id: "hack", label: "Hack accionable de la semana" },
];

const hoyISO = () => new Date().toISOString().slice(0, 10);
// Fecha+hora actual en el formato que espera <input type="datetime-local"> (hora local, sin timezone).
function ahoraLocalInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
const FORM_VACIO = { categoria: "marketing", titulo: "", descripcion: "", tipo: "nota", url: "", fechaSemana: hoyISO(), publicarEn: ahoraLocalInput() };

// Lunes de la semana a la que pertenece una fecha (para agrupar los hacks).
function inicioSemana(fechaStr) {
  const d = new Date((fechaStr || hoyISO()) + "T00:00:00");
  const dia = d.getDay(); // 0=domingo
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
function labelSemana(mondayISO) {
  const d = new Date(mondayISO + "T00:00:00");
  return `Semana del ${d.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}`;
}

export default function RecursosSection({ isAdmin }) {
  const [recursos, setRecursos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [links, setLinks] = useState([""]);
  const [archivos, setArchivos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const actualizarLink = (i, valor) => setLinks((prev) => prev.map((l, idx) => (idx === i ? valor : l)));
  const agregarLinkVacio = () => setLinks((prev) => [...prev, ""]);
  const quitarLink = (i) => setLinks((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const agregarArchivos = (files) => setArchivos((prev) => [...prev, ...Array.from(files || [])]);
  const quitarArchivo = (i) => setArchivos((prev) => prev.filter((_, idx) => idx !== i));

  const cargar = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("recursos").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRecursos(data || []);
    setLoaded(true);
  };

  useEffect(() => { cargar(); }, []);

  const agregar = async () => {
    const linksValidos = links.map((l) => l.trim()).filter(Boolean);
    if (!form.titulo.trim()) return;
    if (form.tipo === "link" && linksValidos.length === 0) return;
    if (form.tipo === "archivo" && archivos.length === 0) return;
    if (form.tipo === "hack" && !form.descripcion.trim()) return;

    setError("");
    setSubiendo(true);
    const supabase = createClient();

    try {
      let adjuntos = [];

      if (form.tipo === "link") {
        adjuntos = linksValidos.map((url) => ({ url }));
      }

      if (form.tipo === "archivo" && archivos.length > 0) {
        for (const file of archivos) {
          const path = `${uid()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("recursos-archivos")
            .upload(path, file, { contentType: file.type });
          if (uploadError) throw uploadError;
          const { data: pub } = supabase.storage.from("recursos-archivos").getPublicUrl(path);
          adjuntos.push({ url: pub.publicUrl, nombre: file.name });
        }
      }

      const { error: insertError } = await supabase.from("recursos").insert({
        categoria: form.categoria,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        tipo: form.tipo,
        adjuntos,
        fecha_semana: form.tipo === "hack" ? form.fechaSemana : null,
        publicar_en: form.publicarEn ? new Date(form.publicarEn).toISOString() : new Date().toISOString(),
      });
      if (insertError) throw insertError;

      setForm(FORM_VACIO);
      setLinks([""]);
      setArchivos([]);
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

  const filtrados = filtro === "todos" ? recursos : recursos.filter((r) => r.categoria === filtro);
  const documentos = filtrados.filter((r) => r.tipo !== "hack");
  const hacks = filtrados.filter((r) => r.tipo === "hack");

  const hacksPorSemana = {};
  hacks.forEach((h) => {
    const semana = inicioSemana(h.fecha_semana || h.created_at?.slice(0, 10));
    if (!hacksPorSemana[semana]) hacksPorSemana[semana] = [];
    hacksPorSemana[semana].push(h);
  });
  const semanasOrdenadas = Object.keys(hacksPorSemana).sort((a, b) => (a < b ? 1 : -1));

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
      <p style={{ color: "#6b6759" }} className="text-sm mb-1">Documentos, links y hacks accionables, semana a semana.</p>
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

          <div className="mb-2">
            <span style={{ color: "#8a8578" }} className="text-xs flex items-center gap-1 mb-1">
              <Clock size={11} /> Publicar el
            </span>
            <input type="datetime-local" value={form.publicarEn} onChange={(e) => setForm({ ...form, publicarEn: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
            <p style={{ color: "#a89f88" }} className="text-[11px] mt-1">Dejalo en el momento actual para publicarlo ya, o elegí una fecha futura para programarlo.</p>
          </div>

          {form.tipo === "hack" && (
            <div className="mb-2">
              <span style={{ color: "#8a8578" }} className="text-xs block mb-1">Semana a la que corresponde</span>
              <input type="date" value={form.fechaSemana} onChange={(e) => setForm({ ...form, fechaSemana: e.target.value })}
                className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
            </div>
          )}

          {form.tipo === "link" && (
            <div className="mb-2">
              {links.map((l, i) => (
                <div key={i} className="flex items-center gap-1.5 mb-1.5">
                  <input value={l} onChange={(e) => actualizarLink(i, e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
                  {links.length > 1 && (
                    <button onClick={() => quitarLink(i)} style={{ color: "#b3453f" }}><X size={14} /></button>
                  )}
                </div>
              ))}
              <button onClick={agregarLinkVacio} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#127a79" }}>
                <Plus size={12} /> Agregar otro link
              </button>
            </div>
          )}

          {form.tipo === "archivo" && (
            <div className="mb-2">
              <input ref={fileInputRef} type="file" multiple onChange={(e) => { agregarArchivos(e.target.files); e.target.value = ""; }}
                className="hidden" id="recurso-archivo-input" />
              <label htmlFor="recurso-archivo-input"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer mb-2"
                style={{ background: "#eee9dd", color: BRAND.navy }}>
                <Upload size={13} /> {archivos.length > 0 ? "Agregar otro archivo" : "Elegir archivo(s)"}
              </label>
              {archivos.length > 0 && (
                <div className="space-y-1">
                  {archivos.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md px-2 py-1.5" style={{ background: "#faf8f4" }}>
                      <span style={{ color: "#4a4740" }} className="text-xs truncate">{f.name}</span>
                      <button onClick={() => quitarArchivo(i)} style={{ color: "#b3453f" }}><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder={form.tipo === "nota" ? "Contenido" : form.tipo === "hack" ? "El accionable: qué tiene que hacer esta semana" : "Descripción (opcional)"}
            rows={form.tipo === "nota" || form.tipo === "hack" ? 5 : 3}
            className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none" style={{ border: "1px solid #e4dfd3" }} />

          <button onClick={agregar} disabled={subiendo}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ background: BRAND.navy, color: BRAND.cream }}>
            {subiendo && <Loader2 size={14} className="animate-spin" />}
            {subiendo ? "Publicando..." : "Publicar"}
          </button>
        </div>
      )}

      <div className="flex gap-1.5 mb-5 flex-wrap">
        <button onClick={() => setFiltro("todos")} className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={filtro === "todos" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>Todos</button>
        {RECURSO_CATEGORIAS.map((c) => (
          <button key={c.id} onClick={() => setFiltro(c.id)} className="px-3 py-1.5 rounded-md text-xs font-medium"
            style={filtro === c.id ? { background: c.color, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>{c.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda: documentos y links */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <BookOpen size={15} color={BRAND.navy} />
            <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Documentos y links ({documentos.length})</span>
          </div>

          {loaded && documentos.length === 0 && (
            <div className="rounded-xl p-6 text-center" style={{ background: "#ffffff", border: "1px dashed #d8d2c3" }}>
              <p style={{ color: "#8a8578" }} className="text-sm">Todavía no hay recursos en esta categoría.</p>
            </div>
          )}

          <div className="space-y-3">
            {documentos.map((r) => {
              const cat = RECURSO_CATEGORIAS.find((c) => c.id === r.categoria);
              // Compatibilidad: recursos viejos guardaban un solo link/archivo en "url".
              const adjuntos = r.adjuntos?.length ? r.adjuntos : (r.url ? [{ url: r.url, nombre: r.nombre_archivo }] : []);
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
                  {isAdmin && new Date(r.publicar_en) > new Date() && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold mb-1.5" style={{ color: "#b3703f" }}>
                      <Clock size={10} /> Programado para {new Date(r.publicar_en).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                  <div style={{ color: BRAND.navy }} className="font-medium text-sm mb-1">{r.titulo}</div>

                  {adjuntos.length > 0 && (
                    <div className="mb-1 space-y-2">
                      {adjuntos.map((a, i) => {
                        if (r.tipo !== "archivo") {
                          return (
                            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm" style={{ color: "#127a79" }}>
                              <Link2 size={13} /> {a.url}
                            </a>
                          );
                        }
                        const ext = extension(a.nombre);
                        const esAudio = EXT_AUDIO.includes(ext);
                        const esVideo = EXT_VIDEO.includes(ext);
                        return (
                          <div key={i}>
                            <a href={a.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm mb-1" style={{ color: "#127a79" }}>
                              {esAudio ? <Music size={13} /> : esVideo ? <Video size={13} /> : <FileText size={13} />}
                              {a.nombre || `Descargar archivo ${adjuntos.length > 1 ? i + 1 : ""}`}
                              {!esAudio && !esVideo && <ExternalLink size={11} />}
                            </a>
                            {esAudio && <audio controls src={a.url} className="w-full" style={{ height: "32px" }} />}
                            {esVideo && <video controls src={a.url} className="w-full rounded-lg" style={{ maxHeight: "220px" }} />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {r.descripcion && (
                    <p style={{ color: "#4a4740" }} className="text-sm leading-relaxed whitespace-pre-wrap">{r.descripcion}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna derecha: hacks accionables, agrupados por semana */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Lightbulb size={15} color={BRAND.navy} />
            <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Hacks de la semana ({hacks.length})</span>
          </div>

          {loaded && hacks.length === 0 && (
            <div className="rounded-xl p-6 text-center" style={{ background: "#ffffff", border: "1px dashed #d8d2c3" }}>
              <p style={{ color: "#8a8578" }} className="text-sm">Todavía no hay hacks en esta categoría.</p>
            </div>
          )}

          {semanasOrdenadas.map((semana) => (
            <div key={semana} className="mb-4">
              <div style={{ color: "#8a8578" }} className="text-xs font-semibold uppercase tracking-wide mb-2">{labelSemana(semana)}</div>
              <div className="space-y-3">
                {hacksPorSemana[semana].map((h) => {
                  const cat = RECURSO_CATEGORIAS.find((c) => c.id === h.categoria);
                  return (
                    <div key={h.id} className="rounded-xl p-4" style={{ background: "#eef7f6", border: "1px solid #d3ece9" }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: cat?.color, color: BRAND.cream }}>
                          {cat?.label}
                        </span>
                        {isAdmin && (
                          <button onClick={() => eliminar(h.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
                        )}
                      </div>
                      {isAdmin && new Date(h.publicar_en) > new Date() && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold mb-1.5" style={{ color: "#b3703f" }}>
                          <Clock size={10} /> Programado para {new Date(h.publicar_en).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                      <div style={{ color: BRAND.navy }} className="font-medium text-sm mb-1">{h.titulo}</div>
                      {h.descripcion && (
                        <p style={{ color: "#2c5f5e" }} className="text-sm leading-relaxed whitespace-pre-wrap">{h.descripcion}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
