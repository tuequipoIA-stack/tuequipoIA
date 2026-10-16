"use client";

import { useEffect, useRef, useState } from "react";
import { Target, Check } from "lucide-react";
import { COLUMNAS_BASE, MAX_COLUMNAS_EXTRA } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid, migrarColumna } from "@/lib/helpers";
import { hoyISO } from "@/lib/fechas";
import { C } from "@/lib/theme";
import { useEmpresas } from "@/lib/empresas";
import { FiltroEmpresas, SelectEmpresa, EmpresasModal } from "@/components/empresas/EmpresasUI";
import AudioModal from "@/components/audio/AudioModal";
import { interpretarOrganizacion } from "@/lib/audio/organizacion";
import TableroBoard from "@/components/organizacion/TableroBoard";
import GrandesObjetivos from "@/components/organizacion/GrandesObjetivos";
import TareasAcumuladas, { filtrarPeriodo } from "@/components/organizacion/TareasAcumuladas";
import { conColumna, separarArchivables, aAcumulada, pasaFiltro, MINI, MINI_CLS } from "@/components/organizacion/comun";

const NAVY = "#1A1A2E";
const CREAM = "#F4F1EC";

const SUBTITULOS = {
  bajados: "Arrastrá las tarjetas entre columnas. Las tareas hechas pasan solas a 'Tareas acumuladas' a los 3 días.",
  grandes: "Definí tus grandes objetivos y desglosalos en tareas concretas.",
  acumuladas: "Todo lo que fuiste realizando, por empresa. Filtrá por período y exportá para analizar.",
};

const AUDIO_EJEMPLO =
  "Hoy tengo que mandarle el reporte de octubre a Farmacias Económicas. Para GproSoft, esta semana armar el cronograma de implementación de Delpack y llamar a Blue Sky por la app de pedidos. Y para Tu Equipo IA grabar el reel del caso de viandas.";

export default function TableroSection() {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const empresasApi = useEmpresas();
  const { empresas, porId } = empresasApi;

  const [tab, setTab] = useState("bajados"); // "bajados" | "grandes" | "acumuladas"
  const [filtro, setFiltro] = useState("todas"); // "todas" | "sin" | id de empresa
  const [modalEmpresas, setModalEmpresas] = useState(false);
  const [modalAudio, setModalAudio] = useState(false);
  const [recien, setRecien] = useState(() => new Set());

  // --- Tablero ---
  const [columnas, setColumnas] = useState(COLUMNAS_BASE);
  const [tareas, setTareas] = useState([]);
  const [acumuladas, setAcumuladas] = useState([]);
  // Plantillas de "tareas diarias" que salen del Plan de negocio (Estrategia).
  // Cada día que se abre Organización, las activas se recrean solas en "hoy".
  const [plantillasDiarias, setPlantillasDiarias] = useState([]);
  const tareasRef = useRef([]);
  const acumuladasRef = useRef([]);

  // --- Grandes objetivos ---
  const [objetivos, setObjetivos] = useState([]);

  // --- Acumuladas ---
  const [periodo, setPeriodo] = useState("30");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (!unidadId) return;
    loadData("tablero-columnas", COLUMNAS_BASE).then(setColumnas);
    Promise.all([
      loadData("tablero-tareas", []),
      loadData("tareas-diarias-plan", []),
      loadData("tareas-acumuladas", []),
    ]).then(async ([d, diarias, acu]) => {
      const lista = Array.isArray(d) ? d : [];
      const acuPrev = Array.isArray(acu) ? acu : [];
      const hoy = hoyISO();
      let cambio = false;

      const migradas = lista.map((t) => {
        const columna = migrarColumna(t.columna);
        let n = t;
        if (columna !== t.columna) { n = { ...n, columna }; cambio = true; }
        // Hechas de antes (sin fecha): cuentan desde hoy, así no se archivan de golpe
        if (columna === "hecho" && !n.hechoEn) { n = { ...n, hechoEn: hoy }; cambio = true; }
        return n;
      });

      // Por cada plantilla diaria activa, si todavía no tiene una tarjeta
      // creada para HOY, la creamos en la columna "Tareas de hoy".
      const nuevas = (diarias || [])
        .filter((p) => p.activa && !migradas.some((t) => t.recurrenteId === p.id && t.fecha === hoy))
        .map((p) => ({ id: uid(), texto: p.texto, columna: "hoy", origen: "plan-diario", recurrenteId: p.id, fecha: hoy }));
      if (nuevas.length) cambio = true;

      const { quedan, pasan } = separarArchivables([...migradas, ...nuevas]);
      const acuFinal = pasan.length ? [...acuPrev, ...pasan.map(aAcumulada)] : acuPrev;

      tareasRef.current = quedan;
      acumuladasRef.current = acuFinal;
      setTareas(quedan);
      setAcumuladas(acuFinal);
      setPlantillasDiarias(diarias || []);

      // Primero guardamos las acumuladas, después sacamos las tareas del tablero
      if (pasan.length) await saveData("tareas-acumuladas", acuFinal);
      if (cambio || pasan.length) await saveData("tablero-tareas", quedan);
    });
    loadData("grandes-objetivos", []).then((o) => setObjetivos(Array.isArray(o) ? o : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidadId]);

  // Guarda el tablero; de paso pasa a "acumuladas" las que ya cumplieron los 3 días.
  const guardarTareas = async (lista) => {
    const { quedan, pasan } = separarArchivables(lista);
    tareasRef.current = quedan;
    setTareas(quedan);
    if (pasan.length) {
      const acu = [...acumuladasRef.current, ...pasan.map(aAcumulada)];
      acumuladasRef.current = acu;
      setAcumuladas(acu);
      await saveData("tareas-acumuladas", acu);
    }
    await saveData("tablero-tareas", quedan);
  };

  const guardarObjetivos = async (lista) => {
    setObjetivos(lista);
    await saveData("grandes-objetivos", lista);
  };

  const flashear = (ids) => {
    setRecien(new Set(ids));
    setTimeout(() => setRecien(new Set()), 1800);
  };

  // --- Filtro de empresa ---
  const filtroEf = filtro !== "todas" && filtro !== "sin" && !porId(filtro) ? "todas" : filtro;
  const empresaDefault = filtroEf !== "todas" && filtroEf !== "sin" ? filtroEf : null;
  const visibles = (l) => l.filter((x) => pasaFiltro(x, filtroEf, porId));

  const acumuladasPeriodo = filtrarPeriodo(acumuladas, periodo, busqueda);
  const listaConteo = tab === "bajados" ? tareas : tab === "grandes" ? objetivos : acumuladasPeriodo;
  const conteo = (f) => (f === "todas" ? listaConteo.length : listaConteo.filter((x) => pasaFiltro(x, f, porId)).length);

  const usos = (id) => {
    const n = tareas.filter((t) => t.empresa === id).length;
    const o = objetivos.filter((x) => x.empresa === id).length;
    return `${n} ${n === 1 ? "tarea" : "tareas"}${o ? ` · ${o} ${o === 1 ? "objetivo" : "objetivos"}` : ""}`;
  };

  // --- Tablero: acciones ---
  const agregarTarea = (texto, empresa) =>
    guardarTareas([...tareasRef.current, { id: uid(), texto, columna: "semana", empresa: empresa || null }]);

  const moverTarea = (id, columna) =>
    guardarTareas(tareasRef.current.map((t) => (t.id === id && t.columna !== columna ? conColumna(t, columna) : t)));

  const cambiarEmpresaTarea = (id, empresa) =>
    guardarTareas(tareasRef.current.map((t) => (t.id === id ? { ...t, empresa: empresa || null } : t)));

  const eliminarTarea = (id) => guardarTareas(tareasRef.current.filter((t) => t.id !== id));

  // Saca del todo una tarea "diaria" del plan: desactiva la plantilla (no se
  // vuelve a recrear mañana) y borra la tarjeta de hoy. A diferencia de
  // eliminarTarea (que solo saca la tarjeta de hoy y vuelve a aparecer mañana).
  const eliminarTareaDefinitiva = async (tarea) => {
    const plantillas = plantillasDiarias.map((p) => (p.id === tarea.recurrenteId ? { ...p, activa: false } : p));
    setPlantillasDiarias(plantillas);
    await saveData("tareas-diarias-plan", plantillas);
    await eliminarTarea(tarea.id);
  };

  const agregarColumna = async (nombre) => {
    if (columnas.filter((c) => !c.fija).length >= MAX_COLUMNAS_EXTRA) return;
    const actualizado = [...columnas, { id: uid(), nombre, fija: false }];
    setColumnas(actualizado);
    await saveData("tablero-columnas", actualizado);
  };

  const eliminarColumna = async (id) => {
    const actualizado = columnas.filter((c) => c.id !== id);
    setColumnas(actualizado);
    await saveData("tablero-columnas", actualizado);
    // las tareas de esa columna vuelven a "semana" para no perderlas
    await guardarTareas(tareasRef.current.map((t) => (t.columna === id ? conColumna(t, "semana") : t)));
  };

  // --- Grandes objetivos: acciones ---
  const crearObjetivo = async ({ titulo, mes, empresa }) => {
    const o = { id: uid(), titulo, mes, empresa, tareas: [] };
    await guardarObjetivos([...objetivos, o]);
    return o;
  };
  const eliminarObjetivo = (id) => guardarObjetivos(objetivos.filter((o) => o.id !== id));
  const actualizarObjetivo = (id, cambios) => guardarObjetivos(objetivos.map((o) => (o.id === id ? { ...o, ...cambios } : o)));
  const agregarTareaObjetivo = (objetivoId, { texto, fecha }) =>
    guardarObjetivos(objetivos.map((o) => (o.id === objetivoId ? { ...o, tareas: [...(o.tareas || []), { id: uid(), texto, fecha }] } : o)));
  const eliminarTareaObjetivo = (objetivoId, tareaId) =>
    guardarObjetivos(objetivos.map((o) => (o.id === objetivoId ? { ...o, tareas: (o.tareas || []).filter((t) => t.id !== tareaId) } : o)));
  const transcribirATareaSemana = (tareaObj, empresa) =>
    guardarTareas([...tareasRef.current, { id: uid(), texto: tareaObj.texto, columna: "semana", empresa: empresa || null }]);

  // --- Audio ---
  const respaldo = (texto) => interpretarOrganizacion(texto, empresas);
  const contarCambios = (prop) => (Array.isArray(prop) ? prop.filter((p) => p.on !== false && String(p.texto || "").trim()).length : 0);
  const aplicarAudio = (prop) => {
    const nuevas = (prop || [])
      .filter((p) => p.on !== false && String(p.texto || "").trim())
      .map((p) => conColumna(
        { id: uid(), texto: p.texto.trim(), columna: "semana", empresa: porId(p.empresa) ? p.empresa : null, audio: true },
        p.columna === "hoy" ? "hoy" : "semana"
      ));
    if (!nuevas.length) return;
    guardarTareas([...tareasRef.current, ...nuevas]);
    setFiltro("todas");
    setTab("bajados");
    flashear(nuevas.map((t) => t.id));
  };
  const renderRevision = ({ propuesta, setPropuesta }) => {
    const lista = Array.isArray(propuesta) ? propuesta : [];
    const n = lista.filter((p) => p.on !== false).length;
    const editar = (i, cambios) => setPropuesta(lista.map((p, j) => (j === i ? { ...p, ...cambios } : p)));
    return (
      <>
        <div className="text-[10px] font-bold uppercase tracking-wide mt-3.5 mb-2" style={{ color: C.soft }}>
          Encontré {n} {n === 1 ? "tarea" : "tareas"} · revisá antes de guardar
        </div>
        {lista.map((p, i) => {
          if (p.on === false) return null;
          const e = porId(p.empresa);
          return (
            <div key={i} className="rounded-lg px-3 py-2.5 mb-2" style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `4px solid ${e ? e.color : C.line}` }}>
              <input value={p.texto || ""} onChange={(ev) => editar(i, { texto: ev.target.value })}
                className="w-full bg-transparent text-sm outline-none mb-2" style={{ color: C.ink, border: "none", padding: 0 }} />
              <div className="flex items-center gap-1.5">
                <SelectEmpresa empresas={empresas} value={e ? p.empresa : ""} onChange={(emp) => editar(i, { empresa: emp })} className={MINI_CLS} style={MINI} />
                <select value={p.columna === "hoy" ? "hoy" : "semana"} onChange={(ev) => editar(i, { columna: ev.target.value })} className={MINI_CLS} style={MINI}>
                  {columnas.filter((c) => c.id === "semana" || c.id === "hoy").map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <span className="flex-1" />
                <button onClick={() => editar(i, { on: false })} title="Descartar" className="px-1 text-sm rounded hover:bg-black/5" style={{ color: C.danger }}>✕</button>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  const tabStyle = (activo) => (activo ? { background: NAVY, color: CREAM } : { background: C.chip, color: C.muted });

  return (
    <div>
      <style>{`@keyframes org-flash{0%{box-shadow:0 0 0 3px #1AABAA}100%{box-shadow:0 1px 2px rgba(0,0,0,.04)}}.org-flash{animation:org-flash 1.6s ease}`}</style>

      <h2 style={{ color: C.ink }} className="text-xl font-semibold mb-1">Organización</h2>
      <p style={{ color: C.muted }} className="text-sm mb-4">{SUBTITULOS[tab]}</p>

      <div className="flex flex-wrap gap-1.5 mb-5">
        <button onClick={() => setTab("bajados")} className="px-3 py-1.5 rounded-md text-xs font-medium" style={tabStyle(tab === "bajados")}>
          Objetivos bajados a tierra
        </button>
        <button onClick={() => setTab("grandes")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium" style={tabStyle(tab === "grandes")}>
          <Target size={12} /> Grandes objetivos
        </button>
        <button onClick={() => setTab("acumuladas")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium" style={tabStyle(tab === "acumuladas")}>
          <Check size={12} /> Tareas acumuladas
        </button>
      </div>

      <div className="mb-4">
        <FiltroEmpresas empresas={empresas} filtro={filtroEf} onChange={setFiltro} conteo={conteo} mostrarSin
          titulo={tab === "grandes" ? "Ver objetivos de" : "Ver tareas de"}
          onNueva={() => setModalEmpresas(true)} onGestionar={() => setModalEmpresas(true)} />
      </div>

      {tab === "bajados" && (
        <TableroBoard columnas={columnas} tareas={visibles(tareas)} empresas={empresas} porId={porId} recien={recien}
          empresaDefault={empresaDefault}
          onAgregar={agregarTarea} onMover={moverTarea} onEmpresa={cambiarEmpresaTarea} onEliminar={eliminarTarea}
          onBan={eliminarTareaDefinitiva} onAgregarColumna={agregarColumna} onEliminarColumna={eliminarColumna}
          onAudio={() => setModalAudio(true)} />
      )}

      {tab === "grandes" && (
        <GrandesObjetivos objetivos={visibles(objetivos)} todosLosObjetivos={objetivos} empresas={empresas} porId={porId}
          empresaDefault={empresaDefault}
          onCrear={crearObjetivo} onEliminar={eliminarObjetivo}
          onMes={(id, mes) => actualizarObjetivo(id, { mes: mes || null })}
          onEmpresa={(id, empresa) => actualizarObjetivo(id, { empresa: empresa || null })}
          onAgregarTarea={agregarTareaObjetivo} onEliminarTarea={eliminarTareaObjetivo} onTranscribir={transcribirATareaSemana} />
      )}

      {tab === "acumuladas" && (
        <TareasAcumuladas base={acumuladasPeriodo} visibles={visibles(acumuladasPeriodo)} empresas={empresas} porId={porId}
          filtro={filtroEf} periodo={periodo} setPeriodo={setPeriodo} busqueda={busqueda} setBusqueda={setBusqueda} />
      )}

      <EmpresasModal open={modalEmpresas} onClose={() => setModalEmpresas(false)} empresasApi={empresasApi} usos={usos} />

      <AudioModal open={modalAudio} onClose={() => setModalAudio(false)}
        titulo="Dictar tareas"
        intro="Contá lo que tenés que hacer, como en un audio de WhatsApp. El sistema arma las tarjetas, detecta la empresa y si es para hoy o para la semana. Antes de guardar, revisás y corregís."
        ejemplo={AUDIO_EJEMPLO}
        contexto="organizacion"
        datos={{ empresas: empresas.map((e) => ({ id: e.id, nombre: e.nombre })) }}
        respaldo={respaldo} renderRevision={renderRevision} contarCambios={contarCambios} onAplicar={aplicarAudio} />
    </div>
  );
}

