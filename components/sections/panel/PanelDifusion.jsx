"use client";

import { useMemo, useState } from "react";
import { BRAND } from "@/lib/constants";

export default function PanelDifusion({ leads, listas, enviados, marcarEnviado, reiniciarEnviados }) {
  const [listaId, setListaId] = useState("");
  const [mensaje, setMensaje] = useState("");

  const lista = listas.find((l) => l.id === listaId);
  const contactos = lista ? leads.filter((l) => (lista.lead_ids || []).includes(l.id)) : [];
  const conWsp = contactos.filter((l) => l.canal === "whatsapp" && l.telefono);
  const enviadosIds = useMemo(() => new Set(enviados.filter((e) => e.canal === "whatsapp" && e.lista_id === listaId).map((e) => e.lead_id)), [enviados, listaId]);

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-2">Listas de Difusión — WhatsApp</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">
        WhatsApp no permite mandar a varios contactos con un solo clic desde acá — eso requiere el WhatsApp Business Platform de Meta (de pago, con verificación de negocio). Elegí una lista, escribí el mensaje y te arma un botón de envío individual y personalizado por contacto para dispararlo desde tu WhatsApp Business, uno por uno.
      </p>

      <select value={listaId} onChange={(e) => setListaId(e.target.value)} className="rounded-lg px-2.5 py-1.5 text-sm mb-2" style={{ border: "1px solid #e4dfd3" }}>
        <option value="">Elegí una lista...</option>
        {listas.map((l) => <option key={l.id} value={l.id}>{l.nombre} ({(l.lead_ids || []).length})</option>)}
      </select>
      <div style={{ color: "#8a8578" }} className="text-xs mb-4">
        {listaId ? `${conWsp.length} de ${contactos.length} contacto(s) de la lista tienen WhatsApp cargado.` : "Elegí una lista para ver los destinatarios."}
      </div>

      <div className="rounded-xl p-4 mb-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Mensaje (usá {"{nombre}"} y {"{empresa}"} para personalizar)</label>
        <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={4} placeholder="Hola {nombre}, ..." className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 style={{ color: BRAND.navy }} className="text-sm font-bold uppercase tracking-wide">Contactos a enviar</h3>
        <button onClick={() => reiniciarEnviados(conWsp.map((l) => l.id), "whatsapp")} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "#eee9dd", color: "#6b6759" }}>
          Reiniciar marcas de enviado
        </button>
      </div>

      {!conWsp.length ? (
        <div style={{ color: "#8a8578" }} className="text-xs">No hay contactos con canal WhatsApp en la lista elegida.</div>
      ) : (
        <div className="space-y-2">
          {conWsp.map((l) => {
            const sent = enviadosIds.has(l.id);
            const texto = (mensaje || "Hola {nombre}!").replace(/\{nombre\}/g, l.nombre || "").replace(/\{empresa\}/g, l.empresa || "tu empresa");
            const phone = (l.telefono || "").replace(/\D/g, "");
            return (
              <div key={l.id} className="rounded-lg p-3 flex flex-wrap items-center justify-between gap-3" style={{ background: "#ffffff", border: "1px solid #e4dfd3", opacity: sent ? 0.5 : 1 }}>
                <div style={{ color: BRAND.navy, textDecoration: sent ? "line-through" : "none" }} className="text-sm font-semibold">
                  {l.nombre}{l.empresa && <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#eee9dd", color: "#6b6759" }}>{l.empresa}</span>}
                </div>
                <label className="flex items-center gap-1.5 text-xs" style={{ color: "#8a8578" }}>
                  <input type="checkbox" checked={sent} onChange={(e) => marcarEnviado(l.id, "whatsapp", listaId, e.target.checked)} /> Enviado
                </label>
                <a href={`https://wa.me/${phone}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold px-2.5 py-1 rounded-md text-white" style={{ background: "#1f9e57" }}>
                  Enviar por WhatsApp
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
