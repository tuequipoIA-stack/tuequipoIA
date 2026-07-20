"use client";

import { useState } from "react";
import { BRAND } from "@/lib/constants";
import { ETAPAS, waLink, mailLink, gmailAuthUserKey } from "@/lib/panel/constants";

function gmailAuthUser() {
  if (typeof window === "undefined") return "0";
  return window.localStorage.getItem(gmailAuthUserKey()) || "0";
}

function ChannelButtons({ lead }) {
  return (
    <div className="flex flex-wrap gap-1 my-1.5">
      {lead.canal === "whatsapp" && lead.telefono && (
        <a href={waLink(lead)} target="_blank" rel="noreferrer" className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: "#1f9e57" }}>WhatsApp</a>
      )}
      {lead.canal === "email" && lead.mail && (
        <a href={mailLink(lead, gmailAuthUser())} target="_blank" rel="noreferrer" className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: "#2563eb" }}>Gmail</a>
      )}
      {lead.canal === "instagram" && (
        <a href="https://instagram.com/direct/inbox/" target="_blank" rel="noreferrer" className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: "#C13584" }}>Instagram DM</a>
      )}
    </div>
  );
}

function KanbanCard({ lead, onMove, dragging, setDragging }) {
  const idx = ETAPAS.indexOf(lead.etapa);
  return (
    <div
      draggable
      onDragStart={() => setDragging(lead.id)}
      onDragEnd={() => setDragging(null)}
      className="rounded-lg p-2.5 mb-2 text-xs cursor-grab"
      style={{ background: "#ffffff", border: "1px solid #e4dfd3", opacity: dragging === lead.id ? 0.4 : 1 }}
    >
      <div style={{ color: BRAND.navy }} className="font-bold text-[13px]">{lead.nombre}</div>
      <div style={{ color: "#a89f88" }} className="text-[11px] mb-1">{lead.empresa || ""}</div>
      {lead.rubro && <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#eee9dd", color: "#6b6759" }}>{lead.rubro}</span>}
      <ChannelButtons lead={lead} />
      <div className="flex flex-wrap gap-1 mt-1.5">
        {lead.etapa !== "Perdido" ? (
          <>
            {idx > 0 && <button onClick={() => onMove(lead.id, ETAPAS[idx - 1])} className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#f9fafb", border: "1px solid #e4dfd3" }}>‹ Volver</button>}
            {idx < 2 && <button onClick={() => onMove(lead.id, ETAPAS[idx + 1])} className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#f9fafb", border: "1px solid #e4dfd3" }}>Avanzar ›</button>}
            <button onClick={() => onMove(lead.id, "Perdido")} className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#f9fafb", border: "1px solid #fecaca", color: "#b91c1c" }}>Perdido</button>
          </>
        ) : (
          <button onClick={() => onMove(lead.id, "Reunión coordinada")} className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#f9fafb", border: "1px solid #e4dfd3" }}>Reactivar</button>
        )}
      </div>
    </div>
  );
}

export default function PanelSeguimiento({ leads, moverEtapa }) {
  const [dragging, setDragging] = useState(null);
  const [dragOverEtapa, setDragOverEtapa] = useState(null);
  const appsLeads = leads.filter((l) => l.proyecto === "apps" && l.en_seguimiento);

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Seguimiento de Interesados — Apps a Medida</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">Arrastrá las tarjetas entre columnas o usá los botones. Al llegar a &ldquo;Confirmado&rdquo; el proyecto pasa directo a Cobros.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
        {ETAPAS.map((etapa) => {
          const items = appsLeads.filter((l) => l.etapa === etapa);
          return (
            <div key={etapa} className="rounded-xl p-2.5" style={{ background: "#f7f4ed", border: "1px solid #e4dfd3", minHeight: 140 }}>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span style={{ color: "#8a8578" }} className="text-[11px] font-bold uppercase tracking-wide">{etapa}</span>
                <span className="text-[11px] rounded-full px-1.5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>{items.length}</span>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverEtapa(etapa); }}
                onDragLeave={() => setDragOverEtapa((cur) => (cur === etapa ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverEtapa(null);
                  if (dragging) moverEtapa(dragging, etapa);
                }}
                className="rounded-lg min-h-[60px] transition-colors"
                style={dragOverEtapa === etapa ? { background: "#e5e7eb" } : undefined}
              >
                {items.length === 0 && <div style={{ color: "#a89f88" }} className="text-xs px-1 py-2">Sin contactos</div>}
                {items.map((lead) => (
                  <KanbanCard key={lead.id} lead={lead} onMove={moverEtapa} dragging={dragging} setDragging={setDragging} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
