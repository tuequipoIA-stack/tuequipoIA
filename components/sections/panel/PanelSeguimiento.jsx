"use client";

import { useState } from "react";
import { BRAND } from "@/lib/constants";
import { ETAPAS, waLink, mailLink, gmailAuthUserKey } from "@/lib/panel/constants";

function gmailAuthUser() {
  if (typeof window === "undefined") return "0";
  return window.localStorage.getItem(gmailAuthUserKey()) || "0";
}

// Colores pastel por etapa (fondos claritos, no colores fuertes).
const ETAPA_ESTILOS = {
  "Reunión coordinada": { bg: "#FDF1E3", borde: "#F5D9B0", header: "#B4732A" },
  "Presupuesto enviado": { bg: "#F2EDFA", borde: "#DCCBF2", header: "#7A54B8" },
  "Confirmado": { bg: "#EAF7EE", borde: "#C3E7CD", header: "#2E8B4F" },
  "Perdido": { bg: "#FBEBEA", borde: "#F1C6C3", header: "#B3453F" },
};

const DIAS_ABR = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MES_NOMBRES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function formatReunion(fecha, hora) {
  if (!fecha) return null;
  const d = parseISODate(fecha);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${DIAS_ABR[d.getDay()]} ${dd}/${mm}${hora ? ` ${hora}hs` : ""}`;
}
function formatTarifa(t) {
  if (t == null) return null;
  return `$${Number(t).toLocaleString("es-AR")}`;
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

// Mini calendario desplegable para elegir fecha + hora de la reunión.
function CalendarioPopover({ lead, onGuardar, onQuitar, onCerrar }) {
  const inicial = lead.reunion_fecha ? parseISODate(lead.reunion_fecha) : new Date();
  const [viewYear, setViewYear] = useState(inicial.getFullYear());
  const [viewMonth, setViewMonth] = useState(inicial.getMonth());
  const [selDate, setSelDate] = useState(lead.reunion_fecha || null);
  const [hora, setHora] = useState(lead.reunion_hora || "16:00");

  const primerDiaSemana = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // 0 = lunes
  const totalDias = new Date(viewYear, viewMonth + 1, 0).getDate();
  const celdas = [];
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(d);

  const cambiarMes = (delta) => {
    let m = viewMonth + delta, y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute z-30 top-full left-0 mt-1 w-52 rounded-lg p-2.5 shadow-lg"
      style={{ background: "#ffffff", border: "1px solid #e4dfd3", boxShadow: "0 10px 26px rgba(0,0,0,0.14)" }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <button type="button" onClick={() => cambiarMes(-1)} className="px-1.5 rounded" style={{ color: "#6b6759" }}>‹</button>
        <span style={{ color: BRAND.navy }} className="text-[11px] font-bold capitalize">{MES_NOMBRES[viewMonth]} {viewYear}</span>
        <button type="button" onClick={() => cambiarMes(1)} className="px-1.5 rounded" style={{ color: "#6b6759" }}>›</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1 text-center">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <span key={d} style={{ color: "#a89f88" }} className="text-[9px] font-bold">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {celdas.map((d, i) => {
          if (!d) return <span key={i} />;
          const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const sel = selDate === iso;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelDate(iso)}
              className="aspect-square rounded text-[10.5px]"
              style={sel ? { background: BRAND.teal, color: "#ffffff", fontWeight: 700 } : { color: "#4a4740" }}
            >
              {d}
            </button>
          );
        })}
      </div>
      <label style={{ color: "#6b6759" }} className="text-[10.5px] font-semibold block mb-1">Hora</label>
      <input
        type="time"
        value={hora}
        onChange={(e) => setHora(e.target.value)}
        className="w-full rounded-md px-1.5 py-1 text-xs mb-2"
        style={{ border: "1px solid #e4dfd3" }}
      />
      <div className="flex gap-1.5 flex-wrap">
        <button type="button" onClick={() => selDate && onGuardar(selDate, hora)}
          className="rounded-md px-2 py-1 text-[10.5px] font-bold" style={{ background: BRAND.teal, color: BRAND.navy }}>
          Guardar
        </button>
        <button type="button" onClick={onCerrar} className="rounded-md px-2 py-1 text-[10.5px]" style={{ border: "1px solid #e4dfd3", color: "#6b6759" }}>
          Cancelar
        </button>
        {lead.reunion_fecha && (
          <button type="button" onClick={onQuitar} className="rounded-md px-2 py-1 text-[10.5px]" style={{ border: "1px solid #f1c6c3", color: "#b3453f" }}>
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}

// Mini formulario desplegable para cargar la tarifa acordada.
function TarifaPopover({ lead, onGuardar, onQuitar, onCerrar }) {
  const [valor, setValor] = useState(lead.tarifa != null ? String(lead.tarifa) : "");

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute z-30 top-full left-0 mt-1 w-44 rounded-lg p-2.5 shadow-lg"
      style={{ background: "#ffffff", border: "1px solid #e4dfd3", boxShadow: "0 10px 26px rgba(0,0,0,0.14)" }}
    >
      <label style={{ color: "#6b6759" }} className="text-[10.5px] font-semibold block mb-1">Tarifa</label>
      <input
        type="number"
        min="0"
        step="1000"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="0"
        className="w-full rounded-md px-1.5 py-1 text-xs mb-2"
        style={{ border: "1px solid #e4dfd3" }}
      />
      <div className="flex gap-1.5 flex-wrap">
        <button type="button" onClick={() => onGuardar(valor === "" ? null : parseFloat(valor))}
          className="rounded-md px-2 py-1 text-[10.5px] font-bold" style={{ background: "#f4eefb", color: "#7A54B8", border: "1px solid #dcc9f2" }}>
          Guardar
        </button>
        <button type="button" onClick={onCerrar} className="rounded-md px-2 py-1 text-[10.5px]" style={{ border: "1px solid #e4dfd3", color: "#6b6759" }}>
          Cancelar
        </button>
        {lead.tarifa != null && (
          <button type="button" onClick={onQuitar} className="rounded-md px-2 py-1 text-[10.5px]" style={{ border: "1px solid #f1c6c3", color: "#b3453f" }}>
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ lead, onMove, dragging, setDragging, actualizarLead }) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(lead.nombre);
  const [empresa, setEmpresa] = useState(lead.empresa || "");
  const [descripcion, setDescripcion] = useState(lead.descripcion || "");
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [tarifaAbierta, setTarifaAbierta] = useState(false);

  const guardarEdicion = async () => {
    await actualizarLead(lead.id, { nombre: nombre.trim() || lead.nombre, empresa: empresa.trim(), descripcion: descripcion.trim() });
    setEditando(false);
  };
  const cancelarEdicion = () => {
    setNombre(lead.nombre);
    setEmpresa(lead.empresa || "");
    setDescripcion(lead.descripcion || "");
    setEditando(false);
  };

  if (editando) {
    return (
      <div className="rounded-lg p-2.5 mb-2 text-xs" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-md px-1.5 py-1 text-[13px] font-bold mb-1" style={{ border: "1px solid #e4dfd3", color: BRAND.navy }} />
        <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Empresa"
          className="w-full rounded-md px-1.5 py-1 text-[11px] mb-1" style={{ border: "1px solid #e4dfd3" }} />
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción / notas..." rows={2}
          className="w-full rounded-md px-1.5 py-1 text-[11px] mb-1.5" style={{ border: "1px solid #e4dfd3" }} />
        <div className="flex gap-1.5">
          <button type="button" onClick={guardarEdicion} className="text-[11px] font-bold px-2 py-1 rounded-md" style={{ background: BRAND.teal, color: BRAND.navy }}>
            Guardar
          </button>
          <button type="button" onClick={cancelarEdicion} className="text-[11px] px-2 py-1 rounded-md" style={{ border: "1px solid #e4dfd3", color: "#6b6759" }}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  const reunionLabel = formatReunion(lead.reunion_fecha, lead.reunion_hora);
  const tarifaLabel = formatTarifa(lead.tarifa);

  return (
    <div
      draggable
      onDragStart={() => setDragging(lead.id)}
      onDragEnd={() => setDragging(null)}
      className="rounded-lg p-2.5 mb-2 text-xs cursor-grab relative"
      style={{ background: "#ffffff", border: "1px solid #e4dfd3", opacity: dragging === lead.id ? 0.4 : 1 }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div style={{ color: BRAND.navy }} className="font-bold text-[13px]">{lead.nombre}</div>
          <div style={{ color: "#a89f88" }} className="text-[11px]">{lead.empresa || ""}</div>
        </div>
        <button type="button" onClick={() => setEditando(true)} title="Editar" style={{ color: "#a89f88" }} className="shrink-0 px-0.5">✎</button>
      </div>
      {lead.rubro && <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1" style={{ background: "#eee9dd", color: "#6b6759" }}>{lead.rubro}</span>}
      <div className="rounded-md px-1.5 py-1 mt-1.5 text-[11px]" style={{ background: "#faf8f3", border: "1px solid #f0ece2", color: lead.descripcion ? "#6b6759" : "#a89f88", fontStyle: lead.descripcion ? "normal" : "italic" }}>
        {lead.descripcion || "Sin descripción"}
      </div>
      <ChannelButtons lead={lead} />

      {lead.etapa !== "Confirmado" && (
        <div className="relative mt-1.5">
          <button
            type="button"
            onClick={() => { setCalendarioAbierto((v) => !v); setTarifaAbierta(false); }}
            className="text-[10.5px] font-semibold px-2 py-1 rounded-md"
            style={reunionLabel ? { background: "#eaf6f6", border: "1px solid #bfe3e2", color: BRAND.navy } : { background: "#f9fafb", border: "1px solid #e4dfd3", color: "#4a4740" }}
          >
            📅 {reunionLabel || "Agendar reunión"}
          </button>
          {calendarioAbierto && (
            <CalendarioPopover
              lead={lead}
              onGuardar={async (fecha, hora) => {
                await actualizarLead(lead.id, { reunionFecha: fecha, reunionHora: hora });
                setCalendarioAbierto(false);
              }}
              onQuitar={async () => {
                await actualizarLead(lead.id, { reunionFecha: null, reunionHora: null });
                setCalendarioAbierto(false);
              }}
              onCerrar={() => setCalendarioAbierto(false)}
            />
          )}
        </div>
      )}

      {lead.etapa === "Presupuesto enviado" && (
        <div className="relative mt-1.5">
          <button
            type="button"
            onClick={() => { setTarifaAbierta((v) => !v); setCalendarioAbierto(false); }}
            className="text-[10.5px] font-semibold px-2 py-1 rounded-md"
            style={tarifaLabel ? { background: "#f4eefb", border: "1px solid #dcc9f2", color: "#7A54B8" } : { background: "#f9fafb", border: "1px solid #e4dfd3", color: "#4a4740" }}
          >
            💲 {tarifaLabel || "Poner tarifa"}
          </button>
          {tarifaAbierta && (
            <TarifaPopover
              lead={lead}
              onGuardar={async (valor) => {
                await actualizarLead(lead.id, { tarifa: valor });
                setTarifaAbierta(false);
              }}
              onQuitar={async () => {
                await actualizarLead(lead.id, { tarifa: null });
                setTarifaAbierta(false);
              }}
              onCerrar={() => setTarifaAbierta(false)}
            />
          )}
        </div>
      )}

      {lead.etapa === "Perdido" && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          <button onClick={() => onMove(lead.id, "Reunión coordinada")} className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#f9fafb", border: "1px solid #e4dfd3" }}>
            Reactivar
          </button>
        </div>
      )}
    </div>
  );
}

export default function PanelSeguimiento({ leads, moverEtapa, actualizarLead }) {
  const [dragging, setDragging] = useState(null);
  const [dragOverEtapa, setDragOverEtapa] = useState(null);
  const appsLeads = leads.filter((l) => l.proyecto === "apps" && l.en_seguimiento);

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Seguimiento</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">Arrastrá las tarjetas entre columnas. Al llegar a &ldquo;Confirmado&rdquo; el proyecto pasa directo a Cobros.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
        {ETAPAS.map((etapa) => {
          const estilo = ETAPA_ESTILOS[etapa];
          const items = appsLeads.filter((l) => l.etapa === etapa);
          return (
            <div key={etapa} className="rounded-xl p-2.5" style={{ background: estilo.bg, border: `1px solid ${estilo.borde}`, minHeight: 140 }}>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span style={{ color: estilo.header }} className="text-[11px] font-bold uppercase tracking-wide">{etapa}</span>
                <span className="text-[11px] rounded-full px-1.5" style={{ background: "rgba(255,255,255,0.75)" }}>{items.length}</span>
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
                style={dragOverEtapa === etapa ? { background: "rgba(255,255,255,0.55)" } : undefined}
              >
                {items.length === 0 && <div style={{ color: "#a89f88" }} className="text-xs px-1 py-2">Sin contactos</div>}
                {items.map((lead) => (
                  <KanbanCard key={lead.id} lead={lead} onMove={moverEtapa} dragging={dragging} setDragging={setDragging} actualizarLead={actualizarLead} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
