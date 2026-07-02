"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BRAND, UNIDADES_INSUMO } from "@/lib/constants";
import { loadData, saveData } from "@/lib/storage";
import { uid, money } from "@/lib/helpers";

// Catálogo de insumos/materias primas reutilizables entre recetas de
// productos (ej: "Harina" a $500/kg). Si sube el precio de un insumo, se
// actualiza acá una sola vez y las recetas que lo usan lo reflejan al
// recalcular (no se propaga solo — hay que tocar "Recalcular" en la receta).
export default function InsumosTab() {
  const [insumos, setInsumos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ nombre: "", unidad: UNIDADES_INSUMO[0], costoUnitario: "" });

  useEffect(() => {
    loadData("finanzas-insumos", []).then((d) => { setInsumos(d); setLoaded(true); });
  }, []);

  const agregar = async () => {
    if (!form.nombre.trim() || !form.costoUnitario) return;
    const nuevo = {
      id: uid(),
      nombre: form.nombre.trim(),
      unidad: form.unidad,
      costoUnitario: Number(form.costoUnitario),
      fecha: new Date().toISOString().slice(0, 10),
    };
    const actualizado = [nuevo, ...insumos];
    setInsumos(actualizado);
    await saveData("finanzas-insumos", actualizado);
    setForm({ nombre: "", unidad: form.unidad, costoUnitario: "" });
  };

  const eliminar = async (id) => {
    const actualizado = insumos.filter((i) => i.id !== id);
    setInsumos(actualizado);
    await saveData("finanzas-insumos", actualizado);
  };

  return (
    <div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">
        Cargá acá tus insumos (harina, telas, envases...) con su costo por unidad. Después los usás para armar el costo de cada producto.
      </p>

      <div className="rounded-xl p-3 mb-4 flex flex-col gap-2" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && agregar()} placeholder="Ej: Harina, Huevo, Tela..."
          className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
        <div className="flex gap-2">
          <select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }}>
            {UNIDADES_INSUMO.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <input type="number" value={form.costoUnitario} onChange={(e) => setForm({ ...form, costoUnitario: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && agregar()} placeholder="Costo por unidad"
            className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }} />
          <button onClick={agregar} className="rounded-lg px-3 py-2 text-sm font-semibold flex items-center gap-1 shrink-0"
            style={{ background: BRAND.teal, color: BRAND.navy }}>
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {insumos.map((i) => (
          <div key={i.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
            <div>
              <div style={{ color: BRAND.navy }} className="text-sm">{i.nombre}</div>
              <div style={{ color: "#8a8578" }} className="text-xs">{money(i.costoUnitario)} por {i.unidad}</div>
            </div>
            <button onClick={() => eliminar(i.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
          </div>
        ))}
        {loaded && insumos.length === 0 && (
          <p style={{ color: "#8a8578" }} className="text-xs text-center py-3">Sin insumos cargados todavía.</p>
        )}
      </div>
    </div>
  );
}
