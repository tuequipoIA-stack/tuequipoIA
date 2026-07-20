"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { BRAND, MONEDAS } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid, money } from "@/lib/helpers";
import MoneyInput from "@/components/MoneyInput";
import InsumosTab from "./InsumosTab";

const RECETA_VACIA = { insumoId: "", cantidad: "1" };
const inputStyle = { border: "1px solid #e4dfd3" };
const inputCls = "rounded-lg px-3 py-2 text-sm outline-none";

function simboloMoneda(id) {
  return MONEDAS.find((m) => m.id === id)?.simbolo || "$";
}

function ArmadorDeReceta({ insumos, ingredientes, onChange }) {
  const [nuevoIngrediente, setNuevoIngrediente] = useState(RECETA_VACIA);

  const total = ingredientes.reduce((s, ing) => s + Number(ing.costoUnitario || 0) * Number(ing.cantidad || 0), 0);

  const agregarIngrediente = () => {
    const insumo = insumos.find((i) => i.id === nuevoIngrediente.insumoId);
    if (!insumo || !nuevoIngrediente.cantidad) return;
    onChange([
      ...ingredientes,
      { insumoId: insumo.id, nombre: insumo.nombre, unidad: insumo.unidad, costoUnitario: insumo.costoUnitario, cantidad: Number(nuevoIngrediente.cantidad) },
    ]);
    setNuevoIngrediente(RECETA_VACIA);
  };

  const quitarIngrediente = (idx) => {
    onChange(ingredientes.filter((_, i) => i !== idx));
  };

  if (insumos.length === 0) {
    return <p style={{ color: "#a89f88" }} className="text-xs">Primero cargá insumos en la pestaña "Insumos" para poder armar una receta.</p>;
  }

  return (
    <div className="rounded-lg p-2.5" style={{ background: "#faf8f4", border: "1px dashed #e4dfd3" }}>
      <div className="flex gap-2 mb-2">
        <select value={nuevoIngrediente.insumoId} onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, insumoId: e.target.value })}
          className="rounded-lg px-2 py-1.5 text-xs outline-none flex-1" style={{ border: "1px solid #e4dfd3" }}>
          <option value="">Elegí un insumo...</option>
          {insumos.map((i) => <option key={i.id} value={i.id}>{i.nombre} ({money(i.costoUnitario)}/{i.unidad})</option>)}
        </select>
        <input type="number" min="0" value={nuevoIngrediente.cantidad}
          onChange={(e) => setNuevoIngrediente({ ...nuevoIngrediente, cantidad: e.target.value })}
          placeholder="Cant." className="rounded-lg px-2 py-1.5 text-xs outline-none w-16" style={{ border: "1px solid #e4dfd3" }} />
        <button onClick={agregarIngrediente} className="rounded-lg px-2 text-xs font-semibold" style={{ background: BRAND.teal, color: BRAND.navy }}>
          <Plus size={13} />
        </button>
      </div>

      {ingredientes.length > 0 && (
        <div className="space-y-1 mb-2">
          {ingredientes.map((ing, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs" style={{ color: "#4a4740" }}>
              <span>{ing.cantidad} {ing.unidad} de {ing.nombre}</span>
              <div className="flex items-center gap-2">
                <span>{money(ing.costoUnitario * ing.cantidad)}</span>
                <button onClick={() => quitarIngrediente(idx)} style={{ color: "#b3453f" }}><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {ingredientes.length > 0 && (
        <div className="flex items-center justify-between pt-1.5 text-xs font-semibold" style={{ borderTop: "1px solid #e4dfd3", color: BRAND.navy }}>
          <span>Costo de la receta</span>
          <span>{money(total)}</span>
        </div>
      )}
    </div>
  );
}

function ProductosTab({ business }) {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [costos, setCostos] = useState({ productos: [], fijos: [] });
  const [insumos, setInsumos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", costo: "", moneda: "ARS", cantidad: "1", fecha: new Date().toISOString().slice(0, 10) });
  const [nuevosIngredientes, setNuevosIngredientes] = useState([]);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    if (!unidadId) return;
    setLoaded(false);
    Promise.all([
      loadData("finanzas-costos", { productos: [], fijos: [] }),
      loadData("finanzas-insumos", []),
    ]).then(([c, i]) => { setCostos(c); setInsumos(i); setLoaded(true); });
  }, [unidadId]);

  const totalReceta = nuevosIngredientes.reduce((s, ing) => s + Number(ing.costoUnitario || 0) * Number(ing.cantidad || 0), 0);

  const agregarProducto = async () => {
    if (!nuevoProducto.nombre.trim()) return;
    const costoFinal = nuevoProducto.costo ? Number(nuevoProducto.costo) : totalReceta;
    if (!costoFinal) return;
    const item = {
      id: uid(),
      nombre: nuevoProducto.nombre.trim(),
      costo: costoFinal,
      moneda: nuevoProducto.moneda || "ARS",
      cantidad: Number(nuevoProducto.cantidad) || 0,
      fecha: nuevoProducto.fecha,
      ingredientes: nuevosIngredientes,
    };
    const actualizado = { ...costos, productos: [item, ...costos.productos] };
    setCostos(actualizado);
    await saveData("finanzas-costos", actualizado);
    setNuevoProducto({ nombre: "", costo: "", moneda: nuevoProducto.moneda, cantidad: "1", fecha: nuevoProducto.fecha });
    setNuevosIngredientes([]);
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

  const editarCosto = async (id, nuevoCosto) => {
    const actualizado = {
      ...costos,
      productos: costos.productos.map((p) => (p.id === id ? { ...p, costo: Number(nuevoCosto) || 0 } : p)),
    };
    setCostos(actualizado);
    await saveData("finanzas-costos", actualizado);
  };

  return (
    <div>
      <div className="rounded-xl p-3 mb-3 flex flex-col gap-2" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <input value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
          placeholder="Ej: Budín de limón" className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />

        <span style={{ color: "#8a8578" }} className="text-xs">Armá la receta (opcional) para calcular el costo solo:</span>
        <ArmadorDeReceta insumos={insumos} ingredientes={nuevosIngredientes} onChange={setNuevosIngredientes} />

        <div className="flex gap-2">
          <select value={nuevoProducto.moneda} onChange={(e) => setNuevoProducto({ ...nuevoProducto, moneda: e.target.value })}
            className="rounded-lg px-2 py-2 text-sm outline-none w-24 shrink-0" style={{ border: "1px solid #e4dfd3" }}>
            {MONEDAS.map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}
          </select>
          <MoneyInput value={nuevoProducto.costo} onChange={(n) => setNuevoProducto({ ...nuevoProducto, costo: n })}
            placeholder={totalReceta ? `Costo (sugerido: ${money(totalReceta)})` : "Costo"}
            className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }} />
          <input type="number" min="0" value={nuevoProducto.cantidad} onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value })}
            placeholder="Cantidad" className="rounded-lg px-3 py-2 text-sm outline-none w-24" style={{ border: "1px solid #e4dfd3" }} />
        </div>
        {totalReceta > 0 && !nuevoProducto.costo && (
          <p style={{ color: "#8a8578" }} className="text-[11px]">Si dejás el costo vacío, se usa el de la receta ({money(totalReceta)}). Podés escribir otro número si preferís uno distinto.</p>
        )}
        <div className="flex gap-2">
          <input type="date" value={nuevoProducto.fecha} onChange={(e) => setNuevoProducto({ ...nuevoProducto, fecha: e.target.value })}
            className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }} />
          <button onClick={agregarProducto} className="rounded-lg px-3 py-2 text-sm font-semibold flex items-center gap-1"
            style={{ background: BRAND.teal, color: BRAND.navy }}>
            <Plus size={14} /> Agregar producto
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {costos.productos.map((p) => {
          const abierto = expandido === p.id;
          const costoReceta = (p.ingredientes || []).reduce((s, ing) => s + Number(ing.costoUnitario || 0) * Number(ing.cantidad || 0), 0);
          return (
            <div key={p.id} className="rounded-lg overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div style={{ color: BRAND.navy }} className="text-sm truncate">{p.nombre}</div>
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: "#8a8578" }} className="text-xs">Costo ({p.moneda || "ARS"}):</span>
                    <MoneyInput value={p.costo} onChange={(n) => editarCosto(p.id, n)}
                      className="text-xs rounded px-1.5 py-0.5 w-20 outline-none" style={{ border: "1px solid #e4dfd3", color: BRAND.navy }} />
                    <span style={{ color: "#a89f88" }} className="text-xs">· {p.fecha || "sin fecha"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => cambiarCantidad(p.id, -1)} className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-semibold"
                    style={{ background: "#f0ece2", color: BRAND.navy }}>–</button>
                  <span style={{ color: BRAND.navy }} className="text-sm font-medium w-6 text-center">{p.cantidad ?? 1}</span>
                  <button onClick={() => cambiarCantidad(p.id, 1)} className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-semibold"
                    style={{ background: "#f0ece2", color: BRAND.navy }}>+</button>
                  {p.ingredientes?.length > 0 && (
                    <button onClick={() => setExpandido(abierto ? null : p.id)} style={{ color: "#8a8578" }}>
                      {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                  <button onClick={() => eliminarProducto(p.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
                </div>
              </div>
              {abierto && p.ingredientes?.length > 0 && (
                <div className="px-3 pb-2.5 text-xs" style={{ color: "#4a4740", background: "#faf8f4" }}>
                  <div style={{ color: "#8a8578" }} className="pt-2 pb-1">Receta:</div>
                  {p.ingredientes.map((ing, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{ing.cantidad} {ing.unidad} de {ing.nombre}</span>
                      <span>{money(ing.costoUnitario * ing.cantidad)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-1 mt-1" style={{ borderTop: "1px solid #e4dfd3" }}>
                    <span>Costo calculado de la receta</span>
                    <span>{money(costoReceta)}</span>
                  </div>
                  {costoReceta !== p.costo && (
                    <button onClick={() => editarCosto(p.id, costoReceta)} className="mt-2 text-xs font-semibold" style={{ color: "#127a79" }}>
                      Usar {money(costoReceta)} como costo actual
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {loaded && costos.productos.length === 0 && (
          <p style={{ color: "#8a8578" }} className="text-xs text-center py-3">Sin productos cargados.</p>
        )}
      </div>
    </div>
  );
}

function FijosTab() {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [costos, setCostos] = useState({ productos: [], fijos: [] });
  const [loaded, setLoaded] = useState(false);
  const [nuevoFijo, setNuevoFijo] = useState({ concepto: "", monto: "", fecha: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    if (!unidadId) return;
    setLoaded(false);
    loadData("finanzas-costos", { productos: [], fijos: [] }).then((d) => { setCostos(d); setLoaded(true); });
  }, [unidadId]);

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

  return (
    <div>
      <div className="rounded-xl p-3 mb-3 flex flex-col gap-2" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <input value={nuevoFijo.concepto} onChange={(e) => setNuevoFijo({ ...nuevoFijo, concepto: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && agregarFijo()} placeholder="Ej: Alquiler, Luz, Internet"
          className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
        <div className="flex gap-2">
          <MoneyInput value={nuevoFijo.monto} onChange={(n) => setNuevoFijo({ ...nuevoFijo, monto: n })}
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
  );
}

export default function CostosSection({ business }) {
  const { loadData, unidadId } = useUnidadStorage();
  const esServicios = business?.tipoNegocio === "servicios";
  const [vista, setVista] = useState("fijos");
  const [resumen, setResumen] = useState({ totalFijos: 0, valorInventario: 0 });

  useEffect(() => {
    if (!unidadId) return;
    loadData("finanzas-costos", { productos: [], fijos: [] }).then((c) => {
      setResumen({
        totalFijos: (c.fijos || []).reduce((s, f) => s + Number(f.monto || 0), 0),
        valorInventario: (c.productos || []).reduce((s, p) => s + Number(p.costo || 0) * Number(p.cantidad ?? 1), 0),
      });
    });
  }, [vista, unidadId]);

  return (
    <div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">
        {esServicios
          ? "Como vendés servicios, acá cargás tus costos fijos mensuales (no hay costo por unidad vendida)."
          : "Cargá tus insumos, armá el costo de cada producto con su receta, y tus costos fijos mensuales."}
      </p>

      <div className={`grid ${esServicios ? "grid-cols-1" : "grid-cols-2"} gap-3 mb-4`}>
        <div className="rounded-xl p-4" style={{ background: BRAND.navy }}>
          <span style={{ color: "#8b8b9a" }} className="text-xs">Costos fijos mensuales</span>
          <div style={{ color: BRAND.teal }} className="text-2xl font-semibold">{money(resumen.totalFijos)}</div>
        </div>
        {!esServicios && (
          <div className="rounded-xl p-4" style={{ background: BRAND.navy }}>
            <span style={{ color: "#8b8b9a" }} className="text-xs">Valor total del stock</span>
            <div style={{ color: BRAND.teal }} className="text-2xl font-semibold">{money(resumen.valorInventario)}</div>
          </div>
        )}
      </div>

      {esServicios ? (
        <FijosTab />
      ) : (
        <>
          <div className="flex gap-1.5 mb-4">
            <button onClick={() => setVista("fijos")} className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={vista === "fijos" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
              Costos fijos
            </button>
            <button onClick={() => setVista("productos")} className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={vista === "productos" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
              Productos
            </button>
            <button onClick={() => setVista("insumos")} className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={vista === "insumos" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
              Insumos
            </button>
          </div>

          {vista === "fijos" && <FijosTab />}
          {vista === "productos" && <ProductosTab business={business} />}
          {vista === "insumos" && <InsumosTab />}
        </>
      )}
    </div>
  );
}
