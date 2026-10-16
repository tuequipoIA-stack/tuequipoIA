"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ListChecks, Phone, DollarSign, Wallet, Crosshair, Flag, CheckCheck, Megaphone, Users, Target, Check } from "lucide-react";
import { C, tint } from "@/lib/theme";
import { colorTipo } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { useEmpresas } from "@/lib/empresas";
import { createClient } from "@/lib/supabase/client";
import { hoyISO, diasHasta, diasDesde, fechaDia, mesKey, mesOffset, mesCorto, lunesDe, sumarDias } from "@/lib/fechas";
import { conColumna } from "@/components/organizacion/comun";
import {
  normalizar as normOp, enCurso, ultima, proxima, proxObj, enUSD, ETAPAS, ETAPAS_ABIERTAS, TC_DEFAULT,
} from "@/components/crm/oportunidades/comun";
import { normalizar as normProy, movimientos, proxHito, entregado, aARS, money } from "@/components/ventas/nuevo/calculos";
import { CSS, Card, MiniK, SubH, Vacio, Num, Tag, Pill, Prog, Barras, kmoney, TEAL } from "@/components/dashboard/piezas";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const SIN_COLOR = "#958b74";

// Fecha de alta de un cliente: campo explícito o el timestamp del id (uid() = "<ms>-xxxx").
const fechaCliente = (c) => {
  const f = c?.creadoEn || c?.fechaAlta || c?.fecha;
  if (typeof f === "string" && /^\d{4}-\d{2}-\d{2}/.test(f)) return f.slice(0, 10);
  const m = /^(\d{13})-/.exec(String(c?.id || ""));
  if (!m) return null;
  const d = new Date(Number(m[1]));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function DashboardSection({ business, onNavigate }) {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const { empresas } = useEmpresas();
  const [d, setD] = useState(null);
  const [hack, setHack] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const [recien, setRecien] = useState(() => new Set()); // tareas tildadas desde acá (se muestran tachadas)
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const ir = (seccion, sub) => () => onNavigate?.(seccion, sub);

  useEffect(() => {
    if (!unidadId) return;
    const arr = (x) => (Array.isArray(x) ? x : []);
    Promise.all([
      loadData("tablero-tareas", []),
      loadData("tareas-acumuladas", []),
      loadData("grandes-objetivos", []),
      loadData("crm-oportunidades", []),
      loadData("ventas-proyectos", []),
      loadData("ventas-tc", TC_DEFAULT),
      loadData("marketing-calendario", []),
      loadData("clientes-registro", []),
    ]).then(([tab, acu, obj, ops, proy, tc, cal, cli]) => {
      setD({
        tablero: arr(tab), acumuladas: arr(acu), objetivos: arr(obj),
        ops: arr(ops).filter(Boolean).map(normOp),
        proyCrudos: arr(proy).filter((p) => p && p.num !== undefined && p.num !== null),
        tc: Number(tc) > 0 ? Number(tc) : TC_DEFAULT,
        calendario: arr(cal), clientes: arr(cli),
      });
    });
    createClient()
      .from("recursos")
      .select("titulo, descripcion, categoria, publicar_en, created_at")
      .eq("tipo", "hack")
      .lte("publicar_en", new Date().toISOString())
      .order("publicar_en", { ascending: false })
      .limit(1)
      .then((res) => setHack(res?.data?.[0] || null), () => setHack(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidadId]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const avisar = (m) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  };

  const porId = (id) => empresas.find((e) => e.id === id) || null;
  const ok = (id) => filtro === "todas" || id === filtro;
  // Columnas de los gráficos apilados: empresas visibles + "Sin empresa" (solo en "Todas")
  const series = filtro === "todas"
    ? [...empresas.map((e) => ({ id: e.id, nombre: e.nombre, color: e.color })), { id: null, nombre: "Sin empresa", color: SIN_COLOR }]
    : empresas.filter((e) => e.id === filtro).map((e) => ({ id: e.id, nombre: e.nombre, color: e.color }));
  const serieDe = (empId) => (porId(empId) ? empId : null);

  const hoy = hoyISO();
  const mes0 = mesKey(0);

  // ---------- Ventas ----------
  const ventas = useMemo(() => {
    if (!d) return null;
    const proyectos = d.proyCrudos.map((p) => {
      const e = empresas.find((x) => x.id === p.empresa) || null;
      return { p: normProy(p, e), e };
    });
    const movs = proyectos.flatMap(({ p, e }) =>
      movimientos(p, e).map((m) => ({ ...m, num: p.num, cliente: p.cliente, empresa: p.empresa, ars: aARS(m.monto, m.moneda, d.tc) }))
    );
    return { proyectos, movs };
  }, [d, empresas]);

  if (!d || !ventas) return null;

  // ---------- Filtrado por empresa ----------
  const T = d.tablero.filter((t) => ok(t.empresa));
  const A = d.acumuladas.filter((t) => ok(t.empresa));
  const O = d.ops.filter((o) => ok(o.empresa));
  const Oab = O.filter(enCurso);
  const P = ventas.proyectos.filter(({ p }) => ok(p.empresa));
  const M = ventas.movs.filter((m) => ok(m.empresa));
  const OBJ = d.objetivos.filter((o) => o && ok(o.empresa));

  // ---------- Tareas ----------
  const tareasHoy = T.filter((t) => t.columna === "hoy" || recien.has(t.id));
  const pendientes = T.filter((t) => t.columna !== "hecho");
  const paraHoy = T.filter((t) => t.columna === "hoy");
  const hechas = [
    ...A.filter((t) => t.hechoEn),
    ...T.filter((t) => t.columna === "hecho" && t.hechoEn),
  ];
  const hechasSemana = hechas.filter((t) => diasDesde(t.hechoEn) < 7 && diasDesde(t.hechoEn) >= 0).length;

  const toggleTarea = async (t) => {
    const fresco = await loadData("tablero-tareas", []);
    const lista = Array.isArray(fresco) ? fresco : [];
    const actual = lista.find((x) => x.id === t.id) || t;
    const marcar = actual.columna !== "hecho";
    const nueva = marcar ? conColumna(actual, "hecho") : conColumna(actual, "hoy");
    const actualizada = lista.some((x) => x.id === t.id) ? lista.map((x) => (x.id === t.id ? nueva : x)) : [...lista, nueva];
    setD((prev) => ({ ...prev, tablero: actualizada }));
    setRecien((s) => new Set(s).add(t.id));
    await saveData("tablero-tareas", actualizada);
    if (marcar) avisar("Tarea pasada a Hechas");
  };

  // ---------- CRM ----------
  const conProx = Oab.filter((o) => proxima(o));
  const vencidos = conProx.filter((o) => diasHasta(proxima(o)) < 0);
  const contactosHoy = conProx.filter((o) => diasHasta(proxima(o)) === 0);
  const sinProx = Oab.filter((o) => !proxima(o));
  const diasSinHablar = (o) => {
    const u = ultima(o);
    if (u) return diasDesde(u);
    return o.creadaEn ? diasDesde(o.creadaEn) : null;
  };
  const frias = Oab.filter((o) => (diasSinHablar(o) ?? 0) > 14).sort((a, b) => diasSinHablar(b) - diasSinHablar(a));
  const proxContactos = conProx.filter((o) => diasHasta(proxima(o)) <= 7).sort((a, b) => proxima(a).localeCompare(proxima(b)));
  const ganadasMes = O.filter((o) => o.etapa === "ganado" && String(o.cerradaEn || "").slice(0, 7) === mes0);
  const enJuego = Oab.reduce((a, o) => a + enUSD(o, d.tc) * d.tc, 0);

  // ---------- Ventas: cobros y ganancias ----------
  const sumARS = (lista) => lista.reduce((a, m) => a + m.ars, 0);
  const movMes0 = M.filter((m) => m.mes === mes0);
  const cobradoMes = sumARS(movMes0.filter((m) => m.ok));
  const faltaMes = sumARS(movMes0.filter((m) => !m.ok && m.monto > 0));
  const prox3 = sumARS(M.filter((m) => { const x = mesOffset(m.mes); return x >= 1 && x <= 3; }));
  const cobrosSinRegistrar = movMes0.filter((m) => !m.ok && m.monto > 0);
  const proxCobros = M
    .filter((m) => !m.ok && m.monto > 0 && mesOffset(m.mes) >= 0 && mesOffset(m.mes) <= 2)
    .sort((a, b) => a.mes.localeCompare(b.mes) || b.ars - a.ars)
    .slice(0, 6);

  const colsGan = [-3, -2, -1, 0, 1, 2, 3, 4].map((o) => {
    const k = mesKey(o);
    const delMes = M.filter((m) => m.mes === k);
    const tot = sumARS(delMes);
    return {
      key: k, fut: o > 0, act: o === 0,
      label: `${mesCorto(k)}${o === 0 ? " · hoy" : ""}`,
      totLabel: tot ? kmoney(tot) : "",
      partes: series.map((s) => {
        const v = sumARS(delMes.filter((m) => serieDe(m.empresa) === s.id));
        return { color: s.color, valor: v, title: `${s.nombre}: ${money(v, "ARS")}` };
      }),
    };
  });
  const hayGan = colsGan.some((c) => c.partes.some((p) => p.valor));

  const enCursoP = P.filter(({ p, e }) => !entregado(p, e))
    .map(({ p, e }) => ({ p, e, h: proxHito(p) }))
    .sort((a, b) => String(a.h?.f || "9999").localeCompare(String(b.h?.f || "9999")));
  const atrasados = enCursoP.filter(({ h }) => h?.f && diasHasta(h.f) < 0);

  // ---------- Lo que hiciste (6 semanas) ----------
  const lunesHoy = lunesDe(hoy);
  const semanas = Array.from({ length: 6 }, (_, i) => sumarDias(lunesHoy, -7 * (5 - i)));
  const porSemana = semanas.map((s) => hechas.filter((t) => lunesDe(t.hechoEn) === s));
  const hechasMes = hechas.filter((t) => t.hechoEn.slice(0, 7) === mes0).length;
  const promSem = (porSemana.reduce((a, x) => a + x.length, 0) / 6).toFixed(1).replace(".", ",");
  const colsHechas = porSemana.map((x, i) => ({
    key: semanas[i], act: i === 5,
    label: `${semanas[i].slice(8, 10)}/${semanas[i].slice(5, 7)}`,
    totLabel: String(x.length),
    partes: series.map((s) => {
      const n = x.filter((t) => serieDe(t.empresa) === s.id).length;
      return { color: s.color, valor: n, title: `${s.nombre}: ${n}` };
    }),
  }));

  // ---------- Marketing ----------
  const publicaciones = d.calendario
    .filter((p) => p && p.fecha >= hoy)
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .slice(0, 3);

  // ---------- Clientes ----------
  const fechasCli = d.clientes.map(fechaCliente);
  const hayFechaCli = fechasCli.some(Boolean);
  const nuevosMes = fechasCli.filter((f) => f && f.slice(0, 7) === mes0).length;
  const ultimosCli = hayFechaCli
    ? d.clientes.map((c, i) => ({ c, f: fechasCli[i], i })).sort((a, b) => String(b.f || "").localeCompare(String(a.f || "")) || a.i - b.i).slice(0, 3)
    : d.clientes.slice(0, 3).map((c) => ({ c, f: null }));

  // ---------- Alertas ----------
  const alertas = [];
  if (vencidos.length) alertas.push([vencidos.length, vencidos.length === 1 ? "contacto vencido" : "contactos vencidos", "crm", false]);
  if (contactosHoy.length) alertas.push([contactosHoy.length, contactosHoy.length === 1 ? "contacto para hoy" : "contactos para hoy", "crm", true]);
  if (atrasados.length) alertas.push([atrasados.length, atrasados.length === 1 ? "hito atrasado" : "hitos atrasados", "ventas", false]);
  if (cobrosSinRegistrar.length) alertas.push([cobrosSinRegistrar.length, cobrosSinRegistrar.length === 1 ? "cobro de este mes sin registrar" : "cobros de este mes sin registrar", "ventas", true]);
  if (frias.length) alertas.push([frias.length, `${frias.length === 1 ? "oportunidad" : "oportunidades"} sin hablar +14 días`, "crm", true]);
  if (sinProx.length) alertas.push([sinProx.length, "sin próximo contacto agendado", "crm", true]);

  // ---------- Encabezado ----------
  const ahora = new Date();
  const h = ahora.getHours();
  const saludo = h < 13 ? "Buen día" : h < 20 ? "Buenas tardes" : "Buenas noches";
  const nombre = business?.nombreUsuario;

  const chip = (activo, color) => ({
    background: activo && color ? tint(color, 0.14) : C.chip,
    color: activo ? color || C.ink : C.muted,
    border: `1.5px solid ${activo ? color || C.ink : "transparent"}`,
  });

  const kpi = (l, v, s, onClick, color) => (
    <button key={l} onClick={onClick} className="dsh-kpi min-w-0"
      style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px" }}>
      <span className="block" style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 4 }}>{l}</span>
      <b className="block truncate" style={{ fontSize: 19, lineHeight: 1.25, color: color || C.ink }}>{v}</b>
      {s && <small className="block truncate" style={{ fontSize: 11, color: C.soft, marginTop: 3 }}>{s}</small>}
    </button>
  );

  const pillContacto = (f) => {
    const x = diasHasta(f);
    if (x < 0) return <Pill tipo="venc">Vencido · {fechaDia(f)}</Pill>;
    if (x === 0) return <Pill tipo="hoy">Hoy</Pill>;
    return <Pill tipo="sem">{x === 1 ? "Mañana" : fechaDia(f)}</Pill>;
  };

  const vistaEmpresas = filtro === "todas" ? empresas : empresas.filter((e) => e.id === filtro);

  return (
    <div style={{ color: C.ink }}>
      <style>{CSS}</style>

      {/* Encabezado + filtro de empresa */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3.5">
        <div>
          <h2 className="font-bold" style={{ fontSize: 22, margin: "0 0 3px" }}>{nombre ? `${saludo}, ${nombre}` : saludo}</h2>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>Lo más importante de todas tus secciones, en una sola pantalla.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => setFiltro("todas")} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={chip(filtro === "todas")}>Todas</button>
          {empresas.map((e) => (
            <button key={e.id} onClick={() => setFiltro(e.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={chip(filtro === e.id, e.color)}>
              <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />{e.nombre}
            </button>
          ))}
          <span className="ml-1.5" style={{ fontSize: 12, color: C.soft }}>{DIAS[ahora.getDay()]} {ahora.getDate()} de {MESES[ahora.getMonth()]}</span>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="flex flex-wrap items-center mb-4"
          style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `4px solid ${C.danger}`, borderRadius: 12, padding: "10px 14px", gap: "8px 18px" }}>
          <b className="uppercase" style={{ fontSize: 11, letterSpacing: ".05em", color: C.danger }}>Atención</b>
          {alertas.map(([n, txt, sec, warn]) => (
            <button key={txt} onClick={ir(sec)} className="dsh-link flex items-center gap-1.5 font-semibold" style={{ fontSize: 13, color: C.ink, padding: "3px 0" }}>
              <span className="font-extrabold" style={{ borderRadius: 999, padding: "1px 8px", fontSize: 12, background: warn ? "#f3e6cf" : "#f0d6d3", color: warn ? "#9a6421" : "#9b3c35" }}>{n}</span>
              {txt}
            </button>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="dsh-kpis">
        {kpi("Cobrado este mes", kmoney(cobradoMes), `Falta cobrar ${kmoney(faltaMes)}`, ir("ventas"), C.ok)}
        {kpi("A cobrar próximos 3 meses", kmoney(prox3), "proyectado", ir("ventas"))}
        {kpi("Oportunidades en curso", Oab.length, `${kmoney(enJuego)} en juego`, ir("crm"))}
        {kpi("Ganadas este mes", ganadasMes.length, "pasaron a Ventas", ir("crm"))}
        {kpi("Tareas pendientes", pendientes.length, `${paraHoy.length} para hoy`, ir("tablero"))}
        {kpi("Hechas esta semana", hechasSemana, "últimos 7 días", ir("tablero"))}
      </div>

      <div className="dsh-grid">
        {/* Tareas de hoy */}
        <Card className="dsh-c5" icon={ListChecks} titulo="Tareas de hoy" ir={ir("tablero")} irLabel="Organización">
          <MiniK items={[
            { l: "Hoy", v: paraHoy.length },
            { l: "Esta semana", v: T.filter((t) => t.columna === "semana").length },
            ...vistaEmpresas.map((e) => ({ l: e.nombre, color: e.color, v: pendientes.filter((t) => t.empresa === e.id).length })),
          ]} />
          {tareasHoy.length ? (
            <div className="flex flex-col">
              {tareasHoy.map((t) => {
                const hecha = t.columna === "hecho";
                return (
                  <div key={t.id} className="dsh-row">
                    <button onClick={() => toggleTarea(t)} aria-label={hecha ? "Desmarcar tarea" : "Marcar como hecha"}
                      className="shrink-0 flex items-center justify-center"
                      style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${hecha ? TEAL : C.line}`, background: hecha ? TEAL : C.panel }}>
                      {hecha && <Check size={11} color="#fff" strokeWidth={3} />}
                    </button>
                    <span className="dsh-tx" style={hecha ? { textDecoration: "line-through", color: C.soft } : undefined}>{t.texto}</span>
                    <Tag empresa={porId(t.empresa)} />
                  </div>
                );
              })}
            </div>
          ) : (
            <Vacio ir={ir("tablero")} irLabel="Organización">
              {T.length ? "No tenés tareas para hoy. Pasá alguna desde \"Esta semana\" en" : "Todavía no cargaste tareas — empezá en"}
            </Vacio>
          )}
        </Card>

        {/* Próximos contactos */}
        <Card className="dsh-c7" icon={Phone} titulo="Próximos contactos" ir={ir("crm")} irLabel="CRM">
          {proxContactos.length ? (
            <div className="flex flex-col">
              {proxContactos.map((o) => {
                const px = proxObj(o);
                return (
                  <div key={o.num ?? o.id} className="dsh-row dsh-click" onClick={ir("crm")}>
                    <Num n={o.num} />
                    <span className="dsh-tx"><b>{o.cliente}</b> {px?.m && <small style={{ color: C.soft, fontSize: 11.5 }}>· {px.m}</small>}</span>
                    <Tag empresa={porId(o.empresa)} />
                    {pillContacto(px?.f || proxima(o))}
                  </div>
                );
              })}
            </div>
          ) : d.ops.length ? (
            <Vacio>Sin contactos agendados en los próximos 7 días.</Vacio>
          ) : (
            <Vacio ir={ir("crm")} irLabel="CRM">Todavía no cargaste oportunidades — empezá en el</Vacio>
          )}
        </Card>

        {/* Ganancias por mes */}
        <Card className="dsh-c8" icon={DollarSign} titulo="Tus ganancias por mes" ir={ir("ventas")} irLabel="Ganancias">
          {hayGan ? (
            <>
              <Barras cols={colsGan} />
              <div className="flex flex-wrap mt-2" style={{ gap: 12, fontSize: 11, color: C.muted }}>
                {series.filter((s) => colsGan.some((c) => c.partes.some((p) => p.color === s.color && p.valor))).map((s) => (
                  <span key={s.id ?? "sin"} className="flex items-center gap-1.5"><i className="inline-block rounded-full" style={{ width: 8, height: 8, background: s.color }} />{s.nombre}</span>
                ))}
                <span style={{ color: C.soft }}>· USD a $ {d.tc.toLocaleString("es-AR")} · los meses que vienen son proyección</span>
              </div>
            </>
          ) : (
            <Vacio ir={ir("ventas")} irLabel="Ventas">
              {d.proyCrudos.length ? "Tus proyectos todavía no tienen cobros cargados. Completalos en" : "Todavía no cargaste proyectos — empezá en"}
            </Vacio>
          )}
        </Card>

        {/* Próximos cobros */}
        <Card className="dsh-c4" icon={Wallet} titulo="Próximos cobros" ir={ir("ventas")} irLabel="Ver">
          {proxCobros.length ? (
            <div className="flex flex-col">
              {proxCobros.map((m, i) => {
                const actual = m.mes === mes0;
                return (
                  <div key={`${m.num}-${m.mes}-${i}`} className="dsh-row dsh-click" onClick={ir("ventas")}>
                    <Num n={m.num} />
                    <span className="dsh-tx">
                      <b>{m.cliente || "Sin cliente"}</b><br />
                      <small style={{ color: C.soft, fontSize: 11.5 }}>{m.det} · {mesCorto(m.mes)}</small>
                    </span>
                    <span className="font-bold whitespace-nowrap" style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums", color: actual ? C.warn : C.ok }}>
                      {money(m.monto, m.moneda)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Vacio>Sin cobros pendientes en los próximos 3 meses.</Vacio>
          )}
        </Card>

        {/* Embudo comercial */}
        <Card className="dsh-c5" icon={Crosshair} titulo="Embudo comercial" ir={ir("crm")} irLabel="CRM">
          {O.length ? (
            <>
              {(() => {
                const filas = ETAPAS_ABIERTAS.map((id) => {
                  const l = Oab.filter((o) => o.etapa === id);
                  return { id, n: l.length, usd: l.reduce((a, o) => a + enUSD(o, d.tc), 0) };
                });
                const mx = Math.max(1, ganadasMes.length, ...filas.map((f) => f.n));
                const barra = (n, color) => (
                  <div className="overflow-hidden" style={{ height: 10, background: C.chip, borderRadius: 5 }}>
                    <div style={{ height: "100%", width: `${(n / mx) * 100}%`, background: color }} />
                  </div>
                );
                return (
                  <div>
                    {filas.map((f) => (
                      <div key={f.id} className="mb-2">
                        <div className="flex justify-between" style={{ fontSize: 12, marginBottom: 3 }}>
                          <span>{ETAPAS[f.id].l}</span>
                          <b>{f.n} <small style={{ color: C.soft, fontWeight: 600 }}>· USD {Math.round(f.usd).toLocaleString("es-AR")}</small></b>
                        </div>
                        {barra(f.n, ETAPAS[f.id].bar)}
                      </div>
                    ))}
                    <div className="mb-2">
                      <div className="flex justify-between" style={{ fontSize: 12, marginBottom: 3 }}>
                        <span>Ganadas este mes</span><b>{ganadasMes.length}</b>
                      </div>
                      {barra(ganadasMes.length, C.ok)}
                    </div>
                  </div>
                );
              })()}
              <SubH style={{ marginTop: 8 }}>Sin hablar hace más de 14 días</SubH>
              {frias.length ? (
                <div className="flex flex-col">
                  {frias.slice(0, 5).map((o) => (
                    <div key={o.num ?? o.id} className="dsh-row dsh-click" onClick={ir("crm")}>
                      <Num n={o.num} />
                      <span className="dsh-tx">{o.cliente}</span>
                      <span className="font-bold whitespace-nowrap" style={{ fontSize: 12.5, color: C.danger }}>hace {diasSinHablar(o)} días</span>
                    </div>
                  ))}
                  {frias.length > 5 && <Vacio>y {frias.length - 5} más…</Vacio>}
                </div>
              ) : (
                <Vacio>Todas al día.</Vacio>
              )}
            </>
          ) : (
            <Vacio ir={ir("crm")} irLabel="CRM">Todavía no cargaste oportunidades — empezá en el</Vacio>
          )}
        </Card>

        {/* Proyectos en curso */}
        <Card className="dsh-c7" icon={Flag} titulo="Proyectos en curso" ir={ir("ventas")} irLabel="Operativa">
          {enCursoP.length ? (
            <div className="flex flex-col">
              {enCursoP.map(({ p, e, h: hi }) => {
                const tot = p.hitos.length;
                const hechos = p.hitos.filter((x) => x.estado === "hecho").length;
                const atras = hi?.f && diasHasta(hi.f) < 0;
                return (
                  <div key={p.num} className="dsh-row dsh-click" onClick={ir("ventas")}>
                    <Num n={p.num} />
                    <span className="dsh-tx"><b>{p.cliente || "Sin cliente"}</b> {p.desc && <small style={{ color: C.soft, fontSize: 11.5 }}>· {p.desc}</small>}</span>
                    <span title={`${hechos}/${tot} hitos`} className="dsh-hide-sm"><Prog pct={tot ? (hechos / tot) * 100 : 0} color={e?.color || SIN_COLOR} /></span>
                    <span className="text-right whitespace-nowrap" style={{ fontSize: 12 }}>
                      {hi ? (
                        <>
                          {hi.n || "Próximo hito"}
                          {hi.f && <> · <b style={{ color: atras ? C.danger : "inherit" }}>{atras ? "atrasado" : fechaDia(hi.f)}</b></>}
                        </>
                      ) : (
                        <span style={{ color: C.soft }}>Sin hitos</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Vacio ir={ir("ventas")} irLabel="Ventas">
              {d.proyCrudos.length ? "No tenés proyectos en curso." : "Todavía no cargaste proyectos — empezá en"}
            </Vacio>
          )}
        </Card>

        {/* Lo que hiciste */}
        <Card className="dsh-c4" icon={CheckCheck} titulo="Lo que hiciste" ir={ir("tablero")} irLabel="Acumuladas">
          <MiniK items={[{ l: "Este mes", v: hechasMes }, { l: "Promedio semanal", v: promSem }]} />
          {hechas.length ? (
            <Barras cols={colsHechas} alto={90} maxBarra={60} />
          ) : (
            <Vacio>Cuando completes tareas en Organización, acá vas a ver tu ritmo semanal.</Vacio>
          )}
        </Card>

        {/* Marketing */}
        <Card className="dsh-c4" icon={Megaphone} titulo="Marketing" ir={ir("marketing", "calendario")} irLabel="Marketing">
          <SubH>Próximas publicaciones</SubH>
          {publicaciones.length ? (
            <div className="flex flex-col">
              {publicaciones.map((p) => {
                const col = colorTipo(p.tipo);
                const x = diasHasta(p.fecha);
                return (
                  <div key={p.id} className="dsh-row dsh-click" onClick={ir("marketing", "calendario")}>
                    <Pill style={{ background: col.bg, color: col.text }}>{p.tipo}</Pill>
                    <span className="dsh-tx">{p.copy || p.tipo}</span>
                    <span className="font-semibold whitespace-nowrap" style={{ fontSize: 12.5, color: C.muted }}>
                      {x === 0 ? "Hoy" : x === 1 ? "Mañana" : fechaDia(p.fecha)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Vacio ir={ir("marketing", "calendario")} irLabel="Calendario">No tenés publicaciones planificadas. Agendá en el</Vacio>
          )}
          {hack && (
            <button onClick={ir("recursos", "hacks")} className="text-left mt-2.5"
              style={{ background: "#1A1A2E", color: "#F4F1EC", borderRadius: 10, padding: "10px 12px", fontSize: 12.5, lineHeight: 1.45 }}>
              <b className="block uppercase" style={{ color: TEAL, fontSize: 10.5, letterSpacing: ".05em", marginBottom: 3 }}>Hack de la semana</b>
              {hack.titulo}
            </button>
          )}
        </Card>

        {/* Clientes */}
        <Card className="dsh-c4" icon={Users} titulo="Clientes" ir={ir("clientes")} irLabel="Clientes">
          <MiniK items={[{ l: "Total", v: d.clientes.length }, ...(hayFechaCli ? [{ l: "Nuevos este mes", v: nuevosMes }] : [])]} />
          <SubH>Últimos agregados</SubH>
          {ultimosCli.length ? (
            <div className="flex flex-col">
              {ultimosCli.map(({ c, f }, i) => (
                <div key={c.id ?? i} className="dsh-row dsh-click" onClick={ir("clientes")}>
                  <span className="dsh-tx">{c.nombre || "Sin nombre"}</span>
                  {f && <span className="font-semibold whitespace-nowrap" style={{ fontSize: 12.5, color: C.muted }}>{fechaDia(f)}</span>}
                </div>
              ))}
            </div>
          ) : (
            <Vacio ir={ir("clientes")} irLabel="Clientes">Todavía no cargaste clientes — empezá en</Vacio>
          )}
        </Card>

        {/* Grandes objetivos */}
        <Card className="dsh-c12" icon={Target} titulo="Grandes objetivos" ir={ir("tablero")} irLabel="Objetivos">
          {OBJ.length ? (
            <div className="dsh-split">
              {OBJ.map((o) => {
                const n = Array.isArray(o.tareas) ? o.tareas.length : 0;
                return (
                  <div key={o.id} className="dsh-row dsh-click" style={{ borderTop: "none", padding: "6px 0" }} onClick={ir("tablero")}>
                    <Pill tipo="mes">{o.mes || "Sin mes"}</Pill>
                    <span className="dsh-tx"><b>{o.titulo}</b></span>
                    <Tag empresa={porId(o.empresa)} />
                    <span className="whitespace-nowrap font-bold" style={{ fontSize: 11.5, color: C.muted }}>{n} {n === 1 ? "tarea" : "tareas"}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Vacio ir={ir("tablero")} irLabel="Organización">
              {d.objetivos.length ? "Sin objetivos para esta empresa." : "Todavía no definiste grandes objetivos — creá el primero en"}
            </Vacio>
          )}
        </Card>
      </div>

      {toast && <div className="dsh-toast">{toast}</div>}
    </div>
  );
}
