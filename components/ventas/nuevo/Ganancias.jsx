"use client";

import { Fragment } from "react";
import { C } from "@/lib/theme";
import { mesKey, mesOffset, mesCorto, mesLargo } from "@/lib/fechas";
import { money, num, modeloDe, movimientos, resumenPropio, horasTot, agDe, aARS, porMoneda } from "./calculos";
import { Kpi, NumBadge, Pill, ReglaTag, InputDiferido } from "./ui";
import { resumenCV } from "@/lib/compraventa";

const inpRegla = { width: 64, border: `1px solid ${C.line}`, background: C.panel, borderRadius: 6, padding: "3px 6px", fontWeight: 700, textAlign: "right", outline: "none", color: C.ink };
const fmt = (n) => Math.round(n).toLocaleString("es-AR");

// Montos por moneda, uno debajo del otro
function Dos({ movs, sep }) {
  const t = porMoneda(movs);
  const partes = [];
  if (t.ARS) partes.push(money(t.ARS, "ARS"));
  if (t.USD) partes.push(money(t.USD, "USD"));
  if (!partes.length) return "—";
  if (sep) return partes.join(sep);
  return partes.map((x, i) => <div key={i}>{x}</div>);
}

// Total por moneda para los pies de tabla
function totalMonedas(items) {
  const r = {};
  items.forEach(([v, m]) => { const k = m === "USD" ? "USD" : "ARS"; r[k] = (r[k] || 0) + v; });
  const keys = Object.keys(r);
  if (!keys.length) return money(0, "ARS");
  return keys.map((k) => <div key={k}>{money(r[k], k)}</div>);
}

function ReglaCard({ e, actualizar }) {
  const modelo = modeloDe(e);
  const pct = num(e.pct);
  const set = (campo) => (v) => actualizar(e.id, { [campo]: num(v) });
  let cuerpo = null;
  if (modelo === "cuotas") {
    cuerpo = (
      <>
        Cobro <InputDiferido type="number" value={e.pct ?? 0} onCommit={set("pct")} className="" style={inpRegla} />% de la venta, a medida que el cliente paga cada cuota.
        <Ej>Ej: venta $ 10.000.000 en 6 cuotas → cuota $ 1.666.667 → <b>tu comisión $ {fmt((10000000 / 6) * pct / 100)} por mes</b> durante 6 meses.</Ej>
      </>
    );
  } else if (modelo === "agencia") {
    const ag = num(e.agencia ?? 25);
    const neto = 10000 * (1 - ag / 100);
    cuerpo = (
      <>
        Cobro <InputDiferido type="number" value={e.pct ?? 0} onCommit={set("pct")} className="" style={inpRegla} />% de la facturación sin la comisión de agencia. Agencia predeterminada:{" "}
        <InputDiferido type="number" value={e.agencia ?? 25} onCommit={set("agencia")} className="" style={inpRegla} />%, modificable por cliente. Se cobra el mes siguiente al ejecutado.
        <Ej>Ej: {mesLargo(mesKey(0)).split(" ")[0]} ejecutado USD 10.000 → neto USD {neto.toLocaleString("es-AR")} → <b>tu comisión USD {(neto * pct / 100).toLocaleString("es-AR")}</b>, cobrada en {mesLargo(mesKey(1)).split(" ")[0]}.</Ej>
      </>
    );
  } else if (modelo === "propio") {
    const hora = num(e.hora);
    cuerpo = (
      <>
        Ganancia = lo que cobra el cliente − costos. Valor de tu hora: ${" "}
        <InputDiferido type="number" value={e.hora ?? 0} onCommit={set("hora")} className="" style={{ ...inpRegla, width: 96 }} />
        <Ej>Ej: proyecto $ 1.800.000 con 34 h → costo $ {fmt(34 * hora)} → <b>ganancia $ {fmt(1800000 - 34 * hora)}</b> (antes de otros costos).</Ej>
      </>
    );
  } else if (modelo === "compraventa") {
    cuerpo = (
      <>
        Ganancia = precio de venta − precio de compra − arreglos. Se mide cuántos días estuvo invertida la plata (de la compra a la venta) para ver qué rinde más rápido.
        <Ej>Ej: comprás a $ 1.000.000, arreglás por $ 200.000 y vendés a $ 1.600.000 a los 30 días → <b>ganancia $ 400.000</b> · 33% sobre lo invertido · $ 13.333 por día.</Ej>
      </>
    );
  }
  const titulo = modelo === "propio" ? "desarrollos propios" : modelo === "compraventa" ? "compraventa" : "comisión";
  return (
    <div className="rounded-xl px-3.5 py-3 text-[12.5px] leading-relaxed" style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: `4px solid ${e.color}`, color: C.muted }}>
      <h4 className="text-sm font-bold mb-1.5" style={{ color: C.ink }}>{e.nombre} · {titulo}</h4>
      {cuerpo}
    </div>
  );
}

function Ej({ children }) {
  return <div className="mt-1.5 rounded-lg px-2 py-1.5" style={{ fontSize: 11.5, background: C.panel }}>{children}</div>;
}

export default function Ganancias({ grupos, lista, empresas, porId, periodo, tc, setTc, recien, onAbrir, cabecera, actualizar, filtro }) {
  const movs = lista.flatMap((p) => movimientos(p, porId(p.empresa)).map((m) => ({ ...m, p })));
  const enPer = (m) => periodo === "todo" || m.mes.startsWith(periodo);
  const mesAct = movs.filter((m) => m.mes === mesKey(0));
  const cobradoMes = mesAct.filter((m) => m.ok);
  const prox3 = movs.filter((m) => mesOffset(m.mes) >= 1 && mesOffset(m.mes) <= 3);
  const cobradoPer = movs.filter((m) => enPer(m) && m.ok);
  const pendiente = movs.filter((m) => enPer(m) && !m.ok);
  const totPer = movs.filter(enPer).reduce((a, m) => a + aARS(m.monto, m.moneda, tc), 0);

  // Gráfico: 3 meses atrás → 5 adelante, en $ (USD convertido con el TC)
  const meses = Array.from({ length: 9 }, (_, i) => mesKey(i - 3));
  const ecol = empresas.filter((e) => modeloDe(e) !== "ninguno" && (filtro === "todas" || filtro === e.id));
  const valMes = (k, eid) => movs.filter((m) => m.mes === k && m.p.empresa === eid).reduce((a, m) => a + aARS(m.monto, m.moneda, tc), 0);
  const maxM = Math.max(1, ...meses.map((k) => ecol.reduce((a, e) => a + Math.max(0, valMes(k, e.id)), 0)));

  const reglas = empresas.filter((e) => modeloDe(e) !== "ninguno");
  const perTxt = periodo === "todo" ? "" : periodo;

  const fila = (p) => ({ className: `click ${recien.has(p.num) ? "vt-flash" : ""}`, onClick: () => onAbrir(p.num) });

  return (
    <>
      {reglas.length > 0 && (
        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
          {reglas.map((e) => <ReglaCard key={e.id} e={e} actualizar={actualizar} />)}
        </div>
      )}

      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
        <Kpi label={`Cobrás este mes (${mesLargo(mesKey(0))})`} sub={<>Ya cobrado: <Dos movs={cobradoMes} sep=" · " /></>}><Dos movs={mesAct} /></Kpi>
        <Kpi label="A cobrar próximos 3 meses"><Dos movs={prox3} /></Kpi>
        <Kpi label={`Cobrado ${periodo === "todo" ? "(total)" : "en " + periodo}`}><span style={{ color: C.ok }}><Dos movs={cobradoPer} /></span></Kpi>
        <Kpi label={`Pendiente de cobro ${perTxt ? "en " + perTxt : ""}`}><Dos movs={pendiente} /></Kpi>
        <Kpi label={`Total en pesos ${perTxt}`}
          sub={<>USD a $ <InputDiferido type="number" value={tc} onCommit={(v) => setTc(num(v) || 1)} className=""
            style={{ width: 64, border: `1px solid ${C.line}`, background: C.panel, borderRadius: 5, padding: "1px 4px", fontSize: 11, outline: "none", color: C.ink }} /></>}>
          {money(totPer, "ARS")}
        </Kpi>
      </div>

      <div className="rounded-xl px-4 py-3.5 mb-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="flex flex-wrap justify-between gap-2 mb-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: C.muted }}>
          Tus ganancias por mes
          <small className="normal-case tracking-normal font-semibold" style={{ color: C.soft }}>según cuándo se cobran · USD convertidos a $ · los meses que vienen son proyección</small>
        </div>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-2.5" style={{ height: 190, minWidth: 420 }}>
            {meses.map((k) => {
              const o = mesOffset(k);
              const tot = ecol.reduce((a, e) => a + valMes(k, e.id), 0);
              return (
                <div key={k} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                  <span className="whitespace-nowrap font-bold" style={{ fontSize: 10, color: C.muted }}>{tot ? `$ ${fmt(tot / 1000)}k` : ""}</span>
                  <div className="w-full flex flex-col-reverse rounded-md overflow-hidden" style={{ maxWidth: 46, minHeight: 2, opacity: o > 0 ? 0.55 : 1 }}>
                    {ecol.map((e) => {
                      const v = Math.max(0, valMes(k, e.id));
                      return v ? <div key={e.id} title={`${e.nombre}: $ ${fmt(v)}`} style={{ height: (v / maxM) * 150, background: e.color }} /> : null;
                    })}
                  </div>
                  <small className="capitalize whitespace-nowrap" style={{ fontSize: 10.5, color: o === 0 ? C.ink : C.soft, fontWeight: o === 0 ? 800 : 600 }}>
                    {mesCorto(k)}{o === 0 ? " · hoy" : ""}
                  </small>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-3.5 mt-2 text-[11px]" style={{ color: C.muted }}>
          {ecol.map((e) => <span key={e.id} className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full inline-block" style={{ background: e.color }} />{e.nombre}</span>)}
        </div>
      </div>

      {grupos.map(({ empresa: e, proyectos: ps }) => {
        const modelo = modeloDe(e);
        const pct = num(e?.pct);
        if (modelo === "cuotas") {
          const tC = [], tP = [];
          return (
            <div key={e.id} className="mb-5">
              {cabecera(e, <ReglaTag>{pct}% de cada cuota cobrada</ReglaTag>)}
              <div className="vt-tabla"><table>
                <thead><tr><th>N°</th><th>Cliente</th><th className="r">Venta</th><th className="r">Cuotas cobradas</th><th className="r">Tu comisión / cuota</th><th className="r">Comisión cobrada</th><th className="r">Comisión pendiente</th><th>Próxima cuota</th></tr></thead>
                <tbody>
                  {ps.map((p) => {
                    const ms = movimientos(p, e);
                    const cob = ms.filter((m) => m.ok), pen = ms.filter((m) => !m.ok);
                    const cC = cob.reduce((a, m) => a + m.monto, 0), cP = pen.reduce((a, m) => a + m.monto, 0);
                    tC.push([cC, p.moneda]); tP.push([cP, p.moneda]);
                    return (
                      <tr key={p.num} {...fila(p)}>
                        <td><NumBadge n={p.num} /></td>
                        <td className="vt-cli"><b>{p.cliente}</b><small>{p.desc}</small></td>
                        <td className="r">{money(p.venta, p.moneda)}</td>
                        <td className="r">{cob.length}/{p.cuotas}</td>
                        <td className="r">{money((p.venta / p.cuotas) * pct / 100, p.moneda)}</td>
                        <td className="r vt-verde">{money(cC, p.moneda)}</td>
                        <td className="r">{money(cP, p.moneda)}</td>
                        <td>{pen[0] ? mesCorto(pen[0].mes) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot><tr><td colSpan={5}>Total</td><td className="r vt-verde">{totalMonedas(tC)}</td><td className="r">{totalMonedas(tP)}</td><td /></tr></tfoot>
              </table></div>
            </div>
          );
        }
        if (modelo === "agencia") {
          const tF = [], tCm = [];
          const agDef = num(e.agencia ?? 25);
          return (
            <div key={e.id} className="mb-5">
              {cabecera(e, <ReglaTag>{pct}% del neto sin agencia ({agDef}% salvo excepciones) · cobro a mes siguiente</ReglaTag>)}
              <div className="vt-tabla"><table>
                <thead><tr><th>N°</th><th>Cliente</th><th>Mes ejecutado</th><th className="r">Facturación</th><th className="r">Com. agencia</th><th className="r">Neto</th><th className="r">Tu comisión {pct}%</th><th>Se cobra en</th><th>Estado</th></tr></thead>
                <tbody>
                  {ps.map((p) => {
                    const ms = movimientos(p, e);
                    const ag = agDe(p, e);
                    if (!ms.length) {
                      return (
                        <tr key={p.num} {...fila(p)}>
                          <td><NumBadge n={p.num} /></td><td className="vt-cli"><b>{p.cliente}</b></td>
                          <td colSpan={7} style={{ color: C.soft }}>Sin ejecución cargada · tocá para cargarla</td>
                        </tr>
                      );
                    }
                    return (
                      <Fragment key={p.num}>
                        {ms.map((m) => {
                          tF.push([m.ejec.monto, p.moneda]); tCm.push([m.monto, p.moneda]);
                          const o = mesOffset(m.ejec.mes);
                          const est = m.ok ? <Pill tipo="ok">Cobrada</Pill> : o > 0 ? <Pill tipo="plan">Planificada</Pill> : o === 0 ? <Pill tipo="curso">En ejecución</Pill> : <Pill tipo="pend">A cobrar</Pill>;
                          return (
                            <tr key={m.i} {...fila(p)}>
                              <td><NumBadge n={p.num} /></td>
                              <td className="vt-cli"><b>{p.cliente}</b></td>
                              <td>{mesCorto(m.ejec.mes)}</td>
                              <td className="r">{money(m.ejec.monto, p.moneda)}</td>
                              <td className="r" style={{ color: C.soft }}>
                                − {money(m.ejec.monto * ag / 100, p.moneda)}{" "}
                                <small style={{ fontSize: 10.5, ...(p.agencia != null ? { color: C.tealDark, fontWeight: 800 } : {}) }}>({ag}%)</small>
                              </td>
                              <td className="r">{money(m.neto, p.moneda)}</td>
                              <td className="r vt-verde">{money(m.monto, p.moneda)}</td>
                              <td>{mesCorto(m.mes)}</td>
                              <td>{est}</td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
                <tfoot><tr><td colSpan={3}>Total</td><td className="r">{totalMonedas(tF)}</td><td /><td /><td className="r vt-verde">{totalMonedas(tCm)}</td><td colSpan={2} /></tr></tfoot>
              </table></div>
            </div>
          );
        }
        if (modelo === "compraventa") {
          const rs = ps.map((p) => resumenCV(p.cv));
          const tInv = rs.reduce((a, r) => a + r.inversion, 0);
          const tVen = rs.reduce((a, r) => a + r.venta, 0);
          const tGan = rs.reduce((a, r) => a + r.ganancia, 0);
          const tDias = rs.reduce((a, r) => a + (r.diasTotal || 0), 0);
          const conDias = rs.filter((r) => r.diasTotal != null);
          const promDias = conDias.length ? Math.round(conDias.reduce((a, r) => a + r.diasTotal, 0) / conDias.length) : null;
          const p0 = (v) => (v == null ? "—" : `${Math.round(v)}%`);
          return (
            <div key={e.id} className="mb-5">
              {cabecera(e, <ReglaTag>Venta − compra − arreglos · rentabilidad por días invertidos</ReglaTag>)}
              <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
                <Kpi label="Productos vendidos"><span style={{ fontSize: 20 }}>{ps.length}</span></Kpi>
                <Kpi label="Ganancia total"><span style={{ fontSize: 20, color: tGan >= 0 ? C.ok : C.danger }}>{money(tGan, "ARS")}</span></Kpi>
                <Kpi label="Retorno sobre lo invertido"><span style={{ fontSize: 20 }}>{tInv ? Math.round((tGan / tInv) * 100) : 0}%</span></Kpi>
                <Kpi label="Días promedio compra → venta"><span style={{ fontSize: 20 }}>{promDias ?? "—"}</span></Kpi>
                <Kpi label="Ganancia por día invertido" sub="ganancia total ÷ días totales"><span style={{ fontSize: 20 }}>{tDias ? money(tGan / tDias, "ARS") : "—"}</span></Kpi>
              </div>
              <div className="vt-tabla"><table>
                <thead><tr><th>N°</th><th>Producto</th><th className="r">Compra</th><th className="r">Arreglos</th><th className="r">Venta</th><th className="r">Ganancia</th><th className="r">Margen</th><th className="r">Retorno</th><th className="r">Días</th><th className="r">$ / día</th><th className="r">Retorno mensual</th><th>Cobro</th></tr></thead>
                <tbody>
                  {ps.map((p, i) => {
                    const r = rs[i];
                    return (
                      <tr key={p.num} {...fila(p)}>
                        <td><NumBadge n={p.num} /></td>
                        <td className="vt-cli"><b>{p.cliente}</b><small>{p.desc}</small></td>
                        <td className="r">{money(r.compra, "ARS")}</td>
                        <td className="r">{r.arreglos ? money(r.arreglos, "ARS") : "—"}</td>
                        <td className="r">{money(r.venta, "ARS")}</td>
                        <td className={`r ${r.ganancia >= 0 ? "vt-verde" : "vt-rojo"}`}>{money(r.ganancia, "ARS")}</td>
                        <td className="r">{p0(r.venta ? r.margen : null)}</td>
                        <td className="r">{p0(r.inversion ? r.roi : null)}</td>
                        <td className="r">{r.diasTotal ?? "—"}</td>
                        <td className="r">{r.gananciaDia == null ? "—" : money(r.gananciaDia, "ARS")}</td>
                        <td className="r">{p0(r.inversion ? r.roiMensual : null)}</td>
                        <td>{p.cv.cobrado ? <Pill tipo="ok">Cobrado</Pill> : <Pill tipo="pend">A cobrar</Pill>}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot><tr>
                  <td colSpan={2}>Total</td>
                  <td className="r" colSpan={2}>{money(tInv, "ARS")}</td>
                  <td className="r">{money(tVen, "ARS")}</td>
                  <td className="r vt-verde">{money(tGan, "ARS")}</td>
                  <td className="r">{tVen ? Math.round((tGan / tVen) * 100) : 0}%</td>
                  <td className="r">{tInv ? Math.round((tGan / tInv) * 100) : 0}%</td>
                  <td className="r">{promDias != null ? `${promDias} prom.` : "—"}</td>
                  <td className="r">{tDias ? money(tGan / tDias, "ARS") : "—"}</td>
                  <td colSpan={2} />
                </tr></tfoot>
              </table></div>
            </div>
          );
        }
        if (modelo === "propio") {
          const tPr = [], tCo = [], tG = [];
          let sP = 0, sG = 0;
          return (
            <div key={e.id} className="mb-5">
              {cabecera(e, <ReglaTag>Valor de tu hora $ {num(e.hora).toLocaleString("es-AR")}</ReglaTag>)}
              <div className="vt-tabla"><table>
                <thead><tr><th>N°</th><th>Cliente</th><th className="r">Precio</th><th className="r">Cobrado</th><th className="r">Horas</th><th className="r">Costo horas</th><th className="r">Otros costos</th><th className="r">Ganancia</th><th className="r">Margen</th></tr></thead>
                <tbody>
                  {ps.map((p) => {
                    const r = resumenPropio(p, e);
                    tPr.push([p.precio, p.moneda]); tCo.push([r.ch + r.co, p.moneda]); tG.push([r.gan, p.moneda]);
                    sP += aARS(p.precio, p.moneda, tc); sG += aARS(r.gan, p.moneda, tc);
                    return (
                      <tr key={p.num} {...fila(p)}>
                        <td><NumBadge n={p.num} /></td>
                        <td className="vt-cli"><b>{p.cliente}</b><small>{p.desc}</small></td>
                        <td className="r">{money(p.precio, p.moneda)}</td>
                        <td className="r">{money(r.cobrado, p.moneda)}</td>
                        <td className="r">{horasTot(p)} h</td>
                        <td className="r" style={{ color: C.danger }}>− {money(r.ch, p.moneda)}</td>
                        <td className="r" style={{ color: C.danger }}>{r.co ? `− ${money(r.co, p.moneda)}` : "—"}</td>
                        <td className={`r ${r.gan >= 0 ? "vt-verde" : "vt-rojo"}`}>{money(r.gan, p.moneda)}</td>
                        <td className="r">{Math.round(r.margen)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot><tr>
                  <td colSpan={2}>Total</td><td className="r">{totalMonedas(tPr)}</td><td colSpan={2} />
                  <td className="r" colSpan={2} style={{ color: C.danger }}>− {totalMonedas(tCo)}</td>
                  <td className="r vt-verde">{totalMonedas(tG)}</td>
                  <td className="r">{sP ? Math.round((sG / sP) * 100) : 0}%</td>
                </tr></tfoot>
              </table></div>
            </div>
          );
        }
        return (
          <div key={e?.id || "sin"} className="mb-5">
            {cabecera(e, null)}
            <div className="rounded-xl px-4 py-3 text-xs" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.soft }}>
              {e ? `${e.nombre} no tiene cálculo de ganancia. Podés elegir cómo ganás en esta empresa desde "Gestionar empresas".` : "Estos proyectos no tienen empresa asignada, así que no se calcula ganancia."}{" "}
              {ps.length} {ps.length === 1 ? "proyecto" : "proyectos"}: {ps.map((p) => `#${p.num} ${p.cliente}`).join(", ")}.
            </div>
          </div>
        );
      })}
    </>
  );
}
