"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Download, Link2, CheckSquare } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { C } from "@/lib/theme";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { useEmpresas } from "@/lib/empresas";
import { asegurarProyectoVenta, sincronizarCompraventa } from "@/lib/ventas";
import { normalizarCV } from "@/lib/compraventa";
import { descargarCsv } from "@/lib/exportCsv";
import { uid } from "@/lib/helpers";
import { hoyISO, diasHasta, diasDesde, fechaDia } from "@/lib/fechas";
import { interpretarCrm } from "@/lib/audio/crm";
import { FiltroEmpresas, EmpresasModal } from "@/components/empresas/EmpresasUI";
import AudioModal, { BotonAudio } from "@/components/audio/AudioModal";
import {
  ETAPAS, ETAPAS_ABIERTAS, TIPOS_DOC, TC_DEFAULT, SIN_EMPRESA, CSS,
  normalizar, enCurso, ultima, ultimaObj, proxima, proxObj, enUSD, money, proxEn, tareasDe, pendientesDe, sel,
} from "@/components/crm/oportunidades/comun";
import { EtapaPill, NumChip, Kpi, Dot } from "@/components/crm/oportunidades/Piezas";
import OportunidadDrawer from "@/components/crm/oportunidades/OportunidadDrawer";
import NuevaOportunidadModal from "@/components/crm/oportunidades/NuevaOportunidadModal";
import CrmDashboardOps, { calcularDashboard } from "@/components/crm/oportunidades/CrmDashboardOps";
import RevisionAudio from "@/components/crm/oportunidades/RevisionAudio";

const AUDIO_EJEMPLO =
  "La cinco, Delpack: hoy hablé por WhatsApp con la gerencia, aceptaron separar el costeo como módulo aparte y pasamos a negociación. Quedamos en reunirnos el martes. Mandar la cotización revisada. La nueve, The Market: me respondió que lo ve con su socio, volver a llamarlo el jueves.";

const SUBTITULOS = {
  ops: "Tus oportunidades comerciales de todas las empresas, con todo el detalle en un solo lugar.",
  dash: "KPIs, embudo y actividad comercial por empresa.",
};

function UltimaCelda({ o }) {
  const u = ultima(o);
  if (!u) return <span style={{ color: C.soft, fontSize: 12.5 }}>—</span>;
  const d = diasDesde(u);
  const color = enCurso(o) ? (d > 14 ? C.danger : d > 7 ? C.warn : C.ink) : C.ink;
  return (
    <span className="flex flex-col" style={{ fontSize: 12.5 }}>
      <span style={{ color, fontWeight: color === C.ink ? 400 : 700 }}>{d <= 0 ? "Hoy" : d === 1 ? "Ayer" : `Hace ${d} días`}</span>
      <small style={{ fontSize: 11, color: C.soft }}>{ultimaObj(o)?.c}</small>
    </span>
  );
}

function ProxCelda({ o }) {
  if (!enCurso(o)) {
    return <span style={{ color: C.soft, fontSize: 12.5 }}>{o.etapa === "ganado" ? "Ganada" : "Perdida"} {o.cerradaEn ? fechaDia(o.cerradaEn) : ""}</span>;
  }
  const p = proxObj(o);
  if (!p) {
    return (
      <span className="flex flex-col" style={{ fontSize: 12.5 }}>
        <span style={{ color: C.warn, fontWeight: 700 }}>Sin agendar</span>
        <small style={{ fontSize: 11, color: C.soft }}>Agendá el próximo paso</small>
      </span>
    );
  }
  const d = diasHasta(p.f);
  const txt = d < 0 ? `Vencido (${fechaDia(p.f)})` : d === 0 ? "Hoy" : d === 1 ? "Mañana" : fechaDia(p.f);
  return (
    <span className="flex flex-col" style={{ fontSize: 12.5 }}>
      <span style={{ color: d < 0 ? C.danger : d === 0 ? C.warn : C.ink, fontWeight: d <= 0 ? 700 : 400 }}>{txt}</span>
      <small className="truncate" style={{ fontSize: 11, color: C.soft }}>{p.m.length > 34 ? p.m.slice(0, 34) + "…" : p.m}</small>
    </span>
  );
}

export default function CrmSection() {
  const storage = useUnidadStorage();
  const { loadData, saveData, unidadId } = storage;
  const empresasApi = useEmpresas();
  const { empresas, porId } = empresasApi;

  const [ops, setOps] = useState([]);
  const opsRef = useRef([]);
  const [tablero, setTablero] = useState([]);
  const [acumuladas, setAcumuladas] = useState([]);
  const [ventasMax, setVentasMax] = useState(0);
  const [tc, setTc] = useState(TC_DEFAULT);

  const [tab, setTab] = useState("ops");
  const [filtro, setFiltro] = useState("todas");
  const [estado, setEstado] = useState("curso");
  const [fEtapa, setFEtapa] = useState("");
  const [fProx, setFProx] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("num");
  const [periodo, setPeriodo] = useState("90");

  const [abierta, setAbierta] = useState(null); // num
  const [modalNueva, setModalNueva] = useState(false);
  const [modalEmpresas, setModalEmpresas] = useState(null); // null | "gestionar" | "desdeForm"
  const [empresaNueva, setEmpresaNueva] = useState(null);
  const [modalAudio, setModalAudio] = useState(false);
  const [recien, setRecien] = useState(() => new Set());
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  useEffect(() => {
    if (!unidadId) return;
    Promise.all([
      loadData("crm-oportunidades", []),
      loadData("tablero-tareas", []),
      loadData("tareas-acumuladas", []),
      loadData("ventas-proyectos", []),
      loadData("ventas-tc", TC_DEFAULT),
    ]).then(([o, t, a, v, cambio]) => {
      const lista = (Array.isArray(o) ? o : []).map(normalizar);
      opsRef.current = lista;
      setOps(lista);
      setTablero(Array.isArray(t) ? t : []);
      setAcumuladas(Array.isArray(a) ? a : []);
      setVentasMax(Math.max(0, ...(Array.isArray(v) ? v : []).map((p) => Number(p.num) || 0)));
      setTc(Number(cambio) > 0 ? Number(cambio) : TC_DEFAULT);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidadId]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const avisar = (m) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };
  const flashear = (nums) => {
    setRecien(new Set(nums));
    setTimeout(() => setRecien(new Set()), 2000);
  };

  const guardarOps = async (lista) => {
    opsRef.current = lista;
    setOps(lista);
    await saveData("crm-oportunidades", lista);
  };

  const nextNum = Math.max(0, ventasMax, ...ops.map((o) => Number(o.num) || 0)) + 1;

  // Pasa a Ventas (si no estaba) cuando queda ganada
  const pasarAVentas = async (op) => {
    try {
      await asegurarProyectoVenta(storage, op, porId(op.empresa));
      setVentasMax((m) => Math.max(m, op.num));
    } catch (_) {}
  };

  // Aplica cambios a una oportunidad; si cambia la etapa a cerrada, fecha de cierre
  const aplicarEtapa = (o, etapa) => {
    if (o.etapa === etapa) return o;
    const n = { ...o, etapa };
    if (etapa === "ganado" || etapa === "perdido") n.cerradaEn = hoyISO();
    else delete n.cerradaEn;
    // Compraventa: al marcarlo vendido, completa fecha y precio de venta si faltan
    if (etapa === "ganado" && n.cv) {
      const cv = normalizarCV(n.cv);
      if (!cv.venta.f) cv.venta.f = hoyISO();
      if (!cv.venta.monto) cv.venta.monto = Number(n.valor) || cv.objetivo;
      n.cv = cv;
    }
    return n;
  };

  const cambiarOp = async (num, cambios) => {
    await guardarOps(opsRef.current.map((o) => (o.num === num ? { ...o, ...cambios } : o)));
    // Compraventa ya vendida: lo editado en el CRM se refleja en Ventas
    const o = opsRef.current.find((x) => x.num === num);
    if (o && o.etapa === "ganado" && cambios.cv) {
      try { await sincronizarCompraventa(storage, o); } catch (_) {}
    }
  };

  const cambiarEtapa = async (num, etapa) => {
    const actual = opsRef.current.find((o) => o.num === num);
    if (!actual || actual.etapa === etapa) return;
    const nueva = aplicarEtapa(actual, etapa);
    await guardarOps(opsRef.current.map((o) => (o.num === num ? nueva : o)));
    if (etapa === "ganado") { await pasarAVentas(nueva); avisar("¡Ganada! Pasa a Ventas."); }
    else if (etapa === "perdido") avisar("Marcada como perdida.");
  };

  const eliminarOp = async (num) => {
    setAbierta(null);
    await guardarOps(opsRef.current.filter((o) => o.num !== num));
    avisar(`Oportunidad #${num} eliminada`);
  };

  // Tareas en el tablero de Organización (se lee fresco, se agrega y se guarda)
  const crearTareas = async (items) => {
    if (!items.length) return;
    const actual = await loadData("tablero-tareas", []);
    const lista = [...(Array.isArray(actual) ? actual : []), ...items];
    await saveData("tablero-tareas", lista);
    setTablero(lista);
  };
  const nuevaTarea = (op, texto, columna, audio = false) => ({
    id: uid(), texto: `#${op.num} ${texto}`, columna: columna === "hoy" ? "hoy" : "semana", empresa: op.empresa || null, opNum: op.num, ...(audio ? { audio: true } : {}),
  });

  const crearOportunidad = async (f) => {
    const v = await loadData("ventas-proyectos", []);
    const vMax = Math.max(0, ...(Array.isArray(v) ? v : []).map((p) => Number(p.num) || 0));
    const num = Math.max(vMax, ...opsRef.current.map((o) => Number(o.num) || 0)) + 1;
    const ganada = f.etapa === "ganado";
    const op = normalizar({
      num, empresa: f.empresa || null, cliente: f.cliente.trim(), rubro: f.rubro.trim(), etapa: f.etapa,
      valor: parseFloat(f.valor) || 0, moneda: f.moneda, prob: ganada ? 100 : 50,
      contactos: f.contacto.trim() || f.tel.trim() ? [{ n: f.contacto.trim() || "Contacto", r: "", t: f.tel.trim(), m: "" }] : [],
      proximos: f.prox && !ganada ? [{ f: f.prox, m: "Primer seguimiento", h: false }] : [],
      creadaEn: hoyISO(),
      ...(f.cv ? { cv: f.cv } : {}),
      ...(ganada ? { cerradaEn: hoyISO() } : {}),
    });
    await guardarOps([...opsRef.current, op]);
    setVentasMax(vMax);
    setModalNueva(false);
    setEmpresaNueva(null);
    setTab("ops");
    if (ganada) {
      setEstado("ganado");
      await pasarAVentas(op);
      avisar("¡Ganada! Pasa a Ventas.");
    } else {
      setEstado("curso");
      avisar(`Oportunidad #${num} creada`);
    }
    flashear([num]);
  };

  // --- Filtros ---
  const filtroEf = filtro !== "todas" && filtro !== "sin" && !porId(filtro) ? "todas" : filtro;
  const empDe = (o) => porId(o.empresa);
  const pasaEmpresa = (o, f) => f === "todas" || (f === "sin" ? !empDe(o) : o.empresa === f);

  const filtradas = ops.filter((o) => {
    if (!pasaEmpresa(o, filtroEf)) return false;
    if (estado === "curso" && !enCurso(o)) return false;
    if ((estado === "ganado" || estado === "perdido") && o.etapa !== estado) return false;
    if (fEtapa && o.etapa !== fEtapa) return false;
    if (fProx === "vencido" && !proxEn(o, (d) => d < 0)) return false;
    if (fProx === "hoy" && !proxEn(o, (d) => d === 0)) return false;
    if (fProx === "semana" && !proxEn(o, (d) => d >= 0 && d <= 7)) return false;
    if (fProx === "sin" && proxima(o)) return false;
    const q = busqueda.trim().toLowerCase();
    if (q) {
      const hay = [o.num, "#" + o.num, o.cliente, o.rubro, o.notas, ...o.contactos.flatMap((c) => [c.n, c.t, c.m]), ...o.conv.map((c) => c.r)]
        .join(" ").toLowerCase();
      if (!(q.replace(/^#/, "") === String(o.num) || hay.includes(q))) return false;
    }
    return true;
  });

  const baseConteo = ops.filter((o) => tab === "dash" || estado !== "curso" || enCurso(o));
  const conteo = (f) => (f === "todas" ? baseConteo.length : baseConteo.filter((o) => pasaEmpresa(o, f)).length);

  const sortFn = {
    num: (a, b) => a.num - b.num,
    prox: (a, b) => (proxima(a) || "9999").localeCompare(proxima(b) || "9999"),
    ult: (a, b) => (ultima(a) || "").localeCompare(ultima(b) || ""),
    valor: (a, b) => enUSD(b, tc) - enUSD(a, tc),
  }[orden];

  // Grupos: empresas (según filtro) + "Sin empresa"
  const gruposEmpresa = [
    ...empresas.filter((e) => filtroEf === "todas" || filtroEf === e.id),
    ...(filtroEf === "todas" || filtroEf === "sin" ? [SIN_EMPRESA] : []),
  ];
  const deGrupo = (lista, e) => lista.filter((o) => (e.id ? o.empresa === e.id : !empDe(o)));

  // --- KPIs ---
  const curso = filtradas.filter(enCurso);
  const usd = curso.filter((o) => o.moneda !== "ARS").reduce((a, o) => a + (Number(o.valor) || 0), 0);
  const ars = curso.filter((o) => o.moneda === "ARS").reduce((a, o) => a + (Number(o.valor) || 0), 0);
  const venc = curso.filter((o) => proxEn(o, (d) => d < 0)).length;
  const sem = curso.filter((o) => proxEn(o, (d) => d >= 0 && d <= 7)).length;
  const frias = curso.filter((o) => { const u = ultima(o); return u && diasDesde(u) > 14; }).length;

  // --- Dashboard ---
  const gruposDash = gruposEmpresa.filter((e) => e.id || ops.some((o) => !empDe(o)));
  const dash = calcularDashboard({ ops, filtro: filtroEf, periodo, tc, gruposEmpresa: gruposDash });

  // --- Exportar ---
  const exportar = () => {
    if (tab === "ops") {
      descargarCsv("crm-oportunidades.csv", [
        ["N°", "Empresa", "Cliente", "Rubro", "Etapa", "Valor", "Moneda", "Probabilidad %", "Última conversación", "Canal", "Resumen última conversación", "Próximo contacto", "Motivo", "Contacto", "Teléfono", "Email", "Links", "Tareas pendientes", "Notas"],
        ...[...filtradas].sort((a, b) => a.num - b.num).map((o) => {
          const uc = ultimaObj(o);
          const p = proxObj(o);
          const c = o.contactos[0] || {};
          const pend = tablero.filter((t) => t.opNum === o.num && t.columna !== "hecho").map((t) => t.texto).join(" | ");
          return [o.num, empDe(o)?.nombre || "Sin empresa", o.cliente, o.rubro, ETAPAS[o.etapa]?.l, o.valor, o.moneda, o.prob, uc?.f || "", uc?.c || "", uc?.r || "",
            p?.f || "", p?.m || "", c.n || "", c.t || "", c.m || "", o.docs.map((d) => `${TIPOS_DOC[d.tipo] || "Otro"}: ${d.u}`).join(" | "), pend, o.notas];
        }),
      ]);
      avisar("Descargado: crm-oportunidades.csv");
    } else {
      descargarCsv("crm-dashboard.csv", [
        ["Empresa", "En curso", "Calificado", "Propuesta enviada", "Negociación", "Ganadas", "Perdidas", "Valor en curso (USD aprox.)"],
        ...gruposDash.map((e) => {
          const l = deGrupo(ops, e);
          const c = l.filter(enCurso);
          return [e.nombre, c.length, ...ETAPAS_ABIERTAS.map((et) => c.filter((o) => o.etapa === et).length),
            l.filter((o) => o.etapa === "ganado").length, l.filter((o) => o.etapa === "perdido").length, Math.round(c.reduce((a, o) => a + enUSD(o, tc), 0))];
        }),
      ]);
      avisar("Descargado: crm-dashboard.csv");
    }
  };

  // --- Audio ---
  const respaldo = (texto) => interpretarCrm(texto, opsRef.current.map((o) => ({ num: o.num, cliente: o.cliente, etapa: o.etapa })));
  const contarCambios = (prop) =>
    Array.isArray(prop)
      ? prop.reduce((a, p) => a + (opsRef.current.some((o) => o.num === p.num) ? (p.cambios || []).filter((c) => c.on !== false).length : 0), 0)
      : 0;
  const aplicarAudio = async (prop) => {
    let n = 0;
    const tocadas = [];
    const ganadas = [];
    const tareasNuevas = [];
    let lista = opsRef.current;
    (prop || []).forEach((p) => {
      const idx = lista.findIndex((o) => o.num === p.num);
      if (idx < 0) return;
      let o = { ...lista[idx], conv: [...lista[idx].conv], proximos: [...lista[idx].proximos] };
      (p.cambios || []).filter((c) => c.on !== false).forEach((c) => {
        n++;
        if (c.tipo === "conv" && String(c.r || "").trim()) o.conv.push({ f: c.f || hoyISO(), c: c.c || "Llamada", r: String(c.r).trim(), audio: true });
        if (c.tipo === "etapa" && ETAPAS[c.e] && o.etapa !== c.e) {
          o = aplicarEtapa(o, c.e);
          if (c.e === "ganado") ganadas.push(o.num);
        }
        if (c.tipo === "proximo" && c.f) {
          o.proximos = o.proximos.map((x) => (!x.h && x.f && diasHasta(x.f) <= 0 ? { ...x, h: true } : x));
          o.proximos.push({ f: c.f, m: String(c.m || "Seguimiento").trim(), h: false });
        }
        if (c.tipo === "tarea" && String(c.t || "").trim()) tareasNuevas.push(nuevaTarea(o, String(c.t).trim(), c.c, true));
      });
      lista = lista.map((x, i) => (i === idx ? o : x));
      tocadas.push(o.num);
    });
    await guardarOps(lista);
    await crearTareas(tareasNuevas);
    for (const num of ganadas) await pasarAVentas(lista.find((o) => o.num === num));
    setTab("ops");
    flashear(tocadas);
    avisar(ganadas.length ? `¡Ganada! Pasa a Ventas. · ${n} cambios aplicados` : `${n} ${n === 1 ? "cambio aplicado" : "cambios aplicados"}`);
  };

  const opAbierta = abierta != null ? ops.find((o) => o.num === abierta) : null;
  const empresaDefault = filtroEf !== "todas" && filtroEf !== "sin" ? filtroEf : null;
  const usos = (id) => {
    const k = ops.filter((o) => o.empresa === id).length;
    return `${k} ${k === 1 ? "oportunidad" : "oportunidades"}`;
  };

  const chipTab = (on) => (on ? { background: BRAND.navy, color: BRAND.cream } : { background: C.chip, color: C.muted });

  return (
    <div>
      <style>{CSS}</style>
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">CRM</h2>
          <p style={{ color: C.muted }} className="text-sm mb-4">{SUBTITULOS[tab]}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <BotonAudio onClick={() => setModalAudio(true)} />
          <button onClick={() => setModalNueva(true)} className="rounded-lg px-3.5 py-2 text-sm font-bold flex items-center gap-1.5" style={{ background: BRAND.teal, color: BRAND.navy }}>
            <Plus size={15} /> Nueva oportunidad
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button onClick={() => setTab("ops")} className="px-3 py-1.5 rounded-md text-xs font-medium" style={chipTab(tab === "ops")}>Oportunidades</button>
        <button onClick={() => setTab("dash")} className="px-3 py-1.5 rounded-md text-xs font-medium" style={chipTab(tab === "dash")}>Dashboard</button>
      </div>

      {/* Barra de filtros */}
      <div className="mb-3.5 flex flex-col gap-2.5">
        <FiltroEmpresas empresas={empresas} filtro={filtroEf} onChange={setFiltro} conteo={conteo} mostrarSin
          onNueva={() => setModalEmpresas("gestionar")} onGestionar={() => setModalEmpresas("gestionar")} titulo="Ver oportunidades de" />
        <div className="rounded-xl px-3 py-2.5 flex gap-2 flex-wrap items-center" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          {tab === "ops" ? (
            <>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} style={sel}>
                <option value="curso">En curso</option>
                <option value="ganado">Ganadas</option>
                <option value="perdido">Perdidas</option>
                <option value="todas">Todas</option>
              </select>
              <select value={fEtapa} onChange={(e) => setFEtapa(e.target.value)} style={sel}>
                <option value="">Todas las etapas</option>
                {ETAPAS_ABIERTAS.map((k) => <option key={k} value={k}>{ETAPAS[k].l}</option>)}
              </select>
              <select value={fProx} onChange={(e) => setFProx(e.target.value)} style={sel}>
                <option value="">Cualquier próximo contacto</option>
                <option value="vencido">Vencidos</option>
                <option value="hoy">Para hoy</option>
                <option value="semana">Próximos 7 días</option>
                <option value="sin">Sin agendar</option>
              </select>
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por número, cliente, contacto o nota…"
                style={{ ...sel, fontWeight: 500, flex: 1, minWidth: 180 }} />
              <select value={orden} onChange={(e) => setOrden(e.target.value)} style={sel}>
                <option value="num">Orden: número</option>
                <option value="prox">Orden: próximo contacto</option>
                <option value="ult">Orden: última conversación</option>
                <option value="valor">Orden: valor</option>
              </select>
            </>
          ) : (
            <>
              <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} style={sel}>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 3 meses</option>
                <option value="365">Último año</option>
                <option value="todo">Todo</option>
              </select>
              <span className="flex-1" />
            </>
          )}
          <button onClick={exportar} className="rounded-lg flex items-center gap-1.5 text-[13px] font-bold" style={{ padding: "7px 13px", border: "1.5px solid #1AABAA", color: C.tealDark }}>
            <Download size={14} /> Descargar Excel
          </button>
        </div>
      </div>

      {tab === "ops" && (
        <section>
          <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
            <Kpi label="Oportunidades" valor={filtradas.length} />
            <Kpi label="Valor en juego" style={{ fontSize: 16 }} valor={
              <>
                {usd ? money(usd, "USD") : ""}{usd && ars ? <br /> : null}{ars ? money(ars, "ARS") : ""}{!usd && !ars ? "—" : ""}
              </>
            } />
            <Kpi label="Contactos próximos 7 días" valor={sem} />
            <Kpi label="Contactos vencidos" valor={venc} style={{ color: venc ? C.danger : C.ink }} />
            <Kpi label="Sin hablar hace +14 días" valor={frias} style={{ color: frias ? C.warn : C.ink }} />
          </div>

          {gruposEmpresa.map((e) => {
            const l = deGrupo(filtradas, e).sort(sortFn);
            if (!l.length) return null;
            return (
              <div key={e.id || "sin"} className="mb-5">
                <div className="flex items-center gap-2.5 mb-2 px-1">
                  <Dot color={e.color} size={11} />
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink }}>{e.nombre}</h3>
                  <small style={{ color: C.soft, fontSize: 12, fontWeight: 600 }}>{l.length} {l.length === 1 ? "oportunidad" : "oportunidades"}</small>
                </div>
                <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                  <div className="crmop-row crmop-th" style={{ background: C.panel, color: C.soft }}>
                    <span>N°</span><span>Cliente</span><span>Etapa</span><span>Valor</span><span>Última conversación</span><span>Próximo contacto</span><span>Info</span>
                  </div>
                  {l.map((o) => (
                    <div key={o.num} onClick={() => setAbierta(o.num)}
                      className={`crmop-row crmop-op ${recien.has(o.num) ? "crmop-flash" : ""}`}
                      style={{ borderTop: `1px solid ${C.line}`, boxShadow: `inset 3px 0 0 ${e.color}`, color: C.ink }}>
                      <NumChip num={o.num} />
                      <span className="min-w-0">
                        <b className="block truncate" style={{ fontSize: 14 }}>{o.cliente}</b>
                        {o.rubro && <small className="block truncate" style={{ color: C.soft, fontSize: 12 }}>{o.rubro}</small>}
                      </span>
                      <span className="c-etapa"><EtapaPill etapa={o.etapa} /></span>
                      <span className="c-valor" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{money(o.valor, o.moneda)}</span>
                      <span className="c-ult"><UltimaCelda o={o} /></span>
                      <span className="c-prox min-w-0"><ProxCelda o={o} /></span>
                      <span className="c-iconos flex gap-2" style={{ color: C.soft, fontSize: 11.5, fontWeight: 700 }}>
                        <span title="Links" className="flex items-center gap-0.5"><Link2 size={12} /> {o.docs.length}</span>
                        <span title="Tareas pendientes" className="flex items-center gap-0.5"><CheckSquare size={12} /> {pendientesDe(o.num, tablero)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {!filtradas.length && (
            <div className="text-[13px] py-4 px-1" style={{ color: C.soft }}>
              {ops.length ? "No hay oportunidades con estos filtros." : "Todavía no cargaste oportunidades. Tocá “+ Nueva oportunidad” para empezar."}
            </div>
          )}
        </section>
      )}

      {tab === "dash" && <CrmDashboardOps datos={dash} tc={tc} />}

      {opAbierta && (
        <OportunidadDrawer
          key={opAbierta.num}
          op={opAbierta}
          empresas={empresas}
          porId={porId}
          tareas={tareasDe(opAbierta.num, tablero, acumuladas)}
          onClose={() => setAbierta(null)}
          onCambiar={(cambios) => cambiarOp(opAbierta.num, cambios)}
          onEtapa={(etapa) => cambiarEtapa(opAbierta.num, etapa)}
          onCrearTarea={async (texto, columna, avisarTarea) => {
            await crearTareas([nuevaTarea(opAbierta, texto, columna)]);
            if (avisarTarea) avisar(`Tarea creada en Organización${porId(opAbierta.empresa) ? " · " + porId(opAbierta.empresa).nombre : ""}`);
          }}
          onEliminar={() => eliminarOp(opAbierta.num)}
        />
      )}

      <NuevaOportunidadModal
        open={modalNueva}
        onClose={() => { setModalNueva(false); setEmpresaNueva(null); }}
        empresas={empresas}
        empresaDefault={empresaDefault}
        proxNum={nextNum}
        onCrear={crearOportunidad}
        onNuevaEmpresa={() => setModalEmpresas("desdeForm")}
        empresaNueva={empresaNueva}
      />

      <EmpresasModal
        open={!!modalEmpresas}
        onClose={() => setModalEmpresas(null)}
        empresasApi={empresasApi}
        usos={usos}
        soloCrear={modalEmpresas === "desdeForm"}
        onCreada={(nueva) => {
          if (modalEmpresas === "desdeForm") setEmpresaNueva(nueva.id);
          avisar("Empresa creada: " + nueva.nombre);
        }}
        onBorrada={(e) => avisar("Empresa borrada: " + e.nombre)}
      />

      <AudioModal
        open={modalAudio}
        onClose={() => setModalAudio(false)}
        titulo="Actualizar por audio"
        intro="Contá cómo avanzaron tus oportunidades. Nombrá cada una por su número o por el cliente. El sistema registra las conversaciones, agenda los próximos contactos, crea tareas y cambia etapas. Antes de guardar, revisás todo."
        ejemplo={AUDIO_EJEMPLO}
        contexto="crm"
        datos={{ oportunidades: ops.filter(enCurso).map((o) => ({ num: o.num, cliente: o.cliente, empresa: porId(o.empresa)?.nombre || "Sin empresa", etapa: o.etapa })) }}
        respaldo={respaldo}
        renderRevision={({ propuesta, setPropuesta }) => (
          <RevisionAudio propuesta={propuesta} setPropuesta={setPropuesta} ops={ops} porId={porId} />
        )}
        contarCambios={contarCambios}
        onAplicar={aplicarAudio}
      />

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[80] rounded-[10px] text-[13px] font-semibold"
          style={{ bottom: 22, background: BRAND.navy, color: BRAND.cream, padding: "10px 16px", boxShadow: "0 6px 20px rgba(0,0,0,.25)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
