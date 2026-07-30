"use client";

import { BRAND } from "@/lib/constants";
import { ESTADO_COLOR, labelEstado, segNombre, todayStr } from "@/lib/panel/constants";

export default function PanelHoy({ contactos, segmentos, onAbrirContacto }) {
  const vencidos = contactos
    .filter((c) => c.proximo_seguimiento && c.proximo_seguimiento <= new Date().toISOString() && !["reunion", "descartado"].includes(c.estado))
    .sort((a, b) => (a.proximo_seguimiento || "").localeCompare(b.proximo_seguimiento || ""));

  const total = contactos.length;
  const aSeguirHoy = vencidos.length;
  const respondieron = contactos.filter((c) => c.estado === "respondio" || c.estado === "reunion").length;
  const nuevos = contactos.filter((c) => c.estado === "nuevo").length;

  const metricas = [
    { label: "Contactos", valor: total },
    { label: "A seguir hoy", valor: aSeguirHoy },
    { label: "Respondieron / reunión", valor: respondieron },
    { label: "Nuevos sin contactar", valor: nuevos },
  ];

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Hoy</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">Seguimientos vencidos y estado general de la prospección.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {metricas.map((m) => (
          <div key={m.label} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
            <div style={{ color: "#8a8578" }} className="text-xs mb-1">{m.label}</div>
            <div style={{ color: BRAND.navy }} className="text-2xl font-bold">{m.valor}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <h3 style={{ color: BRAND.navy }} className="text-sm font-semibold mb-3">Seguimientos vencidos</h3>
        {vencidos.length === 0 ? (
          <p style={{ color: "#8a8578" }} className="text-sm">Sin seguimientos vencidos. Al día.</p>
        ) : (
          <div className="space-y-2">
            {vencidos.map((c) => {
              const seg = segmentos.find((s) => s.id === c.segmento_id);
              const col = ESTADO_COLOR[c.estado] || ESTADO_COLOR.nuevo;
              return (
                <button
                  key={c.id}
                  onClick={() => onAbrirContacto(c.id)}
                  className="w-full text-left flex items-center justify-between text-sm py-2 px-3 rounded-lg"
                  style={{ borderLeft: `3px solid ${BRAND.navy}`, background: "#faf9f6" }}
                >
                  <span>
                    <strong style={{ color: BRAND.navy }}>{c.nombre}</strong>{" "}
                    <span style={{ color: "#6b6759" }}>— {c.empresa || "sin empresa"} · {c.puesto || "sin puesto"} · {seg ? segNombre(seg) : "sin segmento"}</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: col.bg, color: col.text }}>
                    {labelEstado(c.estado)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
