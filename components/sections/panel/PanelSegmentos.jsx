"use client";

import { useState, useEffect } from "react";
import { ChevronDown, RefreshCw, Check, Folder, FolderPlus, Trash2, Filter } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { MARCAS, segNombre } from "@/lib/panel/constants";
import { segmentosApi, gruposSegmentosApi } from "@/lib/panel/api";

// Colores suaves por marca para poder distinguir de un vistazo, ya que
// Segmentos muestra las dos marcas juntas (sin las pestañas
// "LiftyFive"/"Tu Equipo IA" de arriba, que quedaron reemplazadas por el
// filtro de marca de este panel).
const MARCA_ESTILO = {
  "LiftyFive": { bg: "#eaf2fd", border: "#a9cdf5", text: "#1c5fa8" },
  "Tu Equipo IA": { bg: "#eafbf1", border: "#a3e3c1", text: "#1f7a45" },
};
function estiloMarca(marca) {
  return MARCA_ESTILO[marca] || { bg: "#f3f1ea", border: "#e4dfd3", text: "#4a4740" };
}

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
// Además, esa misma selección se puede guardar con un nombre como "grupo de
// segmentos" persistente, que después aparece en la pestaña "Grupos".
function BarraAccionesSegmentos({
  cantidad, pendientesGenerar, listosAprobar, onGenerarGrupo, onAprobarGrupo, onCancelar, procesando,
  nombreGrupo, setNombreGrupo, onCrearGrupo, creandoGrupo,
}) {
  return (
    <div className="rounded-lg p-2.5 mb-3" style={{ background: "#eef3fb", border: "1px solid #cfe0f5" }}>
      <div className="flex items-center gap-2 flex-wrap">
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
      <div className="flex items-center gap-2 flex-wrap mt-2 pt-2" style={{ borderTop: "1px solid #cfe0f5" }}>
        <FolderPlus size={14} style={{ color: BRAND.navy, flexShrink: 0 }} />
        <input
          value={nombreGrupo}
          onChange={(e) => setNombreGrupo(e.target.value)}
          placeholder="Nombre para guardar esta selección como grupo..."
          className="text-sm rounded-md p-1.5 flex-1"
          style={{ border: "1px solid #ddd", minWidth: 220 }}
        />
        <button
          disabled={creandoGrupo || !nombreGrupo.trim()}
          onClick={onCrearGrupo}
          className="text-xs px-3 py-1.5 rounded-md text-white disabled:opacity-40"
          style={{ background: BRAND.navy }}
        >
          {creandoGrupo ? "Guardando..." : "Guardar como grupo"}
        </button>
      </div>
    </div>
  );
}

// Checklist de filtro genérico y reutilizable: buscador arriba + lista de
// checkboxes tildables abajo. Se usa para Segmentos, Industria y País — las
// tres funcionan igual (tildás varios, se muestran solo esos al aplicar).
function ChecklistFiltro({ opciones, seleccionados, toggle, buscar, setBuscar, placeholder }) {
  const visibles = opciones.filter((o) => o.toLowerCase().includes(buscar.trim().toLowerCase()));
  return (
    <div className="min-w-0">
      <input
        value={buscar}
        onChange={(e) => setBuscar(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm rounded-md p-1.5 mb-1.5"
        style={{ border: "1px solid #ddd" }}
      />
      <div className="max-h-40 overflow-y-auto rounded-md p-2" style={{ border: "1px solid #eee" }}>
        {!opciones.length ? (
          <p style={{ color: "#8a8578" }} className="text-xs">No hay datos todavía.</p>
        ) : visibles.length === 0 ? (
          <p style={{ color: "#8a8578" }} className="text-xs">Sin coincidencias.</p>
        ) : (
          visibles.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
              <input type="checkbox" checked={seleccionados.has(o)} onChange={() => toggle(o)} />
              <span className="truncate">{o}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

// Una sección desplegable del panel de filtros: encabezado angosto con
// nombre + resumen de lo tildado, se despliega hacia abajo al tocarlo. Es
// un acordeón (solo una sección abierta a la vez) para que el panel entero
// ocupe poco espacio.
function SeccionFiltro({ nombre, resumen, abierta, onToggle, children }) {
  return (
    <div style={{ borderBottom: "1px solid #eee" }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-2 py-2.5 text-left">
        <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>
          {nombre} <span className="text-xs font-normal" style={{ color: "#8a8578" }}>({resumen})</span>
        </span>
        <ChevronDown size={15} style={{ color: "#8a8578", flexShrink: 0, transform: abierta ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
      </button>
      {abierta && <div className="pb-3">{children}</div>}
    </div>
  );
}

// Panel de filtros: todo lo que se toca acá queda "pendiente" hasta que se
// aprieta "Aplicar filtros" — recién ahí se actualiza la lista de abajo.
// Para ocupar poco espacio, todo el panel vive detrás de un botón
// "Filtros" (colapsado por default) y, adentro, cada criterio (marca,
// industria, país, segmentos puntuales) es su propia sección desplegable
// — solo una abierta a la vez.
function PanelFiltros({
  mostrar, setMostrar,
  marcasPendiente, toggleMarcaPendiente,
  nombresUnicos, segNombresPendiente, toggleSegNombrePendiente,
  buscarChecklist, setBuscarChecklist,
  industriasUnicas, industriasPendiente, toggleIndustriaPendiente, buscarIndustria, setBuscarIndustria,
  paisesUnicos, paisesPendiente, togglePaisPendiente, buscarPais, setBuscarPais,
  estadoPendiente, setEstadoPendiente,
  onAplicar, onBorrar, hayFiltrosAplicados, cantidadFiltrosAplicados,
}) {
  const [seccion, setSeccion] = useState(null);
  const toggleSeccion = (s) => setSeccion((prev) => (prev === s ? null : s));

  const ESTADO_LABEL = { todos: "todos", sin_generar: "sin generar", generado: "generado" };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setMostrar(!mostrar)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-semibold"
          style={mostrar ? { background: BRAND.navy, color: "#fff" } : { border: "1px solid #ddd", color: BRAND.navy, background: "#fff" }}
        >
          <Filter size={14} />
          Filtros
          {cantidadFiltrosAplicados > 0 && (
            <span className="text-xs rounded-full px-1.5" style={{ background: mostrar ? "rgba(255,255,255,0.25)" : "#eaf3de", color: mostrar ? "#fff" : "#27500a" }}>
              {cantidadFiltrosAplicados}
            </span>
          )}
          <ChevronDown size={14} style={{ transform: mostrar ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
        </button>
        {hayFiltrosAplicados && (
          <button onClick={onBorrar} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "#f1efe8", color: "#4a4740" }}>
            Borrar filtros
          </button>
        )}
      </div>

      {mostrar && (
        <div className="rounded-xl p-4 mt-2" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex justify-end mb-1">
            <button onClick={onAplicar} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md text-white" style={{ background: "#1f9e57" }}>
              <Check size={13} />
              Aplicar filtros
            </button>
          </div>

          <SeccionFiltro
            nombre="Marca y estado"
            resumen={`${marcasPendiente.size} de ${MARCAS.length}, ${ESTADO_LABEL[estadoPendiente]}`}
            abierta={seccion === "marca"}
            onToggle={() => toggleSeccion("marca")}
          >
            <div className="flex flex-col gap-1.5 mb-3">
              {MARCAS.map((m) => {
                const est = estiloMarca(m);
                return (
                  <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={marcasPendiente.has(m)} onChange={() => toggleMarcaPendiente(m)} />
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: est.border }} />
                    {m}
                  </label>
                );
              })}
            </div>
            <select value={estadoPendiente} onChange={(e) => setEstadoPendiente(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
              <option value="todos">Todos</option>
              <option value="sin_generar">Sin generar</option>
              <option value="generado">Generado</option>
            </select>
          </SeccionFiltro>

          <SeccionFiltro
            nombre="Industria"
            resumen={industriasPendiente.size > 0 ? `${industriasPendiente.size} tildada${industriasPendiente.size === 1 ? "" : "s"}` : "todas"}
            abierta={seccion === "industria"}
            onToggle={() => toggleSeccion("industria")}
          >
            <ChecklistFiltro
              opciones={industriasUnicas}
              seleccionados={industriasPendiente}
              toggle={toggleIndustriaPendiente}
              buscar={buscarIndustria}
              setBuscar={setBuscarIndustria}
              placeholder="Buscar industria..."
            />
          </SeccionFiltro>

          <SeccionFiltro
            nombre="País"
            resumen={paisesPendiente.size > 0 ? `${paisesPendiente.size} tildado${paisesPendiente.size === 1 ? "" : "s"}` : "todos"}
            abierta={seccion === "pais"}
            onToggle={() => toggleSeccion("pais")}
          >
            <ChecklistFiltro
              opciones={paisesUnicos}
              seleccionados={paisesPendiente}
              toggle={togglePaisPendiente}
              buscar={buscarPais}
              setBuscar={setBuscarPais}
              placeholder="Buscar país..."
            />
          </SeccionFiltro>

          <SeccionFiltro
            nombre="Segmentos"
            resumen={segNombresPendiente.size > 0 ? `${segNombresPendiente.size} tildado${segNombresPendiente.size === 1 ? "" : "s"}` : "todos"}
            abierta={seccion === "segmentos"}
            onToggle={() => toggleSeccion("segmentos")}
          >
            <ChecklistFiltro
              opciones={nombresUnicos}
              seleccionados={segNombresPendiente}
              toggle={toggleSegNombrePendiente}
              buscar={buscarChecklist}
              setBuscar={setBuscarChecklist}
              placeholder="Buscar segmento..."
            />
          </SeccionFiltro>
        </div>
      )}
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
// Segmentos ya no usa las pestañas de marca de arriba (esas se ocultan
// para esta sección): todo queda centralizado acá, con los segmentos de
// las dos marcas mezclados y diferenciados por color (LiftyFive en azul,
// Tu Equipo IA en verde), más un panel de filtros (marca, estado y una
// lista tildable de segmentos puntuales) que se aplica con un botón y se
// puede limpiar con "Borrar filtros". También se puede refrescar a mano
// con "Actualizar", y seleccionar varios segmentos con checkbox para
// generar y/o aprobar ese grupo de una sola vez — o guardarlos como un
// "grupo de segmentos" con nombre propio, visible en la pestaña "Grupos",
// desde donde también se puede generar con IA en bloque.
export default function PanelSegmentos({ segmentos, contactos, recargar, showToast }) {
  const [vista, setVista] = useState("segmentos"); // "segmentos" | "grupos"

  const [abierto, setAbierto] = useState(null);
  const [generando, setGenerando] = useState(null);
  const [guardando, setGuardando] = useState(null);
  const [campos, setCampos] = useState({ asunto_email: "", mensaje_base_email: "", mensaje_base_whatsapp: "", hooks: "" });
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [procesandoGrupo, setProcesandoGrupo] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [buscarChecklist, setBuscarChecklist] = useState("");
  const [buscarIndustria, setBuscarIndustria] = useState("");
  const [buscarPais, setBuscarPais] = useState("");

  const [marcasPendiente, setMarcasPendiente] = useState(new Set(MARCAS));
  const [marcasAplicado, setMarcasAplicado] = useState(new Set(MARCAS));
  const [segNombresPendiente, setSegNombresPendiente] = useState(new Set());
  const [segNombresAplicado, setSegNombresAplicado] = useState(new Set());
  const [industriasPendiente, setIndustriasPendiente] = useState(new Set());
  const [industriasAplicado, setIndustriasAplicado] = useState(new Set());
  const [paisesPendiente, setPaisesPendiente] = useState(new Set());
  const [paisesAplicado, setPaisesAplicado] = useState(new Set());
  const [estadoPendiente, setEstadoPendiente] = useState("todos");
  const [estadoAplicado, setEstadoAplicado] = useState("todos");

  // Grupos de segmentos: colecciones con nombre, guardadas en la tabla
  // grupos_segmentos, para agrupar segmentos ya filtrados/seleccionados y
  // poder volver a generarlos con IA en bloque más tarde.
  const [grupos, setGrupos] = useState([]);
  const [cargandoGrupos, setCargandoGrupos] = useState(false);
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const [grupoAbierto, setGrupoAbierto] = useState(null);
  const [procesandoGrupoId, setProcesandoGrupoId] = useState(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null);

  const cargarGrupos = async () => {
    setCargandoGrupos(true);
    try {
      const data = await gruposSegmentosApi.list();
      setGrupos(data);
    } catch (e) {
      showToast("Error al cargar grupos: " + e.message);
    }
    setCargandoGrupos(false);
  };

  useEffect(() => {
    cargarGrupos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Un segmento sin contactos no sirve para nada acá (no hay a quién
  // mandarle el mensaje), así que no tiene sentido que aparezca en la
  // lista principal ni en los filtros.
  const base = segmentos.filter((s) => !s.aprobado && contactos.some((c) => c.segmento_id === s.id));

  const nombresUnicos = Array.from(new Set(base.map((s) => segNombre(s)))).sort((a, b) => a.localeCompare(b));
  const industriasUnicas = Array.from(new Set(base.map((s) => s.industria).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  // El país no es un campo del segmento en sí (eso es industria + puesto +
  // marca): sale de los contactos que tiene adentro, así que un segmento
  // pasa el filtro de país si tiene al menos un contacto en alguno de los
  // países tildados.
  const paisesUnicos = Array.from(
    new Set(contactos.filter((c) => base.some((s) => s.id === c.segmento_id)).map((c) => c.pais).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const visibles = base
    .filter((s) => marcasAplicado.has(s.marca_origen))
    .filter((s) => segNombresAplicado.size === 0 || segNombresAplicado.has(segNombre(s)))
    .filter((s) => industriasAplicado.size === 0 || industriasAplicado.has(s.industria))
    .filter((s) => paisesAplicado.size === 0 || contactos.some((c) => c.segmento_id === s.id && paisesAplicado.has(c.pais)))
    .filter((s) => {
      if (estadoAplicado === "sin_generar") return !s.mensaje_base_email;
      if (estadoAplicado === "generado") return !!s.mensaje_base_email;
      return true;
    });

  const hayFiltrosAplicados = marcasAplicado.size < MARCAS.length || segNombresAplicado.size > 0 || industriasAplicado.size > 0 || paisesAplicado.size > 0 || estadoAplicado !== "todos";
  const cantidadFiltrosAplicados =
    (marcasAplicado.size < MARCAS.length ? 1 : 0) +
    (industriasAplicado.size > 0 ? 1 : 0) +
    (paisesAplicado.size > 0 ? 1 : 0) +
    (segNombresAplicado.size > 0 ? 1 : 0) +
    (estadoAplicado !== "todos" ? 1 : 0);

  const toggleMarcaPendiente = (m) => {
    setMarcasPendiente((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  };

  const toggleSegNombrePendiente = (nombre) => {
    setSegNombresPendiente((prev) => {
      const next = new Set(prev);
      if (next.has(nombre)) next.delete(nombre); else next.add(nombre);
      return next;
    });
  };

  const toggleIndustriaPendiente = (industria) => {
    setIndustriasPendiente((prev) => {
      const next = new Set(prev);
      if (next.has(industria)) next.delete(industria); else next.add(industria);
      return next;
    });
  };

  const togglePaisPendiente = (pais) => {
    setPaisesPendiente((prev) => {
      const next = new Set(prev);
      if (next.has(pais)) next.delete(pais); else next.add(pais);
      return next;
    });
  };

  const aplicarFiltros = () => {
    setMarcasAplicado(new Set(marcasPendiente));
    setSegNombresAplicado(new Set(segNombresPendiente));
    setIndustriasAplicado(new Set(industriasPendiente));
    setPaisesAplicado(new Set(paisesPendiente));
    setEstadoAplicado(estadoPendiente);
    limpiarSeleccion();
  };

  const borrarFiltros = () => {
    setMarcasPendiente(new Set(MARCAS));
    setMarcasAplicado(new Set(MARCAS));
    setSegNombresPendiente(new Set());
    setSegNombresAplicado(new Set());
    setIndustriasPendiente(new Set());
    setIndustriasAplicado(new Set());
    setPaisesPendiente(new Set());
    setPaisesAplicado(new Set());
    setEstadoPendiente("todos");
    setEstadoAplicado("todos");
    setBuscarChecklist("");
    setBuscarIndustria("");
    setBuscarPais("");
    limpiarSeleccion();
  };

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
    cargarGrupos();
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

  const crearGrupo = async () => {
    if (!nombreGrupo.trim() || !seleccionados.size) return;
    setCreandoGrupo(true);
    try {
      await gruposSegmentosApi.create(nombreGrupo.trim(), Array.from(seleccionados));
      showToast("Grupo creado");
      setNombreGrupo("");
      limpiarSeleccion();
      await cargarGrupos();
      setVista("grupos");
    } catch (e) {
      showToast("Error al crear grupo: " + e.message);
    }
    setCreandoGrupo(false);
  };

  const eliminarGrupo = async (id) => {
    try {
      await gruposSegmentosApi.remove(id);
      showToast("Grupo eliminado");
      setGrupoAbierto((prev) => (prev === id ? null : prev));
      setConfirmandoEliminar(null);
      await cargarGrupos();
    } catch (e) {
      showToast("Error al eliminar: " + e.message);
    }
  };

  const miembrosDe = (grupo) => {
    const ids = new Set(grupo.segmento_ids || []);
    return segmentos.filter((s) => ids.has(s.id));
  };

  const generarMiembrosGrupo = async (grupo) => {
    const pendientes = miembrosDe(grupo).filter((s) => !s.aprobado && !s.mensaje_base_email);
    if (!pendientes.length) return;
    setProcesandoGrupoId(grupo.id);
    let ok = 0, fallidos = 0;
    for (const seg of pendientes) {
      try {
        await segmentosApi.generar(seg.id);
        ok++;
      } catch {
        fallidos++;
      }
    }
    showToast(`${ok} mensaje${ok === 1 ? "" : "s"} generado${ok === 1 ? "" : "s"}${fallidos ? `, ${fallidos} con error` : ""}`);
    recargar();
    setProcesandoGrupoId(null);
  };

  const aprobarMiembrosGrupo = async (grupo) => {
    const listos = miembrosDe(grupo).filter((s) => !s.aprobado && !!s.mensaje_base_email);
    if (!listos.length) return;
    setProcesandoGrupoId(grupo.id);
    let ok = 0, fallidos = 0;
    for (const seg of listos) {
      try {
        await segmentosApi.update(seg.id, { aprobado: true });
        ok++;
      } catch {
        fallidos++;
      }
    }
    showToast(`${ok} aprobado${ok === 1 ? "" : "s"} — pasaron a Envíos${fallidos ? `, ${fallidos} con error` : ""}`);
    recargar();
    setProcesandoGrupoId(null);
  };

  // Tarjeta de un segmento individual: se reutiliza tanto en la lista
  // principal (con checkbox de selección) como dentro de un grupo abierto
  // (sin checkbox, ya que ahí las acciones en lote son por grupo entero).
  const renderTarjeta = (seg, { mostrarCheckbox = true } = {}) => {
    const enSegmento = contactos.filter((c) => c.segmento_id === seg.id);
    const abiertoEste = abierto === seg.id;
    const marcado = seleccionados.has(seg.id);
    const est = estiloMarca(seg.marca_origen);
    return (
      <div
        key={seg.id}
        className="rounded-xl overflow-hidden"
        style={{ background: "#ffffff", border: marcado ? `1px solid ${BRAND.navy}` : "1px solid #e4dfd3", borderLeft: `4px solid ${est.border}` }}
      >
        <div className="w-full flex items-center justify-between flex-wrap gap-2 p-4" style={{ background: abiertoEste ? "#faf9f6" : marcado ? "#f5f9ff" : "transparent" }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {mostrarCheckbox && (
              <input
                type="checkbox"
                checked={marcado}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleSeleccion(seg.id)}
              />
            )}
            <button onClick={() => toggleAbierto(seg)} className="flex-1 min-w-0 text-left">
              <strong style={{ color: BRAND.navy }}>{segNombre(seg)}</strong>{" "}
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: est.bg, color: est.text }}>{seg.marca_origen}</span>{" "}
              <span style={{ color: "#8a8578" }} className="text-xs">{enSegmento.length} contacto(s)</span>{" "}
              {seg.aprobado && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1" style={{ background: "#eaf3de", color: "#27500a" }}>Ya en Envíos</span>
              )}
              {!seg.aprobado && !seg.mensaje_base_email && (
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

                {!seg.aprobado && (
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
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
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
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">Todas las marcas juntas, diferenciadas por color. Generá el mensaje con IA, revisalo y aprobalo — al aprobarlo pasa a "Envíos", listo para mandar. Seleccioná varios y guardalos como grupo para volver a generarlos juntos desde "Grupos".</p>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setVista("segmentos")}
          className="text-sm px-3 py-1.5 rounded-md font-semibold"
          style={vista === "segmentos" ? { background: BRAND.navy, color: "#fff" } : { background: "#f1efe8", color: "#4a4740" }}
        >
          Segmentos
        </button>
        <button
          onClick={() => setVista("grupos")}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-semibold"
          style={vista === "grupos" ? { background: BRAND.navy, color: "#fff" } : { background: "#f1efe8", color: "#4a4740" }}
        >
          <Folder size={14} />
          Grupos{grupos.length > 0 ? ` (${grupos.length})` : ""}
        </button>
      </div>

      {vista === "segmentos" && (
        <>
          <PanelFiltros
            mostrar={mostrarFiltros}
            setMostrar={setMostrarFiltros}
            marcasPendiente={marcasPendiente}
            toggleMarcaPendiente={toggleMarcaPendiente}
            nombresUnicos={nombresUnicos}
            segNombresPendiente={segNombresPendiente}
            toggleSegNombrePendiente={toggleSegNombrePendiente}
            buscarChecklist={buscarChecklist}
            setBuscarChecklist={setBuscarChecklist}
            industriasUnicas={industriasUnicas}
            industriasPendiente={industriasPendiente}
            toggleIndustriaPendiente={toggleIndustriaPendiente}
            buscarIndustria={buscarIndustria}
            setBuscarIndustria={setBuscarIndustria}
            paisesUnicos={paisesUnicos}
            paisesPendiente={paisesPendiente}
            togglePaisPendiente={togglePaisPendiente}
            buscarPais={buscarPais}
            setBuscarPais={setBuscarPais}
            estadoPendiente={estadoPendiente}
            setEstadoPendiente={setEstadoPendiente}
            onAplicar={aplicarFiltros}
            onBorrar={borrarFiltros}
            hayFiltrosAplicados={hayFiltrosAplicados}
            cantidadFiltrosAplicados={cantidadFiltrosAplicados}
          />

          {seleccionados.size > 0 && (
            <BarraAccionesSegmentos
              cantidad={seleccionados.size}
              pendientesGenerar={pendientesGenerar.length}
              listosAprobar={listosAprobar.length}
              onGenerarGrupo={generarGrupo}
              onAprobarGrupo={aprobarGrupo}
              onCancelar={limpiarSeleccion}
              procesando={procesandoGrupo}
              nombreGrupo={nombreGrupo}
              setNombreGrupo={setNombreGrupo}
              onCrearGrupo={crearGrupo}
              creandoGrupo={creandoGrupo}
            />
          )}

          {!base.length ? (
            <p style={{ color: "#8a8578" }} className="text-sm">
              No hay segmentos en borrador con contactos. Se crean solos al cargar contactos por CSV o a mano en "Contactos", y los que ya aprobaste están en "Envíos".
            </p>
          ) : !visibles.length ? (
            <p style={{ color: "#8a8578" }} className="text-sm">Ningún segmento coincide con esos filtros.</p>
          ) : (
            <div className="space-y-3">
              {visibles.map((seg) => renderTarjeta(seg))}
            </div>
          )}
        </>
      )}

      {vista === "grupos" && (
        <div>
          {cargandoGrupos ? (
            <p style={{ color: "#8a8578" }} className="text-sm">Cargando grupos...</p>
          ) : !grupos.length ? (
            <p style={{ color: "#8a8578" }} className="text-sm">
              Todavía no creaste ningún grupo. En la pestaña "Segmentos", seleccioná varios con el checkbox y guardalos con un nombre desde la barra que aparece abajo.
            </p>
          ) : (
            <div className="space-y-3">
              {grupos.map((grupo) => {
                const miembros = miembrosDe(grupo);
                const pendientes = miembros.filter((s) => !s.aprobado && !s.mensaje_base_email);
                const listos = miembros.filter((s) => !s.aprobado && !!s.mensaje_base_email);
                const abiertoEste = grupoAbierto === grupo.id;
                const procesandoEste = procesandoGrupoId === grupo.id;
                return (
                  <div key={grupo.id} className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                    <div className="w-full flex items-center justify-between flex-wrap gap-2 p-4" style={{ background: abiertoEste ? "#faf9f6" : "transparent" }}>
                      <button onClick={() => setGrupoAbierto(abiertoEste ? null : grupo.id)} className="flex-1 min-w-0 text-left flex items-center gap-2">
                        <Folder size={15} style={{ color: BRAND.navy, flexShrink: 0 }} />
                        <strong style={{ color: BRAND.navy }}>{grupo.nombre}</strong>{" "}
                        <span style={{ color: "#8a8578" }} className="text-xs">{miembros.length} segmento{miembros.length === 1 ? "" : "s"}</span>
                      </button>
                      <div className="flex items-center gap-2">
                        {confirmandoEliminar === grupo.id ? (
                          <>
                            <span className="text-xs" style={{ color: "#8a8578" }}>¿Eliminar grupo?</span>
                            <button onClick={() => eliminarGrupo(grupo.id)} className="text-xs px-2.5 py-1 rounded-md text-white" style={{ background: "#c2483d" }}>Sí, eliminar</button>
                            <button onClick={() => setConfirmandoEliminar(null)} className="text-xs px-2.5 py-1 rounded-md" style={{ background: "#f1efe8", color: "#4a4740" }}>Cancelar</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmandoEliminar(grupo.id)} title="Eliminar grupo" className="p-1.5 rounded-md" style={{ color: "#8a8578" }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                        <button onClick={() => setGrupoAbierto(abiertoEste ? null : grupo.id)}>
                          <ChevronDown size={16} style={{ color: "#8a8578", transform: abiertoEste ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
                        </button>
                      </div>
                    </div>

                    {abiertoEste && (
                      <div className="px-4 pb-4">
                        {!miembros.length ? (
                          <p style={{ color: "#8a8578" }} className="text-sm">Los segmentos de este grupo ya no existen.</p>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-wrap mb-3">
                              <button
                                disabled={procesandoEste || !pendientes.length}
                                onClick={() => generarMiembrosGrupo(grupo)}
                                className="text-xs px-3 py-1.5 rounded-md text-white disabled:opacity-40"
                                style={{ background: BRAND.navy }}
                              >
                                {procesandoEste ? "Procesando..." : `✨ Generar con IA (${pendientes.length} sin generar)`}
                              </button>
                              <button
                                disabled={procesandoEste || !listos.length}
                                onClick={() => aprobarMiembrosGrupo(grupo)}
                                className="text-xs px-3 py-1.5 rounded-md text-white disabled:opacity-40"
                                style={{ background: "#1f9e57" }}
                              >
                                {procesandoEste ? "Procesando..." : `✅ Aprobar y pasar a Envíos (${listos.length} listos)`}
                              </button>
                            </div>
                            <div className="space-y-3">
                              {miembros.map((seg) => renderTarjeta(seg, { mostrarCheckbox: false }))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
