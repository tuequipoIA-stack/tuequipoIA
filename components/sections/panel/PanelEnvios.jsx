"use client";

import { useState } from "react";
import { BRAND } from "@/lib/constants";
import { fillTemplate, gmailLink, gmailAuthUserKey, segNombre, waLink } from "@/lib/panel/constants";
import { segmentosApi, interaccionesApi } from "@/lib/panel/api";

function gmailAuthUser() {
  if (typeof window === "undefined") return "0";
  return window.localStorage.getItem(gmailAuthUserKey()) || "0";
}

// Cola manual de WhatsApp: uno por uno, igual mecánica que antes vivía en
// Segmentos. El email ya no se manda así por default (ver "Enviar a todos"
// más abajo, que lo hace automático) pero WhatsApp todavía no tiene forma
// de mandarse solo sin la API de WhatsApp Business, así que sigue siendo
// manual acá.
function ColaWhatsapp({ contactos, segmento, onCerrar, onRegistrado }) {
  const objetivo = contactos.filter((c) => c.telefono && c.estado !== "descartado" && (!c.canal_preferido || c.canal_preferido === "whatsapp"));
  const [enviados, setEnviados] = useState({});

  const marcar = async (c, mensaje) => {
    await interaccionesApi.create({ contacto_id: c.id, canal: "whatsapp", tipo: "mensaje_enviado", contenido: mensaje });
    setEnviados((prev) => ({ ...prev, [c.id]: true }));
    onRegistrado();
  };

  return (
    <div className="rounded-xl p-4 mt-3" style={{ background: "#faf9f6", border: "1px solid #e4dfd3" }}>
      <div className="flex items-center justify-between mb-3">
        <h4 style={{ color: BRAND.navy }} className="text-sm font-semibold">Cola de WhatsApp — {segNombre(segmento)} ({objetivo.length})</h4>
        <button onClick={onCerrar} className="text-xs" style={{ color: "#8a8578" }}>Cerrar</button>
      </div>
      {objetivo.length === 0 ? (
        <p style={{ color: "#8a8578" }} className="text-sm">No hay contactos disponibles (con teléfono) en este segmento.</p>
      ) : (
        <div className="space-y-2">
          {objetivo.map((c) => {
            const mensaje = fillTemplate(segmento.mensaje_base_whatsapp, c);
            const href = waLink(c, mensaje);
            const ya = !!enviados[c.id];
            return (
              <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg p-2.5" style={{ background: "#ffffff", border: "1px solid #eee7d8" }}>
                <div className="text-sm flex-1">
                  <strong style={{ color: BRAND.navy }}>{c.nombre}</strong> <span style={{ color: "#8a8578" }}>{c.empresa}</span>
                  <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: "#6b6759" }}>{mensaje}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <a href={href} target="_blank" rel="noreferrer" className="text-[11px] font-bold px-2.5 py-1 rounded-md text-white" style={{ background: "#1f9e57" }}>Abrir WhatsApp</a>
                  <button disabled={ya} onClick={() => marcar(c, mensaje)} className="text-[11px] px-2.5 py-1 rounded-md" style={{ background: ya ? "#eaf3de" : "#f1efe8", color: ya ? "#27500a" : "#4a4740" }}>
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

// Segmentos que ya se aprobaron en "Segmentos" caen acá, listos para
// mandar. "Enviar a todos" hace un solo click y manda el email
// personalizado (asunto + cuerpo con {{nombre}}/{{empresa}} reemplazados)
// a cada contacto del segmento de forma automática, sin abrir Gmail uno
// por uno. WhatsApp por ahora sigue siendo manual (ver ColaWhatsapp).
export default function PanelEnvios({ segmentos, contactos, marcaFiltro, recargar, showToast }) {
  const [colaAbierta, setColaAbierta] = useState(null);
  const [enviandoId, setEnviandoId] = useState(null);
  const [resultados, setResultados] = useState({});

  const visibles = (marcaFiltro === "todas" ? segmentos : segmentos.filter((s) => s.marca_origen === marcaFiltro)).filter((s) => s.aprobado);

  const enviarTodos = async (seg) => {
    setEnviandoId(seg.id);
    try {
      const r = await segmentosApi.enviar(seg.id);
      setResultados((prev) => ({ ...prev, [seg.id]: r }));
      showToast(`${r.enviados} enviado${r.enviados === 1 ? "" : "s"}${r.fallidos ? `, ${r.fallidos} con error` : ""}`);
      recargar();
    } catch (e) {
      showToast("Error al enviar: " + e.message);
    }
    setEnviandoId(null);
  };

  const volverABorrador = async (seg) => {
    try {
      await segmentosApi.update(seg.id, { aprobado: false });
      showToast("Volvió a Segmentos para seguir editando");
      recargar();
    } catch (e) {
      showToast("Error: " + e.message);
    }
  };

  if (!visibles.length) {
    return (
      <div>
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Envíos</h2>
        <p style={{ color: "#8a8578" }} className="text-sm">Todavía no hay segmentos aprobados. Generá y aprobá un mensaje en "Segmentos" para que aparezca acá, listo para mandar.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Envíos</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">Segmentos aprobados. Un click en "Enviar a todos" manda el email personalizado a cada contacto de la lista.</p>

      <div className="space-y-4">
        {visibles.map((seg) => {
          const enSegmento = contactos.filter((c) => c.segmento_id === seg.id);
          const conEmail = enSegmento.filter((c) => c.email && c.estado !== "descartado");
          const resultado = resultados[seg.id];
          const colaEstaAbierta = colaAbierta === seg.id;
          return (
            <div key={seg.id} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div>
                  <strong style={{ color: BRAND.navy }}>{segNombre(seg)}</strong>{" "}
                  <span style={{ color: "#8a8578" }} className="text-xs">{seg.marca_origen} · {conEmail.length} con email</span>{" "}
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1" style={{ background: "#eaf3de", color: "#27500a" }}>Aprobado</span>
                </div>
                <button onClick={() => volverABorrador(seg)} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "#f1efe8", color: "#4a4740" }}>Volver a borrador</button>
              </div>

              <div className="text-sm mb-3" style={{ color: "#4a4740" }}>
                <p><strong>Asunto:</strong> {seg.asunto_email}</p>
                <p className="whitespace-pre-wrap mt-1">{seg.mensaje_base_email}</p>
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                <button
                  disabled={enviandoId === seg.id || !conEmail.length}
                  onClick={() => enviarTodos(seg)}
                  className="text-xs px-3 py-1.5 rounded-md text-white disabled:opacity-40"
                  style={{ background: "#2563eb" }}
                >
                  {enviandoId === seg.id ? "Enviando..." : `✉️ Enviar a los ${conEmail.length} por email`}
                </button>
                <button onClick={() => setColaAbierta(colaEstaAbierta ? null : seg.id)} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: "#1f9e57" }}>
                  Cola de WhatsApp
                </button>
              </div>

              {resultado && (
                <p className="text-xs mt-2" style={{ color: resultado.fallidos ? "#854f0b" : "#27500a" }}>
                  {resultado.enviados} enviado{resultado.enviados === 1 ? "" : "s"}{resultado.fallidos ? `, ${resultado.fallidos} con error (revisá el email de esos contactos)` : ""}.
                </p>
              )}

              {colaEstaAbierta && (
                <ColaWhatsapp contactos={enSegmento} segmento={seg} onCerrar={() => setColaAbierta(null)} onRegistrado={recargar} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
