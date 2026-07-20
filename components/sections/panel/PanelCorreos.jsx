"use client";

import { useMemo, useState } from "react";
import { BRAND } from "@/lib/constants";
import { gmailLink, gmailAuthUserKey } from "@/lib/panel/constants";

export default function PanelCorreos({ leads, listas, enviados, marcarEnviado, reiniciarEnviados, showToast }) {
  const [authuser, setAuthuser] = useState(() => (typeof window === "undefined" ? "0" : window.localStorage.getItem(gmailAuthUserKey()) || "0"));
  const [listaId, setListaId] = useState("");
  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("");

  const cambiarAuthuser = (v) => {
    setAuthuser(v);
    window.localStorage.setItem(gmailAuthUserKey(), v);
    showToast("Cuenta de Gmail actualizada");
  };

  const lista = listas.find((l) => l.id === listaId);
  const contactos = lista ? leads.filter((l) => (lista.lead_ids || []).includes(l.id)) : [];
  const conEmail = contactos.filter((l) => l.mail);
  const enviadosIds = useMemo(() => new Set(enviados.filter((e) => e.canal === "email" && e.lista_id === listaId).map((e) => e.lead_id)), [enviados, listaId]);

  const abrirTodosCCO = () => {
    if (!conEmail.length) { showToast("Elegí una lista con contactos que tengan email"); return; }
    const bcc = conEmail.map((l) => l.mail).join(",");
    window.open(gmailLink("", asunto, cuerpo, bcc, authuser), "_blank");
    showToast(`Abriendo un borrador en Gmail con ${conEmail.length} destinatario(s) en CCO`);
  };

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-4">Armado de Correos</h2>

      <div className="rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold">Cuenta de Gmail a usar</label>
        <select value={authuser} onChange={(e) => cambiarAuthuser(e.target.value)} className="rounded-lg px-2.5 py-1.5 text-sm" style={{ border: "1px solid #e4dfd3" }}>
          <option value="0">Cuenta principal</option>
          <option value="1">Cuenta 2</option>
          <option value="2">Cuenta 3</option>
          <option value="3">Cuenta 4</option>
        </select>
        <span style={{ color: "#a89f88" }} className="text-xs">Elegí el número de orden de tu Gmail de &ldquo;tu equipo IA&rdquo; tal como aparece logueado en el navegador.</span>
      </div>

      <select value={listaId} onChange={(e) => setListaId(e.target.value)} className="rounded-lg px-2.5 py-1.5 text-sm mb-2" style={{ border: "1px solid #e4dfd3" }}>
        <option value="">Elegí una lista...</option>
        {listas.map((l) => <option key={l.id} value={l.id}>{l.nombre} ({(l.lead_ids || []).length})</option>)}
      </select>
      <div style={{ color: "#8a8578" }} className="text-xs mb-4">
        {listaId ? `${conEmail.length} de ${contactos.length} contacto(s) de la lista tienen email cargado.` : "Elegí una lista para ver los destinatarios."}
      </div>

      <div className="rounded-xl p-4 mb-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Asunto</label>
        <input value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Asunto del correo" className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
        <label style={{ color: "#8a8578" }} className="text-xs font-semibold block mb-1">Cuerpo (usá {"{nombre}"} y {"{empresa}"} para personalizar)</label>
        <textarea value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} rows={6} placeholder="Escribí el mensaje..." className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
        <button onClick={abrirTodosCCO} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "#eee9dd", color: "#6b6759" }}>
          Alternativa rápida: un solo borrador con todos en CCO (menos personalizado)
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 style={{ color: BRAND.navy }} className="text-sm font-bold uppercase tracking-wide">Enviar de a uno, personalizado</h3>
        <button onClick={() => reiniciarEnviados(conEmail.map((l) => l.id), "email")} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "#eee9dd", color: "#6b6759" }}>
          Reiniciar marcas de enviado
        </button>
      </div>

      {!conEmail.length ? (
        <div style={{ color: "#8a8578" }} className="text-xs">No hay contactos con email en la lista elegida.</div>
      ) : (
        <div className="space-y-2">
          {conEmail.map((l) => {
            const sent = enviadosIds.has(l.id);
            const subj = asunto.replace(/\{nombre\}/g, l.nombre || "").replace(/\{empresa\}/g, l.empresa || "tu empresa");
            const body = cuerpo.replace(/\{nombre\}/g, l.nombre || "").replace(/\{empresa\}/g, l.empresa || "tu empresa");
            return (
              <div key={l.id} className="rounded-lg p-3 flex flex-wrap items-center justify-between gap-3" style={{ background: "#ffffff", border: "1px solid #e4dfd3", opacity: sent ? 0.5 : 1 }}>
                <div style={{ color: BRAND.navy, textDecoration: sent ? "line-through" : "none" }} className="text-sm font-semibold">
                  {l.nombre}{l.empresa && <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#eee9dd", color: "#6b6759" }}>{l.empresa}</span>}
                </div>
                <label className="flex items-center gap-1.5 text-xs" style={{ color: "#8a8578" }}>
                  <input type="checkbox" checked={sent} onChange={(e) => marcarEnviado(l.id, "email", listaId, e.target.checked)} /> Enviado
                </label>
                <a href={gmailLink(l.mail, subj, body, null, authuser)} target="_blank" rel="noreferrer" className="text-[11px] font-bold px-2.5 py-1 rounded-md text-white" style={{ background: "#2563eb" }}>
                  Abrir en Gmail
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
