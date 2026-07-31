"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { segNombre } from "@/lib/panel/constants";
import { segmentosApi } from "@/lib/panel/api";

function Chip({ children }) {
  return (
    <span className="inline-block text-xs px-2.5 py-1 rounded-full mr-1.5 mb-1.5" style={{ background: "#f3f1ea", color: "#4a4740" }}>
      {children}
    </span>
  );
}

// Cada segmento es un acordeón: colapsado por default, se despliega hacia
// abajo al tocar su encabezado o cualquiera de sus botones (generar,
// regenerar, aprobar). Ya no hay un modo "Editar" separado: si hay mensaje
// generado, sus campos se muestran directamente editables — lo que se
// escribe ahí se guarda con "Guardar cambios". Al aprobar, el segmento
// desaparece de esta lista y pasa a la sección "Envíos" para mandarlo.
export default function PanelSegmentos({ segmentos, contactos, marcaFiltro, recargar, showToast }) {
  const [abierto, setAbierto] = useState(null);
  const [generando, setGenerando] = useState(null);
  const [guardando, setGuardando] = useState(null);
  const [campos, setCampos] = useState({ asunto_email: "", mensaje_base_email: "", mensaje_base_whatsapp: "", hooks: "" });

  const visibles = (marcaFiltro === "todas" ? segmentos : segmentos.filter((s) => s.marca_origen === marcaFiltro)).filter((s) => !s.aprobado);

  const cargarCampos = (seg) => {
    setCampos({
      asunto_email: seg.asunto_email || "",
      mensaje_base_email: seg.mensaje_base_email || "",
      mensaje_base_whatsapp: seg.mensaje_base_whatsapp || "",
      hooks: (seg.hooks || []).join(" | "),
    });
  };

  const toggleAbierto = (seg) => {
    if (abierto === seg.id) {
      setAbierto(null);
      return;
    }
    setAbierto(seg.id);
    cargarCampos(seg);
  };

  const generar = async (seg) => {
    setGenerando(seg.id);
    setAbierto(seg.id);
    try {
      const actualizado = await segmentosApi.generar(seg.id);
      cargarCampos(actualizado);
      showToast("Mensaje generado");
      recargar();
    } catch (e) {
      showToast("Error al generar: " + e.message);
    }
    setGenerando(null);
  };

  const guardarCambios = async (seg) => {
    setGuardando(seg.id);
    try {
      await segmentosApi.update(seg.id, {
        asunto_email: campos.asunto_email,
        mensaje_base_email: campos.mensaje_base_email,
        mensaje_base_whatsapp: campos.mensaje_base_whatsapp,
        hooks: campos.hooks.split("|").map((h) => h.trim()).filter(Boolean),
      });
      showToast("Cambios guardados");
      recargar();
    } catch (e) {
      showToast("Error al guardar: " + e.message);
    }
    setGuardando(null);
  };

  const aprobar = async (seg) => {
    try {
      await segmentosApi.update(seg.id, { aprobado: true });
      showToast("Aprobado — pasó a Envíos");
      setAbierto(null);
      recargar();
    } catch (e) {
      showToast("Error al aprobar: " + e.message);
    }
  };

  if (!visibles.length) {
    return (
      <div>
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Segmentos</h2>
        <p style={{ color: "#8a8578" }} className="text-sm">
          No hay segmentos en borrador. Se crean solos al cargar contactos por CSV en "Contactos", y los que ya aprobaste están en "Envíos".
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Segmentos</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">Cada segmento cruza industria × puesto × marca. Generá el mensaje con IA, revisalo y aprobalo — al aprobarlo pasa a "Envíos", listo para mandar.</p>

      <div className="space-y-3">
        {visibles.map((seg) => {
          const enSegmento = contactos.filter((c) => c.segmento_id === seg.id);
          const abiertoEste = abierto === seg.id;
          return (
            <div key={seg.id} className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
              <button
                onClick={() => toggleAbierto(seg)}
                className="w-full flex items-center justify-between flex-wrap gap-2 p-4 text-left"
                style={{ background: abiertoEste ? "#faf9f6" : "transparent" }}
              >
                <div>
                  <strong style={{ color: BRAND.navy }}>{segNombre(seg)}</strong>{" "}
                  <span style={{ color: "#8a8578" }} className="text-xs">{seg.marca_origen} · {enSegmento.length} contacto(s)</span>{" "}
                  {!seg.mensaje_base_email && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1" style={{ background: "#faeeda", color: "#854f0b" }}>Sin generar</span>
                  )}
                </div>
                <ChevronDown size={16} style={{ color: "#8a8578", transform: abiertoEste ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
              </button>

              {abiertoEste && (
                <div className="px-4 pb-4">
                  {!seg.mensaje_base_email ? (
                    <div className="flex items-center gap-2 pt-1">
                      <p style={{ color: "#8a8578" }} className="text-sm flex-1">Sin mensaje generado todavía.</p>
                      <button disabled={generando === seg.id} onClick={() => generar(seg)} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: BRAND.navy }}>
                        {generando === seg.id ? "Generando..." : "✨ Generar con IA"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <input value={campos.asunto_email} onChange={(e) => setCampos({ ...campos, asunto_email: e.target.value })} placeholder="Asunto email" className="w-full text-sm rounded-md p-2" style={{ border: "1px solid #ddd" }} />
                      <textarea value={campos.mensaje_base_email} onChange={(e) => setCampos({ ...campos, mensaje_base_email: e.target.value })} placeholder="Mensaje base email" rows={4} className="w-full text-sm rounded-md p-2" style={{ border: "1px solid #ddd" }} />
                      <textarea value={campos.mensaje_base_whatsapp} onChange={(e) => setCampos({ ...campos, mensaje_base_whatsapp: e.target.value })} placeholder="Mensaje base WhatsApp" rows={3} className="w-full text-sm rounded-md p-2" style={{ border: "1px solid #ddd" }} />
                      <input value={campos.hooks} onChange={(e) => setCampos({ ...campos, hooks: e.target.value })} placeholder="Hooks separados por |" className="w-full text-sm rounded-md p-2" style={{ border: "1px solid #ddd" }} />
                      <div>{campos.hooks.split("|").map((h) => h.trim()).filter(Boolean).map((h, i) => <Chip key={i}>{h}</Chip>)}</div>

                      <div className="flex gap-2 flex-wrap items-center pt-1">
                        <button disabled={generando === seg.id} onClick={() => generar(seg)} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "#f1efe8", color: "#4a4740" }}>
                          {generando === seg.id ? "Regenerando..." : "Regenerar con IA"}
                        </button>
                        <button disabled={guardando === seg.id} onClick={() => guardarCambios(seg)} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: BRAND.navy }}>
                          {guardando === seg.id ? "Guardando..." : "Guardar cambios"}
                        </button>
                        <button onClick={() => aprobar(seg)} className="text-xs px-3 py-1.5 rounded-md text-white ml-auto" style={{ background: "#1f9e57" }}>
                          Aprobar y pasar a Envíos
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
