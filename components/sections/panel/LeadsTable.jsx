"use client";

import { BRAND } from "@/lib/constants";
import { PROJECTS, ESTADOS, labelCanal, waLink, mailLink, todayStr, gmailAuthUserKey } from "@/lib/panel/constants";

function gmailAuthUser() {
  if (typeof window === "undefined") return "0";
  return window.localStorage.getItem(gmailAuthUserKey()) || "0";
}

function ChanTag({ canal }) {
  const colores = { instagram: "#C13584", whatsapp: "#1f9e57", email: "#2563eb" };
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: colores[canal] || "#8b8b9a" }}>
      {labelCanal(canal)}
    </span>
  );
}

function ActionBtn({ href, children, color }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-[11px] font-bold px-2 py-1 rounded-md text-white inline-block" style={{ background: color }}>
      {children}
    </a>
  );
}

// Tabla de contactos compartida entre las vistas por proyecto y "Todos los
// Contactos": muestra los botones de canal (WhatsApp/Gmail/Instagram) que
// abren la sesión real de Marisa, el botón "+ Seguimiento" para Apps a
// Medida, y borrar.
export default function LeadsTable({ leads, onEstadoChange, onDelete, onEnviarSeguimiento }) {
  if (!leads.length) {
    return (
      <div className="rounded-xl p-8 text-center text-sm" style={{ background: "#ffffff", border: "1px solid #e4dfd3", color: "#8a8578" }}>
        Todavía no hay contactos cargados.
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-x-auto" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f7f4ed" }}>
            {["Nombre / Proyecto", "Empresa / Rubro", "Canal", "Estado", "Próxima acción", "Notas", "Acciones"].map((h) => (
              <th key={h} style={{ color: "#8a8578" }} className="text-left text-[11px] uppercase font-semibold px-3 py-2 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const vencida = lead.proxima_accion && lead.proxima_accion <= todayStr();
            const puedeSeguimiento = lead.proyecto === "apps" && !lead.en_seguimiento && lead.estado !== "Cerrado ganado" && lead.estado !== "Cerrado perdido";
            return (
              <tr key={lead.id} style={{ borderTop: "1px solid #f0ece2" }}>
                <td className="px-3 py-2 align-top">
                  <div style={{ color: BRAND.navy }} className="font-medium">{lead.nombre}</div>
                  <div style={{ color: "#a89f88" }} className="text-[11px]">{PROJECTS[lead.proyecto]?.nombre}</div>
                </td>
                <td className="px-3 py-2 align-top">
                  <div style={{ color: "#4a4740" }}>{lead.empresa || "—"}</div>
                  {lead.rubro && <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#eee9dd", color: "#6b6759" }}>{lead.rubro}</span>}
                </td>
                <td className="px-3 py-2 align-top"><ChanTag canal={lead.canal} /></td>
                <td className="px-3 py-2 align-top">
                  <select value={lead.estado || ""} onChange={(e) => onEstadoChange(lead.id, e.target.value)}
                    className="text-xs rounded-md px-1.5 py-1" style={{ border: "1px solid #e4dfd3" }}>
                    {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 align-top text-xs" style={vencida ? { color: "#b3453f", fontWeight: 700 } : { color: "#4a4740" }}>
                  {lead.proxima_accion || "—"}
                </td>
                <td className="px-3 py-2 align-top text-xs max-w-[160px]" style={{ color: "#6b6759" }}>{lead.notas || ""}</td>
                <td className="px-3 py-2 align-top">
                  <div className="flex flex-wrap gap-1.5">
                    {lead.canal === "whatsapp" && lead.telefono && (
                      <ActionBtn href={waLink(lead)} color="#1f9e57">WhatsApp</ActionBtn>
                    )}
                    {lead.canal === "email" && lead.mail && (
                      <ActionBtn href={mailLink(lead, gmailAuthUser())} color="#2563eb">Gmail</ActionBtn>
                    )}
                    {lead.canal === "instagram" && (
                      <ActionBtn href="https://instagram.com/direct/inbox/" color="#C13584">Instagram DM</ActionBtn>
                    )}
                    {lead.en_seguimiento && (
                      <span className="text-[11px] font-bold px-2 py-1 rounded-md" style={{ background: "#e5e7eb", color: "#374151" }}>En seguimiento</span>
                    )}
                    {puedeSeguimiento && (
                      <button onClick={() => onEnviarSeguimiento(lead.id)} className="text-[11px] font-bold px-2 py-1 rounded-md text-white" style={{ background: "#7c3aed" }}>
                        + Seguimiento
                      </button>
                    )}
                    <button onClick={() => onDelete(lead.id)} className="text-[11px] font-bold px-2 py-1 rounded-md text-white" style={{ background: "#ef4444" }}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
