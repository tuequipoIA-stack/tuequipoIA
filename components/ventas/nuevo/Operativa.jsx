"use client";

import { C } from "@/lib/theme";
import { diasHasta, fechaCorta, mesKey } from "@/lib/fechas";
import { horasTot, proxHito, modeloDe } from "./calculos";
import { Kpi, NumBadge, Pill } from "./ui";

// Pestaña "Operativa": hitos, entregas y horas de cada proyecto, por empresa.
export default function Operativa({ grupos, lista, recien, onAbrir, cabecera }) {
  const atras = lista.flatMap((p) => p.hitos.filter((h) => h.estado !== "hecho" && h.f && diasHasta(h.f) < 0)).length;
  const entregas = lista.filter((p) => {
    const u = p.hitos[p.hitos.length - 1];
    return u && u.f && u.estado !== "hecho" && diasHasta(u.f) >= 0 && diasHasta(u.f) <= 30;
  }).length;
  const hMes = lista.flatMap((p) => p.horas).filter((h) => String(h.f).slice(0, 7) === mesKey(0)).reduce((a, h) => a + h.h, 0);

  return (
    <>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
        <Kpi label="Proyectos"><span style={{ fontSize: 20 }}>{lista.length}</span></Kpi>
        <Kpi label="Entregas en los próximos 30 días"><span style={{ fontSize: 20 }}>{entregas}</span></Kpi>
        <Kpi label="Hitos atrasados"><span style={{ fontSize: 20, color: atras ? C.danger : "inherit" }}>{atras}</span></Kpi>
        <Kpi label="Horas cargadas este mes"><span style={{ fontSize: 20 }}>{hMes} h</span></Kpi>
      </div>

      {grupos.map(({ empresa: e, proyectos: ps }) => {
        const color = e?.color || C.soft;
        return (
          <div key={e?.id || "sin"} className="mb-5">
            {cabecera(e, <small className="text-xs font-semibold" style={{ color: C.soft }}>{ps.length} {ps.length === 1 ? "proyecto" : "proyectos"}</small>)}
            <div className="vt-tabla">
              <table>
                <thead>
                  <tr>
                    <th>N°</th><th>Cliente</th><th>Avance</th><th>Próximo hito</th>
                    <th>{modeloDe(e) === "agencia" ? "Fin de campaña" : "Entrega"}</th><th className="r">Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {ps.map((p) => {
                    const hechos = p.hitos.filter((h) => h.estado === "hecho").length;
                    const pr = p.hitos.length ? hechos / p.hitos.length : 0;
                    const nx = proxHito(p);
                    const fin = p.hitos[p.hitos.length - 1];
                    const dnx = nx?.f ? diasHasta(nx.f) : 0;
                    const dfin = fin?.f ? diasHasta(fin.f) : 0;
                    return (
                      <tr key={p.num} className={`click ${recien.has(p.num) ? "vt-flash" : ""}`} onClick={() => onAbrir(p.num)} style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
                        <td><NumBadge n={p.num} /></td>
                        <td className="vt-cli"><b>{p.cliente || "Sin nombre"}</b><small>{p.desc}</small></td>
                        <td>
                          <div className="vt-prog"><div style={{ width: `${pr * 100}%`, background: color }} /></div>
                          <small style={{ color: C.soft, fontSize: 11 }}>{hechos}/{p.hitos.length} hitos</small>
                        </td>
                        <td>
                          {nx ? (
                            <>
                              <b>{nx.n}</b><br />
                              <small className={dnx < 0 ? "vt-rojo" : ""} style={{ fontSize: 12 }}>{dnx < 0 ? "Atrasado · " : ""}{fechaCorta(nx.f)}</small>
                            </>
                          ) : <Pill tipo="ok">Completo</Pill>}
                        </td>
                        <td>
                          {fin ? (
                            <>
                              {fechaCorta(fin.f)}<br />
                              <small style={{ color: C.soft, fontSize: 11 }}>{fin.estado === "hecho" ? "Entregado" : dfin >= 0 ? `en ${dfin} días` : "vencido"}</small>
                            </>
                          ) : "—"}
                        </td>
                        <td className="r">{horasTot(p)} h</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}
