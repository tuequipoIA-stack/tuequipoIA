"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BRAND, GASTO_CATEGORIAS } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid, isThisMonth, money } from "@/lib/helpers";
import CostosSection from "@/components/finanzas/CostosSection";

export default function FinanzasSection({ business }) {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [vista, setVista] = useState("movimientos");
  const [gastos, setGastos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [form, setForm] = useState({ fecha: new Date().toISOString().slice(0, 10), categoria: GASTO_CATEGORIAS[0], monto: "", nota: "" });

  useEffect(() => {
    if (!unidadId) return;
    loadData("gastos-registro", []).then(setGastos);
    loadData("ventas-registro", []).then(setVentas);
  }, [unidadId]);

  const agregar = async () => {
    if (!form.monto) return;
    const nuevo = { id: uid(), ...form, monto: Number(form.monto) };
    const actualizado = [nuevo, ...gastos];
    setGastos(actualizado);
    await saveData("gastos-registro", actualizado);
    setForm({ fecha: new Date().toISOString().slice(0, 10), categoria: GASTO_CATEGORIAS[0], monto: "", nota: "" });
  };

  const eliminar = async (id) => {
    const actualizado = gastos.filter((g) => g.id !== id);
    setGastos(actualizado);
    await saveData("gastos-registro", actualizado);
  };

  const ventasMes = ventas.filter((v) => isThisMonth(v.fecha)).reduce((s, v) => s + Number(v.precio || 0) * Number(v.cantidad || 1), 0);
  const gastosMes = gastos.filter((g) => isThisMonth(g.fecha)).reduce((s, g) => s + Number(g.monto || 0), 0);
  const ganancia = ventasMes - gastosMes;

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Finanzas</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">Ventas, gastos, costos y ganancia, todo junto.</p>

      <div className="flex gap-1.5 mb-5">
        <button onClick={() => setVista("movimientos")} className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={vista === "movimientos" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
          Movimientos
        </button>
        <button onClick={() => setVista("costos")} className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={vista === "costos" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
          Costos
        </button>
      </div>

      {vista === "costos" ? (
        <CostosSection business={business} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
              <span style={{ color: "#8a8578" }} className="text-xs">Ventas</span>
              <div style={{ color: BRAND.navy }} className="text-lg font-semibold">{money(ventasMes)}</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
              <span style={{ color: "#8a8578" }} className="text-xs">Gastos</span>
              <div style={{ color: "#b3453f" }} className="text-lg font-semibold">{money(gastosMes)}</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: BRAND.navy }}>
              <span style={{ color: "#8b8b9a" }} className="text-xs">Ganancia</span>
              <div style={{ color: ganancia >= 0 ? BRAND.teal : "#e08a86" }} className="text-lg font-semibold">{money(ganancia)}</div>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-2 flex-wrap" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
            <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }}>
              {GASTO_CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} placeholder="Monto"
              className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }} />
            <input value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} placeholder="Nota (opcional)"
              className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }} />
            <button onClick={agregar} className="rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 justify-center"
              style={{ background: BRAND.navy, color: BRAND.cream }}>
              <Plus size={14} /> Agregar gasto
            </button>
          </div>

          <div className="space-y-2">
            {gastos.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg p-3" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                <div>
                  <div style={{ color: BRAND.navy }} className="text-sm font-medium">{money(g.monto)} · {g.categoria}</div>
                  <div style={{ color: "#8a8578" }} className="text-xs">{g.fecha}{g.nota ? ` · ${g.nota}` : ""}</div>
                </div>
                <button onClick={() => eliminar(g.id)} style={{ color: "#b3453f" }}><Trash2 size={14} /></button>
              </div>
            ))}
            {gastos.length === 0 && <p style={{ color: "#8a8578" }} className="text-sm text-center py-6">Todavía no cargaste gastos.</p>}
          </div>
        </>
      )}
    </div>
  );
}
