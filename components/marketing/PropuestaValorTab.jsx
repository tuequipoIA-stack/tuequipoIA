"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { loadData, saveData } from "@/lib/storage";

export default function PropuestaValorTab() {
  const [data, setData] = useState({ propuesta: "", diferenciadores: [] });
  const [loaded, setLoaded] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [nuevoDiferenciador, setNuevoDiferenciador] = useState("");

  useEffect(() => {
    loadData("marketing-valor", { propuesta: "", diferenciadores: [] }).then((d) => { setData(d); setLoaded(true); });
  }, []);

  const guardar = async (actualizado) => {
    setData(actualizado);
    await saveData("marketing-valor", actualizado);
  };

  const guardarPropuesta = async () => {
    await saveData("marketing-valor", data);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1200);
  };

  const agregarDiferenciador = async () => {
    if (!nuevoDiferenciador.trim()) return;
    await guardar({ ...data, diferenciadores: [...data.diferenciadores, nuevoDiferenciador.trim()] });
    setNuevoDiferenciador("");
  };

  const eliminarDiferenciador = async (i) => {
    await guardar({ ...data, diferenciadores: data.diferenciadores.filter((_, idx) => idx !== i) });
  };

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      <div>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-2">
          Más allá del producto o servicio, ¿qué le ofrecés a tu cliente? (confianza, rapidez, cercanía, comunidad...)
        </span>
        <textarea value={data.propuesta} onChange={(e) => setData({ ...data, propuesta: e.target.value })} rows={4}
          placeholder="Ej: le ofrezco tranquilidad de saber que come sano sin esfuerzo, y trato cercano tipo casa de familia..."
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: "1px solid #e4dfd3" }} />
        <button onClick={guardarPropuesta} className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ background: BRAND.teal, color: BRAND.navy }}>
          {guardado ? "Guardado ✓" : "Guardar propuesta de valor"}
        </button>
      </div>

      <div>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-2">Diferenciadores frente a la competencia</span>
        <div className="flex gap-2 mb-3">
          <input value={nuevoDiferenciador} onChange={(e) => setNuevoDiferenciador(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarDiferenciador()} placeholder="Ej: entrega en el día"
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
          <button onClick={agregarDiferenciador} className="rounded-lg px-3 py-2 text-sm font-semibold"
            style={{ background: BRAND.navy, color: BRAND.cream }}>
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.diferenciadores.map((d, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "#eef7f6", color: "#127a79" }}>
              {d}
              <button onClick={() => eliminarDiferenciador(i)}><X size={11} /></button>
            </span>
          ))}
          {data.diferenciadores.length === 0 && <p style={{ color: "#a89f88" }} className="text-xs">Sin diferenciadores cargados.</p>}
        </div>
      </div>
    </div>
  );
}
