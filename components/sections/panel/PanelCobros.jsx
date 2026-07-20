"use client";

import { BRAND } from "@/lib/constants";
import { money } from "@/lib/panel/constants";

export default function PanelCobros({ cobros, actualizarCobro, eliminarCobro }) {
  const totalAcordado = cobros.reduce((s, c) => s + (Number(c.monto) || 0), 0);
  const totalCobrado = cobros.filter((c) => c.estado === "cobrado").reduce((s, c) => s + (Number(c.monto) || 0), 0);
  const pendiente = totalAcordado - totalCobrado;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl p-4" style={{ background: BRAND.navy }}>
          <span style={{ color: "#8b8b9a" }} className="text-xs">Total confirmado</span>
          <div style={{ color: BRAND.teal }} className="text-2xl font-semibold">{money(totalAcordado)}</div>
          <div style={{ color: "#8b8b9a" }} className="text-[11px] mt-1">{cobros.length} proyecto(s)</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <span style={{ color: "#8a8578" }} className="text-xs">Cobrado</span>
          <div style={{ color: BRAND.navy }} className="text-2xl font-semibold">{money(totalCobrado)}</div>
          <div style={{ color: "#a89f88" }} className="text-[11px] mt-1">{totalAcordado ? Math.round((totalCobrado / totalAcordado) * 100) : 0}% del total</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <span style={{ color: "#8a8578" }} className="text-xs">Pendiente de cobro</span>
          <div style={{ color: BRAND.navy }} className="text-2xl font-semibold">{money(pendiente)}</div>
          <div style={{ color: "#a89f88" }} className="text-[11px] mt-1">a cobrar</div>
        </div>
      </div>

      <h3 style={{ color: BRAND.navy }} className="text-sm font-bold uppercase tracking-wide mb-2">Cobros — Proyectos Confirmados</h3>

      {cobros.length === 0 ? (
        <div className="rounded-xl p-8 text-center text-sm" style={{ background: "#ffffff", border: "1px solid #e4dfd3", color: "#8a8578" }}>
          Todavía no hay proyectos confirmados.
        </div>
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f7f4ed" }}>
                {["Cliente", "Monto", "Estado", "Próximo cobro", "Notas", "Acciones"].map((h) => (
                  <th key={h} style={{ color: "#8a8578" }} className="text-left text-[11px] uppercase font-semibold px-3 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cobros.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid #f0ece2" }}>
                  <td className="px-3 py-2 align-top">
                    <div style={{ color: BRAND.navy }} className="font-medium">{c.nombre}</div>
                    <div style={{ color: "#a89f88" }} className="text-[11px]">{c.empresa || ""}</div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input type="number" step="0.01" defaultValue={c.monto || 0}
                      onBlur={(e) => actualizarCobro(c.id, { monto: parseFloat(e.target.value) || 0 })}
                      className="w-28 rounded-md px-2 py-1 text-xs" style={{ border: "1px solid #e4dfd3" }} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <button
                      onClick={() => actualizarCobro(c.id, { estado: c.estado === "cobrado" ? "pendiente" : "cobrado" })}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={c.estado === "cobrado"
                        ? { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }
                        : { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}
                    >
                      {c.estado === "cobrado" ? "Cobrado" : "Aún no cobrado"}
                    </button>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input type="date" defaultValue={c.proximo_cobro || ""}
                      onBlur={(e) => actualizarCobro(c.id, { proximoCobro: e.target.value || null })}
                      className="rounded-md px-2 py-1 text-xs" style={{ border: "1px solid #e4dfd3" }} />
                  </td>
                  <td className="px-3 py-2 align-top max-w-[160px]">
                    <input type="text" defaultValue={c.notas || ""}
                      onBlur={(e) => actualizarCobro(c.id, { notas: e.target.value })}
                      className="w-full rounded-md px-2 py-1 text-xs" style={{ border: "1px solid #e4dfd3" }} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <button onClick={() => eliminarCobro(c.id)} className="text-[11px] font-bold px-2 py-1 rounded-md text-white" style={{ background: "#ef4444" }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
