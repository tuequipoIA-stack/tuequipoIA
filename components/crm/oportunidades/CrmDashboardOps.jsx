"use client";

import { C } from "@/lib/theme";
import { relISO, diasDesde, lunesDe, sumarDias } from "@/lib/fechas";
import { ETAPAS, ETAPAS_ABIERTAS, SIN_EMPRESA, enCurso, enUSD, money } from "./comun";
import { Kpi, Dot } from "./Piezas";

const PANEL = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px" };

function PanelH({ children, extra }) {
  return (
    <div className="flex justify-between uppercase mb-3" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", color: C.muted }}>
      <span>{children}</span>
      {extra && <small className="normal-case" style={{ letterSpacing: 0, color: C.soft, fontWeight: 600 }}>{extra}</small>}
    </div>
  );
}

const Track = ({ children }) => (
  <div className="flex-1 flex overflow-hidden" style={{ height: 14, background: C.chip, borderRadius: 7 }}>{children}</div>
);

// Cálculos del dashboard (se usan también para exportar)
export function calcularDashboard({ ops, filtro, periodo, tc, gruposEmpresa }) {
  const lim = periodo === "todo" ? 1e9 : +periodo;
  const base = ops.filter((o) => filtro === "todas" || (filtro === "sin" ? !o.empresa : o.empresa === filtro));
  const cerradas = base.filter((o) => !enCurso(o) && o.cerradaEn && diasDesde(o.cerradaEn) < lim);
  const ganadas = cerradas.filter((o) => o.etapa === "ganado");
  const curso = base.filter(enCurso);
  const conv = base.flatMap((o) => o.conv.filter((c) => c.f && diasDesde(c.f) < lim).map((c) => ({ ...c, empresa: o.empresa })));
  return {
    base, cerradas, ganadas, curso, conv,
    tasa: cerradas.length ? Math.round((ganadas.length / cerradas.length) * 100) : null,
    valGan: ganadas.reduce((a, o) => a + enUSD(o, tc), 0),
    valCur: curso.reduce((a, o) => a + enUSD(o, tc), 0),
    ponderado: curso.reduce((a, o) => a + (enUSD(o, tc) * (Number(o.prob) || 0)) / 100, 0),
    grupos: gruposEmpresa,
  };
}

export default function CrmDashboardOps({ datos, tc }) {
  const { ganadas, curso, conv, tasa, valGan, valCur, ponderado, cerradas, grupos } = datos;
  const idDe = (e) => e.id || null;

  // Por empresa: barras apiladas por etapa
  const maxE = Math.max(1, ...grupos.map((e) => curso.filter((o) => (o.empresa || null) === idDe(e)).length));
  // Embudo
  const emb = [...ETAPAS_ABIERTAS, "ganado"];
  const listaEt = (et) => (et === "ganado" ? ganadas : curso.filter((o) => o.etapa === et));
  const maxEmb = Math.max(1, ...emb.map((e) => listaEt(e).length));
  // Semanas
  const semanas = [];
  {
    let s = lunesDe(relISO(0));
    for (let i = 0; i < 10; i++) { semanas.unshift(s); s = sumarDias(s, -7); }
  }
  const convSem = (s) => conv.filter((c) => lunesDe(c.f) === s);
  const maxS = Math.max(1, ...semanas.map((s) => convSem(s).length));

  return (
    <div>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
        <Kpi label="En curso" valor={curso.length} />
        <Kpi label="Valor en juego (USD aprox.)" valor={money(valCur, "USD")} style={{ fontSize: 17 }} />
        <Kpi label="Pronóstico ponderado" valor={money(ponderado, "USD")} style={{ fontSize: 17, color: C.tealDark }} />
        <Kpi label="Ganadas en el período" valor={ganadas.length} style={{ color: C.ok }} />
        <Kpi label="Valor ganado" valor={money(valGan, "USD")} style={{ fontSize: 17 }} />
        <Kpi label="% de cierre" valor={cerradas.length ? `${tasa}%` : "—"} />
      </div>
      <div className="mb-3" style={{ fontSize: 11, color: C.soft }}>Los montos en pesos se convierten a USD con un tipo de cambio de $ {Number(tc).toLocaleString("es-AR")} (se edita en Ventas).</div>
      <div className="crmop-dgrid">
        <div style={PANEL}>
          <PanelH>Oportunidades en curso por empresa</PanelH>
          {grupos.length ? grupos.map((e) => {
            const l = curso.filter((o) => (o.empresa || null) === idDe(e));
            return (
              <div key={e.id || "sin"} className="flex items-center gap-2.5 mb-2.5 text-[13px]">
                <span className="flex items-center gap-1.5 truncate" style={{ width: 118, fontWeight: 600, color: C.ink }}><Dot color={e.color} /> <span className="truncate">{e.nombre}</span></span>
                <Track>
                  {ETAPAS_ABIERTAS.map((et) => {
                    const n = l.filter((o) => o.etapa === et).length;
                    return n ? <div key={et} title={`${ETAPAS[et].l}: ${n}`} style={{ height: "100%", width: `${(n / maxE) * 100}%`, background: ETAPAS[et].bar }} /> : null;
                  })}
                </Track>
                <span className="text-right" style={{ minWidth: 30, fontWeight: 700, fontSize: 12, fontVariantNumeric: "tabular-nums", color: C.ink }}>{l.length}</span>
              </div>
            );
          }) : <div className="text-[13px] py-4" style={{ color: C.soft }}>Sin datos</div>}
          <div className="flex gap-3 flex-wrap mt-1" style={{ fontSize: 11, color: C.muted }}>
            {ETAPAS_ABIERTAS.map((e) => <span key={e} className="flex gap-1.5 items-center"><Dot color={ETAPAS[e].bar} />{ETAPAS[e].l}</span>)}
          </div>
        </div>

        <div style={PANEL}>
          <PanelH extra="valor en USD aprox.">Embudo</PanelH>
          {emb.map((e) => {
            const l = listaEt(e);
            return (
              <div key={e} className="mb-2.5">
                <div className="flex justify-between mb-1" style={{ fontSize: 12, color: C.ink }}>
                  <span>{ETAPAS[e].l}</span>
                  <b>{l.length} <small style={{ color: C.soft, fontWeight: 600 }}>· {money(l.reduce((a, o) => a + enUSD(o, tc), 0), "USD")}</small></b>
                </div>
                <Track><div style={{ height: "100%", width: `${(l.length / maxEmb) * 100}%`, background: ETAPAS[e].bar }} /></Track>
              </div>
            );
          })}
        </div>

        <div style={{ ...PANEL, gridColumn: "1/-1" }}>
          <PanelH extra={`${conv.length} en el período`}>Conversaciones por semana</PanelH>
          <div className="flex items-end gap-2" style={{ height: 140 }}>
            {semanas.map((s) => {
              const it = convSem(s);
              return (
                <div key={s} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.muted }}>{it.length}</span>
                  <div className="w-full flex flex-col-reverse overflow-hidden" style={{ maxWidth: 30, borderRadius: 5, minHeight: 2 }}>
                    {grupos.map((e) => {
                      const n = it.filter((c) => (c.empresa || null) === idDe(e)).length;
                      return n ? <div key={e.id || "sin"} style={{ height: (n / maxS) * 100, background: e.color }} /> : null;
                    })}
                  </div>
                  <small style={{ fontSize: 9, color: C.soft }}>{s.slice(8, 10)}/{s.slice(5, 7)}</small>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 flex-wrap mt-1" style={{ fontSize: 11, color: C.muted }}>
            {grupos.map((e) => <span key={e.id || "sin"} className="flex gap-1.5 items-center"><Dot color={e.color} />{e.nombre}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export { SIN_EMPRESA };
