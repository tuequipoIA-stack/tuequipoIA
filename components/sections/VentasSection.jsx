"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Search, Briefcase } from "lucide-react";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { useEmpresas } from "@/lib/empresas";
import { C } from "@/lib/theme";
import { mesSumar } from "@/lib/fechas";
import { descargarCsv } from "@/lib/exportCsv";
import { FiltroEmpresas, EmpresasModal } from "@/components/empresas/EmpresasUI";
import AudioModal, { BotonAudio } from "@/components/audio/AudioModal";
import { interpretarVentas, ejemploVentas } from "@/lib/audio/ventas";
import { normalizar, entregado, movimientos, horasTot, modeloDe, ESTADOS_HITO } from "@/components/ventas/nuevo/calculos";
import { EstilosVentas } from "@/components/ventas/nuevo/ui";
import Operativa from "@/components/ventas/nuevo/Operativa";
import Ganancias from "@/components/ventas/nuevo/Ganancias";
import ProyectoDrawer from "@/components/ventas/nuevo/ProyectoDrawer";
import RevisionAudio, { contarCambiosVentas } from "@/components/ventas/nuevo/RevisionAudio";

const NAVY = "#1A1A2E";
const CREAM = "#F4F1EC";
const TC_DEFAULT = 1450;

const SUBTITULOS = {
  oper: "Lo que pasa después de cerrar: fechas de desarrollo, implementación y entrega, y horas ejecutadas.",
  gan: "Lo que ganás vos en cada proyecto, según las reglas de cada empresa, y cuándo lo cobrás.",
};

const AUDIO_INTRO =
  "Contá cómo avanzaron tus proyectos: qué hito terminaste, si se movió una fecha, cuántas horas trabajaste, qué se cobró o cuánto se ejecutó. Nombrá cada proyecto por su número o por el cliente. Antes de guardar, revisás todo.";

export default function VentasSection({ business }) {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const empresasApi = useEmpresas();
  const { empresas, actualizar, porId } = empresasApi;
  const [modalEmpresas, setModalEmpresas] = useState(false);

  const [crudos, setCrudos] = useState([]);
  const [cargado, setCargado] = useState(false);
  const [tc, setTcState] = useState(TC_DEFAULT);
  const crudosRef = useRef([]);

  const [tab, setTab] = useState("oper");
  const [filtro, setFiltro] = useState("todas");
  const [estado, setEstado] = useState("curso");
  const anio = new Date().getFullYear();
  const [periodo, setPeriodo] = useState(String(anio));
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(null);
  const [audioEmp, setAudioEmp] = useState(null); // null = cerrado · "todas" · id de empresa · "sin"
  const [recien, setRecien] = useState(() => new Set());
  const flashTimer = useRef(null);

  useEffect(() => {
    if (!unidadId) return;
    loadData("ventas-proyectos", []).then((d) => {
      const lista = Array.isArray(d) ? d.filter((p) => p && p.num !== undefined && p.num !== null) : [];
      crudosRef.current = lista;
      setCrudos(lista);
      setCargado(true);
    });
    loadData("ventas-tc", TC_DEFAULT).then((v) => setTcState(Number(v) > 0 ? Number(v) : TC_DEFAULT));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidadId]);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const empresaDe = (p) => porId(p.empresa);
  const proyectos = useMemo(
    () => crudos.map((p) => normalizar(p, empresas.find((e) => e.id === p.empresa) || null)),
    [crudos, empresas]
  );

  const guardar = (lista) => {
    crudosRef.current = lista;
    setCrudos(lista);
    saveData("ventas-proyectos", lista);
  };
  const cambiarProyecto = (nuevo) => guardar(crudosRef.current.map((p) => (p.num === nuevo.num ? nuevo : p)));
  const eliminarProyecto = (n) => { setAbierto(null); guardar(crudosRef.current.filter((p) => p.num !== n)); };
  const setTc = (v) => { setTcState(v); saveData("ventas-tc", v); };

  const flashear = (nums) => {
    setRecien(new Set(nums));
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setRecien(new Set()), 2200);
  };

  // ---- Filtros ----
  const conocida = (p) => !!empresaDe(p);
  const pasaEmpresa = (p, f = filtro) => f === "todas" || (f === "sin" ? !conocida(p) : p.empresa === f);
  const q = busqueda.trim().toLowerCase().replace(/^#/, "");
  const lista = proyectos.filter((p) => {
    if (!pasaEmpresa(p)) return false;
    if (tab === "oper" && estado !== "todos") {
      const ent = entregado(p, empresaDe(p));
      if (estado === "curso" ? ent : !ent) return false;
    }
    if (q && !(String(p.num) === q || p.cliente.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))) return false;
    return true;
  });
  const conteo = (id) => proyectos.filter((p) => pasaEmpresa(p, id)).length;

  const grupos = [
    ...empresas.map((e) => ({ empresa: e, proyectos: lista.filter((p) => p.empresa === e.id) })),
    { empresa: null, proyectos: lista.filter((p) => !conocida(p)) },
  ]
    .filter((g) => g.proyectos.length)
    .map((g) => ({ ...g, proyectos: [...g.proyectos].sort((a, b) => Number(a.num) - Number(b.num)) }));

  const cabecera = (e, extra) => (
    <div className="flex flex-wrap items-center gap-2.5 mb-2 px-1">
      <span className="rounded-full shrink-0" style={{ width: 11, height: 11, background: e?.color || C.soft }} />
      <h3 className="text-[15px] font-bold m-0" style={{ color: C.ink }}>{e?.nombre || "Sin empresa"}</h3>
      {extra}
      <span className="ml-auto">
        <BotonAudio color={e?.color || C.muted} onClick={(ev) => { ev?.stopPropagation?.(); setAudioEmp(e ? e.id : "sin"); }}>
          Audio {e?.nombre || "sin empresa"}
        </BotonAudio>
      </span>
    </div>
  );

  // ---- Exportar ----
  const exportar = () => {
    const nombreEmp = (p) => empresaDe(p)?.nombre || "Sin empresa";
    if (tab === "oper") {
      descargarCsv("ventas-operativa.csv", [
        ["N°", "Empresa", "Cliente", "Descripción", "Hito", "Fecha", "Estado", "Horas totales del proyecto"],
        ...lista.flatMap((p) => p.hitos.map((h) => [p.num, nombreEmp(p), p.cliente, p.desc, h.n, h.f, ESTADOS_HITO[h.estado], horasTot(p)])),
      ]);
    } else {
      descargarCsv("ventas-ganancias.csv", [
        ["N°", "Empresa", "Cliente", "Mes de cobro", "Concepto", "Tu ganancia", "Moneda", "Cobrado"],
        ...lista.flatMap((p) =>
          movimientos(p, empresaDe(p))
            .filter((m) => periodo === "todo" || m.mes.startsWith(periodo))
            .map((m) => [p.num, nombreEmp(p), p.cliente, m.mes, m.det, Math.round(m.monto), m.moneda, m.ok ? "Sí" : "No"])
        ),
      ]);
    }
  };

  // ---- Audio ----
  const audioEmpresa = audioEmp && audioEmp !== "todas" && audioEmp !== "sin" ? porId(audioEmp) : null;
  const proyectosAudio = proyectos.filter((p) =>
    audioEmp === "todas" ? true : audioEmp === "sin" ? !conocida(p) : p.empresa === audioEmp
  );
  const datosAudio = {
    proyectos: proyectosAudio.map((p) => {
      const e = empresaDe(p);
      const modelo = modeloDe(e);
      return {
        num: p.num,
        cliente: p.cliente,
        empresa: e?.nombre || "Sin empresa",
        modelo,
        hitos: p.hitos.map((h, i) => ({ i, n: h.n, f: h.f, estado: h.estado })),
        ...(modelo === "cuotas" ? { cuotas: Array.from({ length: p.cuotas }, (_, i) => { const mes = mesSumar(p.inicio, i); return { mes, cobrada: p.cobradas.includes(mes) }; }) } : {}),
        ...(modelo === "agencia" ? { ejecucion: p.ejecucion, pagadas: p.pagadas } : {}),
        ...(modelo === "propio" ? { cobros: p.cobros.map((c, idx) => ({ idx, mes: c.mes, monto: c.monto, ok: c.ok })) } : {}),
      };
    }),
  };
  const ejemplo = audioEmpresa
    ? ejemploVentas([modeloDe(audioEmpresa)])
    : ejemploVentas(empresas.map((e) => modeloDe(e)));

  const aplicarAudio = (prop) => {
    if (!Array.isArray(prop)) return;
    const tocados = [];
    let nueva = crudosRef.current;
    prop.forEach((x) => {
      const on = (x.cambios || []).filter((c) => c.on);
      if (!on.length) return;
      const base = proyectos.find((p) => Number(p.num) === Number(x.num));
      if (!base) return;
      const p = JSON.parse(JSON.stringify(base));
      on.forEach((c) => {
        if (c.tipo === "hito" && p.hitos[c.hi] && ESTADOS_HITO[c.e]) p.hitos[c.hi].estado = c.e;
        if (c.tipo === "fecha" && p.hitos[c.hi] && c.f) p.hitos[c.hi].f = c.f;
        if (c.tipo === "horas" && Number(c.h)) p.horas.push({ f: c.f || new Date().toISOString().slice(0, 10), h: +c.h, d: c.d || "" });
        if (c.tipo === "cuota" && p.cobradas && c.mes && !p.cobradas.includes(c.mes)) p.cobradas.push(c.mes);
        if (c.tipo === "pago" && p.pagadas && c.ejecMes) { const m = mesSumar(c.ejecMes, 1); if (!p.pagadas.includes(m)) p.pagadas.push(m); }
        if (c.tipo === "ejec" && p.ejecucion && c.mes) {
          const e = p.ejecucion.find((y) => y.mes === c.mes);
          if (e) e.monto = +c.monto || 0; else p.ejecucion.push({ mes: c.mes, monto: +c.monto || 0 });
          p.ejecucion.sort((a, b) => a.mes.localeCompare(b.mes));
        }
        if (c.tipo === "cobro" && p.cobros && p.cobros[c.idx]) p.cobros[c.idx].ok = true;
      });
      nueva = nueva.map((y) => (Number(y.num) === Number(p.num) ? p : y));
      tocados.push(p.num);
    });
    if (!tocados.length) return;
    guardar(nueva);
    flashear(tocados);
  };

  const proyectoAbierto = abierto !== null ? proyectos.find((p) => p.num === abierto) : null;
  const tabStyle = (activo) => (activo ? { background: NAVY, color: CREAM } : { background: C.chip, color: C.muted });
  const selStyle = { background: C.card, border: `1px solid ${C.line}`, outline: "none", color: C.ink };

  return (
    <div>
      <EstilosVentas />

      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h2 style={{ color: C.ink }} className="text-xl font-semibold mb-1">Ventas</h2>
          <p style={{ color: C.muted }} className="text-sm mb-4">{SUBTITULOS[tab]}</p>
        </div>
        <BotonAudio onClick={() => setAudioEmp("todas")} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <button onClick={() => setTab("oper")} className="px-3 py-1.5 rounded-md text-xs font-medium" style={tabStyle(tab === "oper")}>Operativa</button>
        <button onClick={() => setTab("gan")} className="px-3 py-1.5 rounded-md text-xs font-medium" style={tabStyle(tab === "gan")}>Ganancias</button>
      </div>

      <div className="mb-3">
        <FiltroEmpresas empresas={empresas} filtro={filtro} onChange={setFiltro} conteo={conteo} mostrarSin titulo="Ver proyectos de"
          onNueva={() => setModalEmpresas(true)} onGestionar={() => setModalEmpresas(true)} />
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {tab === "oper" ? (
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold" style={selStyle}>
            <option value="curso">En curso</option>
            <option value="entregado">Entregados</option>
            <option value="todos">Todos</option>
          </select>
        ) : (
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold" style={selStyle}>
            <option value={String(anio)}>Año {anio}</option>
            <option value={String(anio + 1)}>Año {anio + 1}</option>
            <option value="todo">Todo</option>
          </select>
        )}
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 flex-1 sm:flex-none" style={{ ...selStyle, minWidth: 200 }}>
          <Search size={13} style={{ color: C.soft }} />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por número o cliente…"
            className="bg-transparent outline-none text-[12.5px] w-full" style={{ color: C.ink }} />
        </div>
        <span className="flex-1 hidden sm:block" />
        <button onClick={exportar} disabled={!lista.length} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-bold disabled:opacity-50"
          style={{ border: "1.5px solid #1AABAA", color: C.tealDark }}>
          <Download size={13} /> Descargar Excel
        </button>
      </div>

      {cargado && proyectos.length === 0 ? (
        <div className="rounded-xl px-5 py-10 text-center" style={{ background: C.card, border: `1px dashed ${C.line}` }}>
          <Briefcase size={28} className="mx-auto mb-2" style={{ color: C.soft }} />
          <div className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Todavía no hay proyectos</div>
          <p className="text-xs max-w-md mx-auto leading-relaxed" style={{ color: C.muted }}>
            Cuando en el CRM marcás una oportunidad como <b>Ganada</b>, aparece acá con el mismo número y los hitos típicos de su empresa ya cargados,
            para que ajustes las fechas, cargues horas y sigas lo que vas a cobrar.
          </p>
        </div>
      ) : cargado && lista.length === 0 ? (
        <div className="rounded-xl px-5 py-6 text-center text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>
          No hay proyectos con estos filtros.
        </div>
      ) : tab === "oper" ? (
        <Operativa grupos={grupos} lista={lista} recien={recien} onAbrir={setAbierto} cabecera={cabecera} />
      ) : (
        <Ganancias grupos={grupos} lista={lista} empresas={empresas} porId={porId} periodo={periodo} tc={tc} setTc={setTc}
          recien={recien} onAbrir={setAbierto} cabecera={cabecera} actualizar={actualizar} filtro={filtro} />
      )}

      {proyectoAbierto && (
        <ProyectoDrawer key={proyectoAbierto.num} proyecto={proyectoAbierto} empresa={empresaDe(proyectoAbierto)}
          onCambiar={cambiarProyecto} onEliminar={() => eliminarProyecto(proyectoAbierto.num)} onCerrar={() => setAbierto(null)} />
      )}

      <AudioModal open={audioEmp !== null} onClose={() => setAudioEmp(null)}
        titulo={audioEmpresa ? `Audio ${audioEmpresa.nombre}` : audioEmp === "sin" ? "Audio · sin empresa" : "Actualizar por audio"}
        intro={AUDIO_INTRO}
        ejemplo={ejemplo}
        contexto="ventas"
        datos={datosAudio}
        respaldo={(texto) => interpretarVentas(texto, proyectosAudio, empresas)}
        renderRevision={({ propuesta, setPropuesta }) => (
          <RevisionAudio propuesta={propuesta} setPropuesta={setPropuesta} proyectos={proyectos} porId={porId} />
        )}
        contarCambios={contarCambiosVentas}
        onAplicar={aplicarAudio} />

      <EmpresasModal open={modalEmpresas} onClose={() => setModalEmpresas(false)} empresasApi={empresasApi}
        usos={(id) => { const n = proyectos.filter((p) => p.empresa === id).length; return n ? `${n} proy.` : ""; }}
        onBorrada={(e) => { if (filtro === e.id) setFiltro("todas"); }} />
    </div>
  );
}
