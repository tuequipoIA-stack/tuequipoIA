"use client";

import { useState } from "react";
import { BRAND } from "@/lib/constants";
import { fillTemplate, gmailLink, gmailAuthUserKey, segNombre, waLink } from "@/lib/panel/constants";
import { segmentosApi, interaccionesApi } from "@/lib/panel/api";

function gmailAuthUser() {
  if (typeof window === "undefined") return "0";
  return window.localStorage.getItem(gmailAuthUserKey()) || "0";
}

function Chip({ children }) {
  return (
    <span className="inline-block text-xs px-2.5 py-1 rounded-full mr-1.5 mb-1.5" style={{ background: "#f3f1ea", color: "#4a4740" }}>
      {children}
    </span>
  );
}

function ColaEnvio({ contactos, segmento, canal, onCerrar, onRegistrado }) {
  const objetivo = canal === "email"
    ? contactos.filter((c) => c.email && c.estado !== "descartado" && (!c.canal_preferido || c.canal_preferido === "email"))
    : contactos.filter((c) => c.telefono && c.estado !== "descartado" && (!c.canal_preferido || c.canal_preferido === "whatsapp"));

  const [enviados, setEnviados] = useState({});

  const marcar = async (c, mensaje) => {
    await interaccionesApi.create({ contacto_id: c.id, canal, tipo: "mensaje_enviado", contenido: mensaje });
    setEnviados((prev) => ({ ...prev, [c.id]: true }));
    onRegistrado();
  };

  return (
    <div className="rounded-xl p-4 mt-3" style={{ background: "#faf9f6", border: "1px solid #e4dfd3" }}>
      <div className="flex items-center justify-between mb-3">
        <h4 style={{ color: BRAND.navy }} className="text-sm font-semibold">
          {canal === "email" ? "Cola de email" : "Cola de WhatsApp"} — {segNombre(segmento)} ({objetivo.length})
        </h4>
        <button onClick={onCerrar} className="text-xs" style={{ color: "#8a8578" }}>Cerrar</button>
      </div>
      {objetivo.length === 0 ? (
        <p style={{ color: "#8a8578" }} className="text-sm">No hay contactos disponibles ({canal === "email" ? "con email" : "con teléfono"}) en este segmento.</p>
      ) : (
        <div className="space-y-2">
          {objetivo.map((c) => {
            const mensaje = canal === "email" ? fillTemplate(segmento.mensaje_base_email, c) : fillTemplate(segmento.mensaje_base_whatsapp, c);
            const asunto = fillTemplate(segmento.asunto_email, c);
            const href = canal === "email" ? gmailLink(c.email, asunto, mensaje, gmailAuthUser()) : waLink(c, mensaje);
            const ya = !!enviados[c.id];
            return (
              <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg p-2.5" style={{ background: "#ffffff", border: "1px solid #eee7d8" }}>
                <div className="text-sm flex-1">
                  <strong style={{ color: BRAND.navy }}>{c.nombre}</strong> <span style={{ color: "#8a8578" }}>{c.empresa}</span>
                  <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: "#6b6759" }}>{mensaje}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <a href={href} target="_blank" rel="noreferrer" className="text-[11px] font-bold px-2.5 py-1 rounded-md text-white" style={{ background: canal === "email" ? "#2563eb" : "#1f9e57" }}>
                    {canal === "email" ? "Abrir Gmail" : "Abrir WhatsApp"}
                  </a>
                  <button
                    disabled={ya}
                    onClick={() => marcar(c, mensaje)}
                    className="text-[11px] px-2.5 py-1 rounded-md"
                    style={{ background: ya ? "#eaf3de" : "#f1efe8", color: ya ? "#27500a" : "#4a4740" }}
                  >
                    {ya ? "Registrado" : "Marcar enviado"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PanelSegmentos({ segmentos, contactos, marcaFiltro, recargar, showToast }) {
  const [editando, setEditando] = useState(null);
  const [generando, setGenerando] = useState(null);
  const [colaAbierta, setColaAbierta] = useState(null);
  const [form, setForm] = useState({ asunto_email: "", mensaje_base_email: "", mensaje_base_whatsapp: "", hooks: "" });

  const visibles = marcaFiltro === "todas" ? segmentos : segmentos.filter((s) => s.marca_origen === marcaFiltro);

  const generar = async (seg) => {
    setGenerando(seg.id);
    try {
      await segmentosApi.generar(seg.id);
      showToast("Mensaje generado");
      recargar();
    } catch (e) {
      showToast("Error al generar: " + e.message);
    }
    setGenerando(null);
  };

  const abrirEdicion = (seg) => {
    setEditando(seg.id);
    setForm({
      asunto_email: seg.asunto_email || "",
      mensaje_base_email: seg.mensaje_base_email || "",
      mensaje_base_whatsapp: seg.mensaje_base_whatsapp || "",
      hooks: (seg.hooks || []).join(" | "),
    });
  };

  const guardarEdicion = async (seg) => {
    await segmentosApi.update(seg.id, {
      asunto_email: form.asunto_email,
      mensaje_base_email: form.mensaje_base_email,
      mensaje_base_whatsapp: form.mensaje_base_whatsapp,
      hooks: form.hooks.split("|").map((h) => h.trim()).filter(Boolean),
    });
    setEditando(null);
    recargar();
  };

  const toggleAprobado = async (seg) => {
    await segmentosApi.update(seg.id, { aprobado: !seg.aprobado });
    recargar();
  };

  if (!visibles.length) {
    return (
      <div>
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Segmentos</h2>
        <p style={{ color: "#8a8578" }} className="text-sm">Todavía no hay segmentos — se crean solos al cargar contactos por CSV en "Contactos".</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Segmentos</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">Cada segmento cruza industria × puesto × marca. Generá el mensaje con IA, revisalo y aprobalo antes de usarlo para enviar.</p>

      <div className="space-y-4">
        {visibles.map((seg) => {
          const enSegmento = contactos.filter((c) => c.segmento_id === seg.id);
          return (
            <div key={seg.id} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div>
                  <strong style={{ color: BRAND.navy }}>{segNombre(seg)}</strong>{" "}
                  <span style={{ color: "#8a8578" }} className="text-xs">{seg.marca_origen} · {enSegmento.length} contacto(s)</span>{" "}
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1" style={seg.aprobado ? { background: "#eaf3de", color: "#27500a" } : { background: "#faeeda", color: "#854f0b" }}>
                    {seg.aprobado ? "Aprobado" : "Sin aprobar"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => generar(seg)} disabled={generando === seg.id} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "#f1efe8", color: "#4a4740" }}>
                    {generando === seg.id ? "Generando..." : seg.mensaje_base_email ? "Regenerar con IA" : "Generar con IA"}
                  </button>
                  <button onClick={() => abrirEdicion(seg)} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "#f1efe8", color: "#4a4740" }}>Editar</button>
                  <button onClick={() => toggleAprobado(seg)} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: seg.aprobado ? "#8a8578" : BRAND.navy }}>
                    {seg.aprobado ? "Quitar aprobación" : "Aprobar"}
                  </button>
                </div>
              </div>

              {editando === seg.id ? (
                <div className="mt-2 space-y-2">
                  <input value={form.asunto_email} onChange={(e) => setForm({ ...form, asunto_email: e.target.value })} placeholder="Asunto email" className="w-full text-sm rounded-md p-2" style={{ border: "1px solid #ddd" }} />
                  <textarea value={form.mensaje_base_email} onChange={(e) => setForm({ ...form, mensaje_base_email: e.target.value })} placeholder="Mensaje base email" rows={4} className="w-full text-sm rounded-md p-2" style={{ border: "1px solid #ddd" }} />
                  <textarea value={form.mensaje_base_whatsapp} onChange={(e) => setForm({ ...form, mensaje_base_whatsapp: e.target.value })} placeholder="Mensaje base WhatsApp" rows={3} className="w-full text-sm rounded-md p-2" style={{ border: "1px solid #ddd" }} />
                  <input value={form.hooks} onChange={(e) => setForm({ ...form, hooks: e.target.value })} placeholder="Hooks separados por |" className="w-full text-sm rounded-md p-2" style={{ border: "1px solid #ddd" }} />
                  <div className="flex gap-2">
                    <button onClick={() => guardarEdicion(seg)} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: BRAND.navy }}>Guardar</button>
                    <button onClick={() => setEditando(null)} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "#f1efe8", color: "#4a4740" }}>Cancelar</button>
                  </div>
                </div>
              ) : seg.mensaje_base_email ? (
                <div className="mt-2 text-sm" style={{ color: "#4a4740" }}>
                  <p><strong>Asunto:</strong> {seg.asunto_email}</p>
                  <p className="whitespace-pre-wrap mt-1"><strong>Email:</strong> {seg.mensaje_base_email}</p>
                  <p className="whitespace-pre-wrap mt-1"><strong>WhatsApp:</strong> {seg.mensaje_base_whatsapp}</p>
                  <div className="mt-2">{(seg.hooks || []).map((h, i) => <Chip key={i}>{h}</Chip>)}</div>
                  <div className="flex gap-2 mt-3">
                    <button disabled={!seg.aprobado} onClick={() => setColaAbierta({ seg, canal: "email" })} className="text-xs px-3 py-1.5 rounded-md text-white disabled:opacity-40" style={{ background: "#2563eb" }}>
                      Enviar por email al segmento
                    </button>
                    <button disabled={!seg.aprobado} onClick={() => setColaAbierta({ seg, canal: "whatsapp" })} className="text-xs px-3 py-1.5 rounded-md text-white disabled:opacity-40" style={{ background: "#1f9e57" }}>
                      Cola de WhatsApp
                    </button>
                  </div>
                  {colaAbierta && colaAbierta.seg.id === seg.id && (
                    <ColaEnvio
                      contactos={enSegmento}
                      segmento={seg}
                      canal={colaAbierta.canal}
                      onCerrar={() => setColaAbierta(null)}
                      onRegistrado={recargar}
                    />
                  )}
                </div>
              ) : (
                <p style={{ color: "#8a8578" }} className="text-sm mt-2">Sin mensaje generado todavía.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
