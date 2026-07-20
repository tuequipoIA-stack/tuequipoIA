"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { BRAND, GASTO_CATEGORIAS, GASTO_TIPOS } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid, isThisMonth, money } from "@/lib/helpers";
import CostosSection from "@/components/finanzas/CostosSection";
import AudioAyuda from "@/components/AudioAyuda";
import { AUDIO_GUIONES, AUDIO_ARCHIVOS } from "@/lib/audioGuiones";

const MESES_LABEL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const mesKey = (fechaStr) => (fechaStr || "").slice(0, 7);
function labelMes(clave) {
  const [anio, mes] = clave.split("-").map(Number);
  const anioActual = new Date().getFullYear();
  const nombre = MESES_LABEL[mes - 1] || clave;
  return anio === anioActual ? nombre : `${nombre} ${anio}`;
}
const fechaLabel = (f) => new Date(f + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
const tipoLabel = (id) => GASTO_TIPOS.find((t) => t.id === id)?.label || "Variable";

export default function FinanzasSection({ business }) {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [vista, setVista] = useState("movimientos");
  const [gastos, setGastos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [mesesAbiertos, setMesesAbiertos] = useState({});
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10), categoria: GASTO_CATEGORIAS[0], tipo: "variable", monto: "", nota: "",
  });

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
    setForm({ fecha: new Date().toISOString().slice(0, 10), categoria: GASTO_CATEGORIAS[0], tipo: "variable", monto: "", nota: "" });
  };

  const eliminar = async (id) => {
    const actualizado = gastos.filter((g) => g.id !== id);
    setGastos(actualizado);
    await saveData("gastos-registro", actualizado);
  };

  const ventasMes = ventas.filter((v) => isThisMonth(v.fecha)).reduce((s, v) => s + Number(v.precio || 0) * Number(v.cantidad || 1), 0);
  const gastosMesArr = gastos.filter((g) => isThisMonth(g.fecha));
  const gastosMes = gastosMesArr.reduce((s, g) => s + Number(g.monto || 0), 0);
  const gastosFijosMes = gastosMesArr.filter((g) => (g.tipo || "variable") === "fijo").reduce((s, g) => s + Number(g.monto || 0), 0);
  const gastosVariablesMes = gastosMes - gastosFijosMes;
  const ganancia = ventasMes - gastosMes;

  const agruparPorCategoria = (items) => {
    const porCategoria = {};
    items.forEach((g) => {
      const key = g.categoria || "Otro";
      if (!porCategoria[key]) porCategoria[key] = { categoria: key, monto: 0, fijo: 0, variable: 0 };
      porCategoria[key].monto += Number(g.monto || 0);
      porCategoria[key][(g.tipo || "variable") === "fijo" ? "fijo" : "variable"] += Number(g.monto || 0);
    });
    return Object.values(porCategoria).sort((a, b) => b.monto - a.monto);
  };

  const mesActualKey = mesKey(new Date().toISOString().slice(0, 10));
  const gastosMesActual = gastos.filter((g) => mesKey(g.fecha) === mesActualKey);
  const porFecha = {};
  gastosMesActual.forEach((g) => {
    if (!porFecha[g.fecha]) porFecha[g.fecha] = [];
    porFecha[g.fecha].push(g);
  });
  const fechasOrdenadas = Object.keys(porFecha).sort((a, b) => (a < b ? 1 : -1));

  const porMesAnterior = {};
  gastos.forEach((g) => {
    const clave = mesKey(g.fecha);
    if (clave === mesActualKey) return;
    if (!porMesAnterior[clave]) porMesAnterior[clave] = [];
    porMesAnterior[clave].push(g);
  });
  const mesesAnterioresOrdenados = Object.keys(porMesAnterior).sort((a, b) => (a < b ? 1 : -1));
  const toggleMes = (clave) => setMesesAbiertos((prev) => ({ ...prev, [clave]: !prev[clave] }));

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold">Finanzas</h2>
        <AudioAyuda texto={AUDIO_GUIONES[`finanzas:${vista}`]} audioSrc={AUDIO_ARCHIVOS.finanzas} />
      </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl p-3" style={{ background: "#faf8f4", border: "1px solid #f0ece2" }}>
              <span style={{ color: "#8a8578" }} className="text-xs">Gastos fijos del mes</span>
              <div style={{ color: "#6b6759" }} className="text-base font-semibold">{money(gastosFijosMes)}</div>
            </div>
            <div className="rounded-xl p-3" style={{ background: "#faf8f4", border: "1px solid #f0ece2" }}>
              <span style={{ color: "#8a8578" }} className="text-xs">Gastos variables del mes</span>
              <div style={{ color: "#6b6759" }} className="text-base font-semibold">{money(gastosVariablesMes)}</div>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-2 flex-wrap" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
            <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }}>
              {GASTO_CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <div className="flex gap-1.5">
              {GASTO_TIPOS.map((t) => (
                <button key={t.id} type="button" onClick={() => setForm({ ...form, tipo: t.id })}
                  className="rounded-lg px-3 py-2 text-xs font-semibold"
                  style={form.tipo === t.id ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
                  {t.label}
                </button>
              ))}
            </div>
            <input type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} placeholder="Monto"
              className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }} />
            <input value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} placeholder="Nota (opcional)"
              className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }} />
            <button onClick={agregar} className="rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 justify-center"
              style={{ background: BRAND.navy, color: BRAND.cream }}>
              <Plus size={14} /> Agregar gasto
            </button>
          </div>

          {gastos.length === 0 && <p style={{ color: "#8a8578" }} className="text-sm text-center py-6">Todavía no cargaste gastos.</p>}

          {gastos.length > 0 && fechasOrdenadas.length === 0 && (
            <p style={{ color: "#a89f88" }} className="text-sm mb-4">Todavía no cargaste gastos este mes.</p>
          )}

          <div className="space-y-3 mb-4">
            {fechasOrdenadas.map((fecha) => {
              const items = porFecha[fecha];
              const totalDia = items.reduce((s, g) => s + Number(g.monto || 0), 0);
              return (
                <div key={fecha} className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                  <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "#f0ece2" }}>
                    <span style={{ color: BRAND.navy }} className="text-sm font-semibold capitalize">{fechaLabel(fecha)}</span>
                    <span style={{ color: "#6b6759" }} className="text-xs">{fecha}</span>
                  </div>
                  <div>
                    {items.map((g) => (
                      <div key={g.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #f0ece2" }}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: BRAND.navy }} className="text-sm font-medium">{g.categoria}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded"
                              style={(g.tipo || "variable") === "fijo" ? { background: "#f0ece2", color: "#6b6759" } : { background: "#eef7f6", color: "#127a79" }}>
                              {tipoLabel(g.tipo)}
                            </span>
                          </div>
                          {g.nota && <div style={{ color: "#8a8578" }} className="text-xs">{g.nota}</div>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span style={{ color: "#b3453f" }} className="text-sm font-medium">{money(g.monto)}</span>
                          <button onClick={() => eliminar(g.id)} style={{ color: "#b3453f" }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-end" style={{ background: BRAND.navy }}>
                    <span style={{ color: BRAND.teal }} className="text-sm font-semibold">{money(totalDia)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {mesesAnterioresOrdenados.length > 0 && (
            <div>
              <div style={{ color: "#8a8578" }} className="text-xs font-semibold uppercase tracking-wide mb-2">Meses anteriores</div>
              <div className="space-y-2">
                {mesesAnterioresOrdenados.map((clave) => {
                  const items = porMesAnterior[clave];
                  const abierto = !!mesesAbiertos[clave];
                  const totalMesAnterior = items.reduce((s, g) => s + Number(g.monto || 0), 0);

                  const porDiaDelMes = {};
                  items.forEach((g) => {
                    if (!porDiaDelMes[g.fecha]) porDiaDelMes[g.fecha] = [];
                    porDiaDelMes[g.fecha].push(g);
                  });
                  const diasDelMes = Object.keys(porDiaDelMes).sort((a, b) => (a < b ? 1 : -1));

                  return (
                    <div key={clave} className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                      <button onClick={() => toggleMes(clave)}
                        className="w-full flex items-center justify-between px-4 py-3" style={{ background: "#f0ece2" }}>
                        <div className="flex items-center gap-2">
                          {abierto ? <ChevronUp size={15} color={BRAND.navy} /> : <ChevronDown size={15} color={BRAND.navy} />}
                          <span style={{ color: BRAND.navy }} className="text-sm font-semibold capitalize">{labelMes(clave)}</span>
                        </div>
                        <span style={{ color: "#b3453f" }} className="text-sm font-semibold">{money(totalMesAnterior)}</span>
                      </button>
                      {abierto && (
                        <div className="p-3 space-y-3" style={{ background: "#faf8f4" }}>
                          {diasDelMes.map((fecha) => {
                            const itemsDia = porDiaDelMes[fecha];
                            const lineasDia = agruparPorCategoria(itemsDia);
                            const totalDia = itemsDia.reduce((s, g) => s + Number(g.monto || 0), 0);
                            return (
                              <div key={fecha} className="rounded-lg overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                                <div className="px-3 py-2 flex items-center justify-between" style={{ background: "#f0ece2" }}>
                                  <span style={{ color: BRAND.navy }} className="text-xs font-semibold capitalize">{fechaLabel(fecha)}</span>
                                  <span style={{ color: "#6b6759" }} className="text-xs">{fecha}</span>
                                </div>
                                {lineasDia.map((l) => (
                                  <div key={l.categoria} className="flex items-center justify-between px-3 py-1.5" style={{ borderTop: "1px solid #f0ece2" }}>
                                    <span style={{ color: BRAND.navy }} className="text-xs truncate">{l.categoria}</span>
                                    <span style={{ color: "#4a4740" }} className="text-xs">{money(l.monto)}</span>
                                  </div>
                                ))}
                                <div className="flex items-center justify-end px-3 py-1.5" style={{ borderTop: "1px solid #f0ece2" }}>
                                  <span style={{ color: BRAND.navy }} className="text-xs font-semibold">{money(totalDia)}</span>
                                </div>
                              </div>
                            );
                          })}
                          <div className="flex items-center justify-end rounded-lg px-3 py-2.5" style={{ background: BRAND.navy }}>
                            <span style={{ color: BRAND.teal }} className="text-sm font-semibold">{money(totalMesAnterior)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
