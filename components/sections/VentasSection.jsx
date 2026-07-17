"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid, isThisMonth, money } from "@/lib/helpers";

const OTRO = "__otro__";
const MESES_LABEL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// "2026-07-15" -> "2026-07"
const mesKey = (fechaStr) => (fechaStr || "").slice(0, 7);

function labelMes(clave) {
  const [anio, mes] = clave.split("-").map(Number);
  const anioActual = new Date().getFullYear();
  const nombre = MESES_LABEL[mes - 1] || clave;
  return anio === anioActual ? nombre : `${nombre} ${anio}`;
}

export default function VentasSection({ business }) {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [ventas, setVentas] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [fechaActiva, setFechaActiva] = useState(new Date().toISOString().slice(0, 10));
  const [fila, setFila] = useState({ productoId: "", productoLibre: "", cantidad: "1", precio: "" });
  const [catalogo, setCatalogo] = useState([]);
  const [mesesAbiertos, setMesesAbiertos] = useState({});

  const usaCatalogo = business?.tipoNegocio !== "servicios";

  useEffect(() => {
    if (!unidadId) return;
    setLoaded(false);
    loadData("ventas-registro", []).then((d) => { setVentas(d); setLoaded(true); });
    if (usaCatalogo) {
      loadData("finanzas-costos", { productos: [], fijos: [] }).then((c) => setCatalogo(c.productos || []));
    } else {
      setCatalogo([]);
    }
  }, [usaCatalogo, unidadId]);

  const productoElegido = catalogo.find((p) => p.id === fila.productoId);
  const mostrarLibre = !usaCatalogo || fila.productoId === OTRO || catalogo.length === 0;

  const agregar = async () => {
    const nombreProducto = mostrarLibre ? fila.productoLibre.trim() : productoElegido?.nombre;
    if (!nombreProducto || !fila.precio) return;
    const nuevo = {
      id: uid(),
      fecha: fechaActiva,
      producto: nombreProducto,
      cantidad: Number(fila.cantidad) || 1,
      precio: Number(fila.precio),
      ...(productoElegido ? { costoUnitario: Number(productoElegido.costo) || 0 } : {}),
    };
    const actualizado = [nuevo, ...ventas];
    setVentas(actualizado);
    await saveData("ventas-registro", actualizado);
    setFila({ productoId: "", productoLibre: "", cantidad: "1", precio: "" });
  };

  const eliminar = async (id) => {
    const actualizado = ventas.filter((v) => v.id !== id);
    setVentas(actualizado);
    await saveData("ventas-registro", actualizado);
  };

  const subtotalFila = (v) => Number(v.precio || 0) * Number(v.cantidad || 1);

  const totalMes = ventas.filter((v) => isThisMonth(v.fecha)).reduce((s, v) => s + subtotalFila(v), 0);

  // Margen real de este mes (solo cuenta las ventas ligadas a un producto con costo conocido).
  const ventasConCosto = ventas.filter((v) => isThisMonth(v.fecha) && v.costoUnitario != null);
  const margenMes = ventasConCosto.reduce((s, v) => s + (Number(v.precio || 0) - Number(v.costoUnitario || 0)) * Number(v.cantidad || 1), 0);

  const mesActualKey = mesKey(new Date().toISOString().slice(0, 10));

  // Mes en curso: se sigue mostrando día por día, como siempre.
  const ventasMesActual = ventas.filter((v) => mesKey(v.fecha) === mesActualKey);
  const porFecha = {};
  ventasMesActual.forEach((v) => {
    if (!porFecha[v.fecha]) porFecha[v.fecha] = [];
    porFecha[v.fecha].push(v);
  });
  const fechasOrdenadas = Object.keys(porFecha).sort((a, b) => (a < b ? 1 : -1));

  const fechaLabel = (f) => new Date(f + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });

  // Meses anteriores: se agrupan en un botón colapsable por mes.
  const porMesAnterior = {};
  ventas.forEach((v) => {
    const clave = mesKey(v.fecha);
    if (clave === mesActualKey) return;
    if (!porMesAnterior[clave]) porMesAnterior[clave] = [];
    porMesAnterior[clave].push(v);
  });
  const mesesAnterioresOrdenados = Object.keys(porMesAnterior).sort((a, b) => (a < b ? 1 : -1));

  const toggleMes = (clave) => setMesesAbiertos((prev) => ({ ...prev, [clave]: !prev[clave] }));

  // Agrupa las ventas de un mes por producto: cantidad y valor total por línea.
  const agruparPorProducto = (items) => {
    const porProducto = {};
    items.forEach((v) => {
      if (!porProducto[v.producto]) porProducto[v.producto] = { producto: v.producto, cantidad: 0, total: 0 };
      porProducto[v.producto].cantidad += Number(v.cantidad || 1);
      porProducto[v.producto].total += subtotalFila(v);
    });
    return Object.values(porProducto).sort((a, b) => b.total - a.total);
  };

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Ventas diarias</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">Cargá cada producto vendido, día por día.</p>

      <div className={`grid ${usaCatalogo && ventasConCosto.length > 0 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-3 mb-5`}>
        <div className="rounded-xl p-4" style={{ background: BRAND.navy }}>
          <span style={{ color: "#8b8b9a" }} className="text-xs">Total vendido este mes</span>
          <div style={{ color: BRAND.teal }} className="text-2xl font-semibold">{money(totalMes)}</div>
        </div>
        {usaCatalogo && ventasConCosto.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
            <span style={{ color: "#8a8578" }} className="text-xs">Margen real del mes (sobre productos con costo cargado)</span>
            <div style={{ color: margenMes >= 0 ? "#127a79" : "#b3453f" }} className="text-2xl font-semibold">{money(margenMes)}</div>
          </div>
        )}
      </div>

      <div className="rounded-xl p-4 mb-6" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-2">Fecha de la venta</span>
        <input type="date" value={fechaActiva} onChange={(e) => setFechaActiva(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          {usaCatalogo && catalogo.length > 0 ? (
            <select value={fila.productoId} onChange={(e) => setFila({ ...fila, productoId: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }}>
              <option value="">Elegí un producto...</option>
              {catalogo.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              <option value={OTRO}>Otro (escribir)...</option>
            </select>
          ) : null}
          {mostrarLibre && (
            <input value={fila.productoLibre} onChange={(e) => setFila({ ...fila, productoLibre: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && agregar()} placeholder="Producto"
              className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }} />
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="number" min="1" value={fila.cantidad} onChange={(e) => setFila({ ...fila, cantidad: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && agregar()} placeholder="Unidades"
            className="rounded-lg px-3 py-2 text-sm outline-none sm:w-24" style={{ border: "1px solid #e4dfd3" }} />
          <input type="number" value={fila.precio} onChange={(e) => setFila({ ...fila, precio: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && agregar()} placeholder="Precio unitario"
            className="rounded-lg px-3 py-2 text-sm outline-none sm:w-32" style={{ border: "1px solid #e4dfd3" }} />
          <button onClick={agregar} className="rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 justify-center"
            style={{ background: BRAND.teal, color: BRAND.navy }}>
            <Plus size={14} /> Agregar
          </button>
        </div>
        {productoElegido && (
          <p style={{ color: "#a89f88" }} className="text-[11px] mt-2">
            Costo cargado en Finanzas para este producto: {money(productoElegido.costo)}. El precio de venta lo elegís vos, libremente.
          </p>
        )}
      </div>

      {loaded && ventas.length === 0 && (
        <div className="rounded-xl p-6 text-center mb-4" style={{ background: "#ffffff", border: "1px dashed #d8d2c3" }}>
          <ShoppingCart size={20} color="#b3ab98" className="mx-auto mb-2" />
          <p style={{ color: "#8a8578" }} className="text-sm">Todavía no cargaste ventas.</p>
        </div>
      )}

      {loaded && ventas.length > 0 && fechasOrdenadas.length === 0 && (
        <p style={{ color: "#a89f88" }} className="text-sm mb-4">Todavía no cargaste ventas este mes.</p>
      )}

      <div className="space-y-4 mb-4">
        {fechasOrdenadas.map((fecha) => {
          const items = porFecha[fecha];
          const totalUnidades = items.reduce((s, v) => s + Number(v.cantidad || 1), 0);
          const totalDia = items.reduce((s, v) => s + subtotalFila(v), 0);
          return (
            <div key={fecha} className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "#f0ece2" }}>
                <span style={{ color: BRAND.navy }} className="text-sm font-semibold capitalize">{fechaLabel(fecha)}</span>
                <span style={{ color: "#6b6759" }} className="text-xs">{fecha}</span>
              </div>
              <div>
                {items.map((v) => (
                  <div key={v.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #f0ece2" }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: BRAND.navy }} className="text-sm">{v.producto}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#f0ece2", color: "#6b6759" }}>×{v.cantidad || 1}</span>
                      {v.costoUnitario != null && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#eef7f6", color: "#127a79" }}>
                          margen {money((v.precio - v.costoUnitario) * (v.cantidad || 1))}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ color: "#8a8578" }} className="text-xs">{money(v.precio)} c/u</span>
                      <span style={{ color: BRAND.navy }} className="text-sm font-medium w-20 text-right">{money(subtotalFila(v))}</span>
                      <button onClick={() => eliminar(v.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: BRAND.navy }}>
                <span style={{ color: "#8b8b9a" }} className="text-xs">{totalUnidades} {totalUnidades === 1 ? "unidad" : "unidades"}</span>
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
              const totalUnidadesMes = items.reduce((s, v) => s + Number(v.cantidad || 1), 0);
              const totalMesAnterior = items.reduce((s, v) => s + subtotalFila(v), 0);

              // Dentro del mes, agrupado por día (más reciente primero) y,
              // dentro de cada día, por producto.
              const porDiaDelMes = {};
              items.forEach((v) => {
                if (!porDiaDelMes[v.fecha]) porDiaDelMes[v.fecha] = [];
                porDiaDelMes[v.fecha].push(v);
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
                    <div className="flex items-center gap-3">
                      <span style={{ color: "#6b6759" }} className="text-xs">{totalUnidadesMes} {totalUnidadesMes === 1 ? "unidad" : "unidades"}</span>
                      <span style={{ color: BRAND.navy }} className="text-sm font-semibold">{money(totalMesAnterior)}</span>
                    </div>
                  </button>
                  {abierto && (
                    <div className="p-3 space-y-3" style={{ background: "#faf8f4" }}>
                      {diasDelMes.map((fecha) => {
                        const itemsDia = porDiaDelMes[fecha];
                        const lineasDia = agruparPorProducto(itemsDia);
                        const totalUnidadesDia = itemsDia.reduce((s, v) => s + Number(v.cantidad || 1), 0);
                        const totalDia = itemsDia.reduce((s, v) => s + subtotalFila(v), 0);
                        return (
                          <div key={fecha} className="rounded-lg overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                            <div className="px-3 py-2 flex items-center justify-between" style={{ background: "#f0ece2" }}>
                              <span style={{ color: BRAND.navy }} className="text-xs font-semibold capitalize">{fechaLabel(fecha)}</span>
                              <span style={{ color: "#6b6759" }} className="text-xs">{fecha}</span>
                            </div>
                            {lineasDia.map((l) => (
                              <div key={l.producto} className="flex items-center justify-between px-3 py-1.5" style={{ borderTop: "1px solid #f0ece2" }}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span style={{ color: BRAND.navy }} className="text-xs truncate">{l.producto}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: "#f0ece2", color: "#6b6759" }}>×{l.cantidad}</span>
                                </div>
                                <span style={{ color: "#4a4740" }} className="text-xs shrink-0">{money(l.total)}</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between px-3 py-1.5" style={{ borderTop: "1px solid #f0ece2" }}>
                              <span style={{ color: "#8a8578" }} className="text-[11px]">{totalUnidadesDia} {totalUnidadesDia === 1 ? "unidad" : "unidades"}</span>
                              <span style={{ color: BRAND.navy }} className="text-xs font-semibold">{money(totalDia)}</span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: BRAND.navy }}>
                        <span style={{ color: "#8b8b9a" }} className="text-xs">Total del mes ({totalUnidadesMes} {totalUnidadesMes === 1 ? "unidad" : "unidades"})</span>
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
    </div>
  );
}
