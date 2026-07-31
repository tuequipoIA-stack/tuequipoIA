"use client";

import { useEffect, useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
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

// Barra de acciones en lote: aparece cuando hay segmentos seleccionados con
// checkbox (después de filtrar). Deja generar con IA los que falten y/o
// aprobar de una los que ya tienen mensaje, todo sobre el grupo elegido.
function BarraAccionesSegmentos({ cantidad, pendientesGenerar, listosAprobar, onGenerarGrupo, onAprobarGrupo, onCancelar, procesando }) {
  return (
    <div className="flex items-center gap-2 flex-wrap rounded-lg p-2.5 mb-3" style={{ background: "#eef3fb", border: "1px solid #cfe0f5" }}>
      <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>{cantidad} seleccionado{cantidad === 1 ? "" : "s"}</span>
      <button
        disabled={procesando || !pendientesGenerar}
        onClick={onGenerarGrupo}
        className="text-xs px-3 py-1.5 rounded-md text-white disabled:opacity-40"
        style={{ background: BRAND.navy }}
      >
        {procesando ? "Procesando..." : `✨ Generar con IA (${pendientesGenerar} sin generar)`}
      </button>
      <button
        disabled={procesando || !listosAprobar}
        onClick={onAprobarGrupo}
        className="text-xs px-3 py-1.5 rounded-md text-white disabled:opacity-40"
        style={{ background: "#1f9e57" }}
      >
        {procesando ? "Procesando..." : `✅ Aprobar y pasar a Envíos (${listosAprobar} listos)`}
      </button>
      <button onClick={onCancelar} className="text-xs px-3 py-1.5 rounded-md ml-auto" style={{ background: "#f1efe8", color: "#4a4740" }}>
        Cancelar selección
      </button>
    </div>
  );
}

// Cada segmento es un acordeón: colapsado por default, se despliega hacia
// abajo al tocar su encabezado o cualquiera de sus botones (generar,
// regenerar, aprobar). Ya no hay un modo "Editar" separado: si hay mensaje
// generado, sus campos se muestran directamente editables — lo que se
// escribe ahí se guarda con "Guardar cambios". Al aprobar, el segmento
// desaparece de esta lista y pasa a la sección "Envíos" para mandarlo.
//
// Además de la lista, se puede: buscar por puesto/industria, filtrar por
// estado (sin generar / generado), refrescar a mano con "Actualizar", y
// seleccionar varios segmentos con checkbox para generar y/o aprobar ese
// grupo de una sola vez.
export default function PanelSegmentos({ segmentos, contactos, marcaFiltro, recargar, showToast }) {
  const [abierto, setAbierto] = useState(null);
  const [generando, setGenerando] = useState(null);
  const [guardando, setGuardando] = useState(null);
  const [campos, setCampos] = useState({ asunto_email: "", mensaje_base_email: "", mensaje_base_whatsapp: "", hooks: "" });
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // todos | sin_generar | generado
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [procesandoGrupo, setProcesandoGrupo] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  // Al cambiar de marca se limpia la selección: evita aprobar/generar por
  // error algo que ya no está a la vista.
  useEffect(() => { setSeleccionados(new Set()); }, [marcaFiltro]);

  const base = (marcaFiltro === "todas" ? segmentos : segmentos.filter((s) => s.marca_origen === marcaFiltro)).filter((s) => !s.aprobado);

  const visibles = base
    .filter((s) => {
      if (filtroEstado === "sin_generar") return !s.mensaje_base_email;
      if (filtroEstado === "generado") return !!s.mensaje_base_email;
      return true;
    })
    .filter((s) => {
      const q = busqueda.trim().toLowerCase();
      if (!q) return true;
      return (s.puesto || "").toLowerCase().includes(q) || (s.industria || "").toLowerCase().includes(q);
    });

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

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const limpiarSeleccion = () => setSeleccionados(new Set());

  const actualizar = () => {
    setActualizando(true);
    recargar();
    setTimeout(() => setActualizando(false), 500);
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
      setSeleccionados((prev) => {
        if (!prev.has(seg.id)) return prev;
        const next = new Set(prev);
        next.delete(seg.id);
        return next;
      });
      recargar();
    } catch (e) {
      showToast("Error al aprobar: " + e.message);
    }
  };

  const seleccionadosArr = visibles.filter((s) => seleccionados.has(s.id));
  const pendientesGenerar = seleccionadosArr.filter((s) => !s.mensaje_base_email);
  const listosAprobar = seleccionadosArr.filter((s) => !!s.mensaje_base_email);

  const generarGrupo = async () => {
    if (!pendientesGenerar.length) return;
    setProcesandoGrupo(true);
    let ok = 0, fallidos = 0;
    for (const seg of pendientesGenerar) {
      try {
        await segmentosApi.generar(seg.id);
        ok++;
      } catch {
        fallidos++;
      }
    }
    showToast(`${ok} mensaje${ok === 1 ? "" : "s"} generado${ok === 1 ? "" : "s"}${fallidos ? `, ${fallidos} con error` : ""}`);
    recargar();
    setProcesandoGrupo(false);
  };

  const aprobarGrupo = async () => {
    if (!listosAprobar.length) return;
    setProcesandoGrupo(true);
    let ok = 0, fallidos = 0;
    for (const seg of listosAprobar) {
      try {
        await segmentosApi.update(seg.id, { aprobado: true });
        ok++;
      } catch {
        fallidos++;
      }
    }
    showToast(`${ok} aprobado${ok === 1 ? "" : "s"} — pasaron a Envíos${fallidos ? `, ${fallidos} con error` : ""}`);
    limpiarSeleccion();
    recargar();
    setProcesandoGrupo(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold">Segmentos</h2>
        <button
          disabled={actualizando}
          onClick={actualizar}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md"
          style={{ border: `1px solid ${BRAND.navy}`, color: BRAND.navy, background: "#ffffff" }}
        >
          <RefreshCw size={13} className={actualizando ? "animate-spin" : undefined} />
          Actualizar
        </button>
      </div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">Cada segmento cruza industria × puesto × marca. Generá el mensaje con IA, revisalo y aprobalo — al aprobarlo pasa a "Envíos", listo para mandar.</p>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por puesto o industria"
          className="text-sm rounded-md p-1.5"
          style={{ border: "1px solid #ddd" }}
        />
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
          <option value="todos">Todos los estados</option>
          <option value="sin_generar">Sin generar</option>
          <option value="generado">Generado</option>
        </select>
      </div>

      {seleccionados.size > 0 && (
        <BarraAccionesSegmentos
          cantidad={seleccionados.size}
          pendientesGenerar={pendientesGenerar.length}
          listosAprobar={listosAprobar.length}
          onGenerarGrupo={generarGrupo}
          onAprobarGrupo={aprobarGrupo}
          onCancelar={limpiarSeleccion}
          procesando={procesandoGrupo}
        />
      )}

      {!base.length ? (
        <p style={{ color: "#8a8578" }} className="text-sm">
          No hay segmentos en borrador. Se crean solos al cargar contactos por CSV o a mano en "Contactos", y los que ya aprobaste están en "Envíos".
        </p>
      ) : !visibles.length ? (
        <p style={{ color: "#8a8578" }} className="text-sm">Ningún segmento coincide con ese filtro.</p>
      ) : (
        <div className="space-y-3">
          {visibles.map((seg) => {
            const enSegmento = contactos.filter((c) => c.segmento_id === seg.id);
            const abiertoEste = abierto === seg.id;
            const marcado = seleccionados.has(seg.id);
            return (
              <div key={seg.id} className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: marcado ? `1px solid ${BRAND.navy}` : "1px solid #e4dfd3" }}>
                <div className="w-full flex items-center justify-between flex-wrap gap-2 p-4" style={{ background: abiertoEste ? "#faf9f6" : marcado ? "#f5f9ff" : "transparent" }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSeleccion(seg.id)}
                    />
                    <button onClick={() => toggleAbierto(seg)} className="flex-1 min-w-0 text-left">
                      <strong style={{ color: BRAND.navy }}>{segNombre(seg)}</strong>{" "}
                      <span style={{ color: "#8a8578" }} className="text-xs">{seg.marca_origen} · {enSegmento.length} contacto(s)</span>{" "}
                      {!seg.mensaje_base_email && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1" style={{ background: "#faeeda", color: "#854f0b" }}>Sin generar</span>
                      )}
                    </button>
                  </div>
                  <button onClick={() => toggleAbierto(seg)}>
                    <ChevronDown size={16} style={{ color: "#8a8578", transform: abiertoEste ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
                  </button>
                </div>

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
      )}
    </div>
  );
}
