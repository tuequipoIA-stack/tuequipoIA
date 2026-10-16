"use client";

import { Download } from "lucide-react";
import { C } from "@/lib/theme";
import { hoy0, hoyISO, diasDesde, fechaCorta, lunesDe, sumarDias } from "@/lib/fechas";
import { descargarCsv } from "@/lib/exportCsv";
import { EmpresaTag } from "@/components/empresas/EmpresasUI";

export const PERIODOS = [
  { id: "7", label: "Últimos 7 días" },
  { id: "30", label: "Últimos 30 días" },
  { id: "mes", label: "Este mes" },
  { id: "mesant", label: "Mes pasado" },
  { id: "90", label: "Últimos 3 meses" },
  { id: "todo", label: "Todo" },
];

// Tareas acumuladas dentro del período elegido y que coinciden con la búsqueda.
export function filtrarPeriodo(lista, periodo, busqueda) {
  const h = hoy0();
  const y = h.getFullYear();
  const m = h.getMonth();
  const q = (busqueda || "").trim().toLowerCase();
  return lista.filter((a) => {
    if (!a.hechoEn) return false;
    const [ay, am] = a.hechoEn.split("-").map(Number);
    let ok;
    if (periodo === "todo") ok = true;
    else if (periodo === "mes") ok = ay === y && am - 1 === m;
    else if (periodo === "mesant") ok = ay === (m ? y : y - 1) && am - 1 === (m ? m - 1 : 11);
    else ok = diasDesde(a.hechoEn) < Number(periodo);
    return ok && (!q || String(a.texto || "").toLowerCase().includes(q));
  });
}

const ordenar = (l) => [...l].sort((a, b) => b.hechoEn.localeCompare(a.hechoEn));

export default function TareasAcumuladas({ base, visibles, empresas, porId, filtro, periodo, setPeriodo, busqueda, setBusqueda }) {
  const v = ordenar(visibles);

  // Todas las semanas del rango (incluye las vacías), desde la más vieja hasta hoy
  const todasSem = [];
  if (v.length) {
    const fin = lunesDe(hoyISO());
    let d = lunesDe(v[v.length - 1].hechoEn);
    while (d <= fin && todasSem.length < 600) { todasSem.push(d); d = sumarDias(d, 7); }
  }
  const sinEmpresa = (a) => !porId(a.empresa);
  const porEmp = empresas.map((e) => ({ e, n: base.filter((a) => a.empresa === e.id).length })).sort((a, b) => b.n - a.n);
  const top = porEmp[0];
  const nSinBase = base.filter(sinEmpresa).length;
  const max = Math.max(1, nSinBase, ...porEmp.map((x) => x.n));

  const semanas = todasSem.slice(-10);
  const deSemana = (s) => v.filter((a) => lunesDe(a.hechoEn) === s);
  const maxS = Math.max(1, ...semanas.map((s) => deSemana(s).length));

  const exportar = () => {
    descargarCsv("tareas-acumuladas.csv", [
      ["Fecha", "Empresa", "Tarea", "Cargada por audio"],
      ...v.map((a) => [a.hechoEn, porId(a.empresa)?.nombre || "Sin empresa", a.texto, a.audio ? "Sí" : "No"]),
    ]);
  };

  const panel = { background: C.card, border: `1px solid ${C.line}` };
  const panelH = "text-[11px] font-bold uppercase tracking-wide mb-3";

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}
          className="flex-1 sm:flex-none sm:max-w-[190px] rounded-lg px-2.5 py-2 text-[13px] font-semibold outline-none"
          style={{ ...panel, color: C.ink }}>
          {PERIODOS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar en tareas realizadas…"
          className="flex-1 min-w-[180px] rounded-lg px-3 py-2 text-sm outline-none" style={{ ...panel, color: C.ink }} />
        <button onClick={exportar} className="rounded-lg px-3.5 py-2 text-[13px] font-bold flex items-center gap-1.5"
          style={{ border: "1.5px solid #1AABAA", color: C.tealDark, background: "transparent" }}>
          <Download size={14} /> Exportar a Excel
        </button>
      </div>

      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <div className="rounded-xl px-3.5 py-3" style={panel}>
          <b className="block text-2xl leading-tight" style={{ color: C.ink }}>{v.length}</b>
          <span className="text-[11px] font-semibold" style={{ color: C.muted }}>Tareas realizadas</span>
        </div>
        <div className="rounded-xl px-3.5 py-3" style={panel}>
          <b className="block text-2xl leading-tight" style={{ color: C.ink }}>
            {todasSem.length ? (v.length / todasSem.length).toFixed(1).replace(".", ",") : 0}
          </b>
          <span className="text-[11px] font-semibold" style={{ color: C.muted }}>Promedio por semana</span>
        </div>
        <div className="rounded-xl px-3.5 py-3" style={panel}>
          <b className="block text-lg leading-tight py-[3px] truncate" style={{ color: top && top.n ? top.e.color : C.ink }}>
            {top && top.n ? top.e.nombre : "—"}
          </b>
          <span className="text-[11px] font-semibold" style={{ color: C.muted }}>Empresa con más tareas</span>
        </div>
        <div className="rounded-xl px-3.5 py-3" style={panel}>
          <b className="block text-2xl leading-tight" style={{ color: C.ink }}>{v.filter((a) => a.audio).length}</b>
          <span className="text-[11px] font-semibold" style={{ color: C.muted }}>Cargadas por audio</span>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-[1fr_1.3fr]">
        <div className="rounded-xl px-4 py-3.5" style={panel}>
          <div className={panelH} style={{ color: C.muted }}>Realizadas por empresa</div>
          {porEmp.map(({ e, n }) => (
            <div key={e.id} className="flex items-center gap-2.5 mb-2.5 text-[13px]" style={{ opacity: filtro === "todas" || filtro === e.id ? 1 : 0.35 }}>
              <span className="w-24 font-semibold truncate" style={{ color: C.ink }}>{e.nombre}</span>
              <div className="flex-1 h-3 rounded-md overflow-hidden" style={{ background: C.chip }}>
                <div className="h-full rounded-md" style={{ width: `${(n / max) * 100}%`, background: e.color }} />
              </div>
              <span className="w-7 text-right font-bold tabular-nums" style={{ color: C.ink }}>{n}</span>
            </div>
          ))}
          {nSinBase > 0 && (
            <div className="flex items-center gap-2.5 mb-2.5 text-[13px]" style={{ opacity: filtro === "todas" || filtro === "sin" ? 1 : 0.35 }}>
              <span className="w-24 font-semibold truncate" style={{ color: C.ink }}>Sin empresa</span>
              <div className="flex-1 h-3 rounded-md overflow-hidden" style={{ background: C.chip }}>
                <div className="h-full rounded-md" style={{ width: `${(nSinBase / max) * 100}%`, background: C.soft }} />
              </div>
              <span className="w-7 text-right font-bold tabular-nums" style={{ color: C.ink }}>{nSinBase}</span>
            </div>
          )}
        </div>

        <div className="rounded-xl px-4 py-3.5" style={panel}>
          <div className={panelH} style={{ color: C.muted }}>Realizadas por semana</div>
          <div className="flex items-end gap-2 pt-1.5" style={{ height: 150 }}>
            {semanas.length ? semanas.map((s) => {
              const items = deSemana(s);
              const nSin = items.filter(sinEmpresa).length;
              return (
                <div key={s} className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-0">
                  <span className="text-[10px] font-bold" style={{ color: C.muted }}>{items.length}</span>
                  <div className="w-full flex flex-col-reverse rounded-[5px] overflow-hidden" style={{ maxWidth: 34, minHeight: 2, background: items.length ? "transparent" : C.chip }}>
                    {empresas.map((e) => {
                      const n = items.filter((a) => a.empresa === e.id).length;
                      return n ? <div key={e.id} title={`${e.nombre}: ${n}`} style={{ height: (n / maxS) * 110, background: e.color }} /> : null;
                    })}
                    {nSin > 0 && <div title={`Sin empresa: ${nSin}`} style={{ height: (nSin / maxS) * 110, background: C.soft }} />}
                  </div>
                  <small className="text-[9px] whitespace-nowrap" style={{ color: C.soft }}>{fechaCorta(s).slice(0, 5)}</small>
                </div>
              );
            }) : (
              <div className="w-full text-center text-[13px] py-6" style={{ color: C.soft }}>Sin datos en este período</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl mt-4" style={panel}>
        <div className="text-[11px] font-bold uppercase tracking-wide px-4 pt-3.5 pb-1.5" style={{ color: C.muted }}>
          Detalle{" "}
          <span className="font-semibold normal-case tracking-normal" style={{ color: C.soft }}>· {v.length} {v.length === 1 ? "tarea" : "tareas"}</span>
        </div>
        {v.length ? (
          <>
            {v.slice(0, 60).map((a) => (
              <div key={a.id} className="grid grid-cols-[70px_1fr] sm:grid-cols-[86px_120px_1fr] gap-x-2.5 gap-y-1 items-center px-4 py-2.5 text-[13px]"
                style={{ borderTop: `1px solid ${C.line}` }}>
                <span className="text-xs tabular-nums" style={{ color: C.soft }}>{fechaCorta(a.hechoEn)}</span>
                <span className="min-w-0"><EmpresaTag empresa={porId(a.empresa)} /></span>
                <span className="col-span-2 sm:col-span-1" style={{ color: C.ink }}>
                  {a.texto}
                  {a.audio && <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ml-1" style={{ background: C.chip, color: C.muted }}>🎙</span>}
                </span>
              </div>
            ))}
            {v.length > 60 && (
              <div className="text-center text-[13px] px-4 py-6" style={{ color: C.soft, borderTop: `1px solid ${C.line}` }}>
                Mostrando 60 de {v.length} · exportá para ver todo
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-[13px] px-4 py-6" style={{ color: C.soft }}>No hay tareas realizadas con estos filtros.</div>
        )}
      </div>
    </>
  );
}
