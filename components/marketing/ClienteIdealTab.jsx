"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";

export default function ClienteIdealTab() {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [data, setData] = useState({ nombre: "", descripcion: "", dolores: "" });
  const [loaded, setLoaded] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!unidadId) return;
    loadData("marketing-cliente", { nombre: "", descripcion: "", dolores: "" }).then((d) => { setData(d); setLoaded(true); });
  }, [unidadId]);

  const guardar = async () => {
    await saveData("marketing-cliente", data);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1200);
  };

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      <div>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-2">Nombre o apodo de tu cliente ideal</span>
        <input value={data.nombre} onChange={(e) => setData({ ...data, nombre: e.target.value })}
          placeholder='Ej: "María, la mamá ocupada"'
          className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
      </div>
      <div>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-2">¿Quién es? Descripción (edad, rutina, qué hace, dónde está)</span>
        <textarea value={data.descripcion} onChange={(e) => setData({ ...data, descripcion: e.target.value })} rows={4}
          placeholder="Ej: mujer de 30-40 años, trabaja full time, tiene poco tiempo para cocinar, sigue cuentas de gastronomía en Instagram..."
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: "1px solid #e4dfd3" }} />
      </div>
      <div>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-2">¿Qué le duele o qué necesita?</span>
        <textarea value={data.dolores} onChange={(e) => setData({ ...data, dolores: e.target.value })} rows={4}
          placeholder="Ej: no tiene tiempo de cocinar sano, se siente culpable por pedir delivery todos los días..."
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: "1px solid #e4dfd3" }} />
      </div>
      <button onClick={guardar} className="rounded-lg px-4 py-2 text-sm font-semibold"
        style={{ background: BRAND.teal, color: BRAND.navy }}>
        {guardado ? "Guardado ✓" : "Guardar cliente ideal"}
      </button>
    </div>
  );
}
