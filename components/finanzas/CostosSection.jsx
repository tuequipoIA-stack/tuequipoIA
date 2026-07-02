"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { loadData, saveData } from "@/lib/storage";
import { uid, money } from "@/lib/helpers";

export default function CostosSection() {
  const [costos, setCostos] = useState({ productos: [], fijos: [] });
  const [loaded, setLoaded] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", costo: "", cantidad: "1", fecha: new Date().toISOString().slice(0, 10) });
  const [nuevoFijo, setNuevoFijo] = useState({ concepto: "", monto: "", fecha: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    loadData("finanzas-costos", { productos: [], fijos: [] }).then((d) => { setCostos(d); setLoaded(true); });
  }, []);

  const agregarProducto = async () => {
    if (!nuevoProducto.nombre.trim() || !nuevoProducto.costo) return;
    const item = {
      id: uid(),
      nombre: nuevoProducto.nombre.trim(),
      costo: Number(nuevoProducto.costo),
      cantidad: Number(nuevoProducto.cantidad) || 0,
      fecha: nuevoProducto.fecha,
    };
    const actualizado = { ...costos, productos: [item, ...costos.productos] };
    setCostos(actualizado);
    await saveData("finanzas-costos", actualizado);
    setNuevoProducto({ nombre: "", costo: "", cantidad: "1", fecha: nuevoProducto.fecha });
  };

  const eliminarProducto = async (id) => {
    const actualizado = { ...costos, productos: costos.productos.filter((p) => p.id !== id) };
    setCostos(actualizado);
    await saveData("finanzas-costos", actualizado);
  };

  const cambiarCantidad = async (id, delta) => {
    const hoy = new Date().toISOString().slice(0, 10);
    const actualizado = {
      ...costos,
      productos: costos.productos.map((p) =>
        p.id === id ? { ...p, cantidad: Math.max(0, Number(p.cantidad || 0) + delta), fecha: hoy } : p
      ),
    };
    setCostos(actualizado);
    await saveData("finanzas-costos", actualizado);
  };

  const agregarFijo = async () => {
    if (!nuevoFijo.concepto.trim() || !nuevoFijo.monto) return;
    const item = { id: uid(), concepto: nuevoFijo.concepto.trim(), monto: Number(nuevoFijo.monto), fecha: nuevoFijo.fecha };
    const actualizado = { ...costos, fijos: [item, ...costos.fijos] };
    setCostos(actualizado);
    await saveData("finanzas-costos", actualizado);
    setNuevoFijo({ concepto: "", monto: "", fecha: nuevoFijo.fecha });
  };

  const eliminarFijo = async (id) => {
    const actualizado = { ...costos, fijos: costos.fijos.filter((f) => f.id !== id) };
    setCostos(actualizado);
    await saveData("finanzas-costos", actualizado);
  };

  const totalFijos = costos.fijos.reduce((s, f) => s + Number(f.monto || 0), 0);
  const valorInventario = costos.productos.reduce((s, p) => s + Number(p.costo || 0) * Number(p.cantidad ?? 1), 0);

  return (
    <div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">
        Cargá el costo, el stock y la fecha de cada producto (o variante) y tus costos fijos mensuales. Si vendés servicios, con los costos fijos alcanza.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-4" style={{ background: BRAND.navy }}>
          <span style={{ color: "#8b8b9a" }} className="text-xs">Costos fijos mensuales</span>
          <div style={{ color: BRAND.teal }} className="text-2xl font-semibold">{money(totalFijos)}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: BRAND.navy }}>
          <span style={{ color: "#8b8b9a" }} className="text-xs">Valor total del stock</span>
          <div style={{ color: BRAND.teal }} className="text-2xl font-semibold">{money(valorInventario)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Costos por producto */}
        <div>
          <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-2">Costos y cantidades por producto</div>
          <div className="rounded-xl p-3 mb-3 flex flex-col gap-2" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
            <input value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && agregarProducto()} placeholder="Ej: Remera XS azul"
              className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
            <div className="flex gap-2">
              <input type="number" value={nuevoProducto.costo} onChange={(e) => setNuevoProducto({ ...nuevoProducto, costo: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && agregarProducto()} placeholder="Costo"
                className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }} />
              <input type="number" min="0" value={nuevoProducto.cantidad} onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && agregarProducto()} placeholder="Cantidad"
                className="rounded-lg px-3 py-2 text-sm outline-none w-24" style={{ border: "1px solid #e4dfd3" }} />
            </div>
            <div className="flex gap-2">
              <input type="date" value={nuevoProducto.fecha} onChange={(e) => setNuevoProducto({ ...nuevoProducto, fecha: e.target.value })}
                className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }} />
              <button onClick={agregarProducto} className="rounded-lg px-3 py-2 text-sm font-semibold flex items-center gap-1"
                style={{ background: BRAND.teal, color: BRAND.navy }}>
                <Plus size={14} /> Agregar
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {costos.productos.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                <div>
                  <div style={{ color: BRAND.navy }} className="text-sm">{p.nombre}</div>
                  <div style={{ color: "#8a8578" }} className="text-xs">{money(p.costo)} c/u · {p.fecha || "sin fecha"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => cambiarCantidad(p.id, -1)} className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-semibold"
                    style={{ background: "#f0ece2", color: BRAND.navy }}>–</button>
                  <span style={{ color: BRAND.navy }} className="text-sm font-medium w-6 text-center">{p.cantidad ?? 1}</span>
                  <button onClick={() => cambiarCantidad(p.id, 1)} className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-semibold"
                    style={{ background: "#f0ece2", color: BRAND.navy }}>+</button>
                  <button onClick={() => eliminarProducto(p.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {loaded && costos.productos.length === 0 && (
              <p style={{ color: "#8a8578" }} className="text-xs text-center py-3">Sin productos cargados.</p>
            )}
          </div>
        </div>

        {/* Costos fijos */}
        <div>
          <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-2">Costos fijos</div>
          <div className="rounded-xl p-3 mb-3 flex flex-col gap-2" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
            <input value={nuevoFijo.concepto} onChange={(e) => setNuevoFijo({ ...nuevoFijo, concepto: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && agregarFijo()} placeholder="Ej: Alquiler, Luz, Internet"
              className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
            <div className="flex gap-2">
              <input type="number" value={nuevoFijo.monto} onChange={(e) => setNuevoFijo({ ...nuevoFijo, monto: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && agregarFijo()} placeholder="Monto mensual"
                className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }} />
              <input type="date" value={nuevoFijo.fecha} onChange={(e) => setNuevoFijo({ ...nuevoFijo, fecha: e.target.value })}
                className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
            </div>
            <button onClick={agregarFijo} className="rounded-lg px-3 py-2 text-sm font-semibold flex items-center gap-1 justify-center"
              style={{ background: BRAND.navy, color: BRAND.cream }}>
              <Plus size={14} /> Agregar
            </button>
          </div>
          <div className="space-y-2">
            {costos.fijos.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                <div>
                  <div style={{ color: BRAND.navy }} className="text-sm">{f.concepto}</div>
                  <div style={{ color: "#8a8578" }} className="text-xs">desde {f.fecha || "sin fecha"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#6b6759" }} className="text-sm font-medium">{money(f.monto)}</span>
                  <button onClick={() => eliminarFijo(f.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {loaded && costos.fijos.length === 0 && (
              <p style={{ color: "#8a8578" }} className="text-xs text-center py-3">Sin costos fijos cargados.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
