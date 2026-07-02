"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { BRAND, PLAZOS } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid } from "@/lib/helpers";
import PlanNegocio from "@/components/estrategia/PlanNegocio";

export default function EstrategiaSection({ business }) {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [vista, setVista] = useState("vision");
  const [data, setData] = useState({ vision: "", objetivos: [] });
  const [visionDraft, setVisionDraft] = useState("");
  const [nuevoObjetivo, setNuevoObjetivo] = useState({ plazo: "mensual", texto: "" });
  const [savedVision, setSavedVision] = useState(false);

  useEffect(() => {
    if (!unidadId) return;
    loadData("estrategia-data", { vision: "", objetivos: [] }).then((d) => {
      setData(d);
      setVisionDraft(d.vision || "");
    });
  }, [unidadId]);

  const guardarVision = async () => {
    const actualizado = { ...data, vision: visionDraft };
    setData(actualizado);
    await saveData("estrategia-data", actualizado);
    setSavedVision(true);
    setTimeout(() => setSavedVision(false), 1200);
  };

  const agregarObjetivo = async () => {
    if (!nuevoObjetivo.texto.trim()) return;
    const obj = { id: uid(), ...nuevoObjetivo, completado: false };
    const actualizado = { ...data, objetivos: [obj, ...data.objetivos] };
    setData(actualizado);
    await saveData("estrategia-data", actualizado);
    setNuevoObjetivo({ plazo: "mensual", texto: "" });
  };

  const toggleObjetivo = async (id) => {
    const actualizado = { ...data, objetivos: data.objetivos.map((o) => (o.id === id ? { ...o, completado: !o.completado } : o)) };
    setData(actualizado);
    await saveData("estrategia-data", actualizado);
  };

  const eliminarObjetivo = async (id) => {
    const actualizado = { ...data, objetivos: data.objetivos.filter((o) => o.id !== id) };
    setData(actualizado);
    await saveData("estrategia-data", actualizado);
  };

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Estrategia</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">Tu visión, tus objetivos, y los números para llegar.</p>

      <div className="flex gap-1.5 mb-5">
        <button onClick={() => setVista("vision")} className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={vista === "vision" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
          Visión y objetivos
        </button>
        <button onClick={() => setVista("plan")} className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={vista === "plan" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
          Plan de negocio
        </button>
      </div>

      {vista === "plan" ? (
        <PlanNegocio business={business} />
      ) : (
        <>
          <div className="rounded-xl p-4 mb-6" style={{ background: BRAND.navy }}>
            <span style={{ color: "#8b8b9a" }} className="text-xs uppercase tracking-wide">Visión del negocio</span>
            <textarea value={visionDraft} onChange={(e) => setVisionDraft(e.target.value)} rows={3}
              placeholder="¿A dónde querés llegar con este negocio?"
              className="w-full mt-2 rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ background: "#242440", color: BRAND.cream, border: "1px solid #35354f" }} />
            <button onClick={guardarVision} className="mt-2 rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{ background: BRAND.teal, color: BRAND.navy }}>
              {savedVision ? "Guardado ✓" : "Guardar visión"}
            </button>
          </div>

          <div className="rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-2" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
            <select value={nuevoObjetivo.plazo} onChange={(e) => setNuevoObjetivo({ ...nuevoObjetivo, plazo: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }}>
              {PLAZOS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input value={nuevoObjetivo.texto} onChange={(e) => setNuevoObjetivo({ ...nuevoObjetivo, texto: e.target.value })}
              placeholder="Objetivo" className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }} />
            <button onClick={agregarObjetivo} className="rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 justify-center"
              style={{ background: BRAND.navy, color: BRAND.cream }}>
              <Plus size={14} /> Agregar
            </button>
          </div>

          {PLAZOS.map((plazo) => {
            const items = data.objetivos.filter((o) => o.plazo === plazo);
            if (items.length === 0) return null;
            return (
              <div key={plazo} className="mb-4">
                <div style={{ color: "#8a8578" }} className="text-xs font-semibold uppercase tracking-wide mb-2">Objetivos {plazo}es</div>
                <div className="space-y-2">
                  {items.map((o) => (
                    <div key={o.id} className="flex items-center gap-2 rounded-lg p-3" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                      <button onClick={() => toggleObjetivo(o.id)}
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={o.completado ? { background: BRAND.teal } : { border: "1.5px solid #d8d2c3" }}>
                        {o.completado && <Check size={12} color={BRAND.navy} />}
                      </button>
                      <span style={{ color: o.completado ? "#a8a397" : BRAND.navy, textDecoration: o.completado ? "line-through" : "none" }} className="text-sm flex-1">
                        {o.texto}
                      </span>
                      <button onClick={() => eliminarObjetivo(o.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {data.objetivos.length === 0 && <p style={{ color: "#8a8578" }} className="text-sm text-center py-6">Todavía no cargaste objetivos.</p>}
        </>
      )}
    </div>
  );
}
