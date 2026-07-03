"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import AgenteOfertaCard from "./AgenteOfertaCard";

const CLIENTE_VACIO = { nombre: "", descripcion: "", dolores: "" };
const VALOR_VACIO = { propuesta: "", diferenciadores: [] };
const OBJETIVOS_VACIO = { tresMeses: "", seisMeses: "", unAnio: "", tresAnios: "", cincoAnios: "" };

const HORIZONTES = [
  { key: "tresMeses", label: "En 3 meses" },
  { key: "seisMeses", label: "En 6 meses" },
  { key: "unAnio", label: "En 1 año" },
  { key: "tresAnios", label: "En 3 años" },
  { key: "cincoAnios", label: "En 5 años" },
];

function Guardado({ ok }) {
  return ok ? <span style={{ color: "#127a79" }} className="text-xs font-medium ml-2">Guardado ✓</span> : null;
}

export default function DefinirOfertaTab() {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [loaded, setLoaded] = useState(false);

  const [cliente, setCliente] = useState(CLIENTE_VACIO);
  const [okCliente, setOkCliente] = useState(false);

  const [valor, setValor] = useState(VALOR_VACIO);
  const [okValor, setOkValor] = useState(false);

  const [dolores, setDolores] = useState("");
  const [okDolores, setOkDolores] = useState(false);

  const [objetivos, setObjetivos] = useState(OBJETIVOS_VACIO);
  const [okObjetivos, setOkObjetivos] = useState(false);

  useEffect(() => {
    if (!unidadId) return;
    setLoaded(false);
    Promise.all([
      loadData("marketing-cliente", CLIENTE_VACIO),
      loadData("marketing-valor", VALOR_VACIO),
      loadData("oferta-objetivos", OBJETIVOS_VACIO),
    ]).then(([c, v, o]) => {
      setCliente(c);
      setDolores(c.dolores || "");
      setValor(v);
      setObjetivos(o);
      setLoaded(true);
    });
  }, [unidadId]);

  const parpadear = (setOk) => { setOk(true); setTimeout(() => setOk(false), 1400); };

  const guardarCliente = async () => {
    const actualizado = { ...cliente, dolores };
    await saveData("marketing-cliente", actualizado);
    setCliente(actualizado);
    parpadear(setOkCliente);
  };

  const guardarValor = async () => {
    await saveData("marketing-valor", valor);
    parpadear(setOkValor);
  };

  const guardarDolores = async () => {
    const actualizado = { ...cliente, dolores };
    await saveData("marketing-cliente", actualizado);
    setCliente(actualizado);
    parpadear(setOkDolores);
  };

  const guardarObjetivos = async () => {
    await saveData("oferta-objetivos", objetivos);
    parpadear(setOkObjetivos);
  };

  if (!loaded) return null;

  return (
    <div>
      <AgenteOfertaCard />

      {/* Cliente ideal */}
      <div className="rounded-xl p-4 mb-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-3">¿Quién es tu cliente ideal?</div>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-1">Nombre o apodo</span>
        <input value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
          placeholder='Ej: "María, la mamá ocupada"'
          className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
        <span style={{ color: "#8a8578" }} className="text-xs block mb-1">¿Quién es? (edad, rutina, qué hace, dónde está)</span>
        <textarea value={cliente.descripcion} onChange={(e) => setCliente({ ...cliente, descripcion: e.target.value })} rows={3}
          placeholder="Ej: mujer de 30-40 años, trabaja full time, tiene poco tiempo para cocinar..."
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
        <button onClick={guardarCliente} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: BRAND.teal, color: BRAND.navy }}>
          Guardar cliente ideal
        </button>
        <Guardado ok={okCliente} />
      </div>

      {/* Oferta de valor */}
      <div className="rounded-xl p-4 mb-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-3">¿Cuál es tu oferta de valor?</div>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-1">Más allá del producto o servicio, ¿qué le ofrecés a tu cliente?</span>
        <textarea value={valor.propuesta} onChange={(e) => setValor({ ...valor, propuesta: e.target.value })} rows={3}
          placeholder="Ej: le ofrezco tranquilidad de saber que come sano sin esfuerzo, y trato cercano tipo casa de familia..."
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
        <button onClick={guardarValor} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: BRAND.teal, color: BRAND.navy }}>
          Guardar oferta de valor
        </button>
        <Guardado ok={okValor} />
      </div>

      {/* Dolores */}
      <div className="rounded-xl p-4 mb-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-3">¿Cuáles son los dolores de tus clientes?</div>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-1">¿Qué le duele, qué necesita o qué le cuesta resolver hoy?</span>
        <textarea value={dolores} onChange={(e) => setDolores(e.target.value)} rows={3}
          placeholder="Ej: no tiene tiempo de cocinar sano, se siente culpable por pedir delivery todos los días..."
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
        <button onClick={guardarDolores} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: BRAND.teal, color: BRAND.navy }}>
          Guardar dolores
        </button>
        <Guardado ok={okDolores} />
      </div>

      {/* Objetivos por horizonte */}
      <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-1">¿Cuál es tu objetivo en el tiempo?</div>
        <p style={{ color: "#8a8578" }} className="text-xs mb-3">Un objetivo concreto para cada horizonte. No hace falta llenarlos todos ahora.</p>
        <div className="space-y-3 mb-3">
          {HORIZONTES.map((h) => (
            <div key={h.key}>
              <span style={{ color: "#8a8578" }} className="text-xs block mb-1">{h.label}</span>
              <input value={objetivos[h.key] || ""} onChange={(e) => setObjetivos({ ...objetivos, [h.key]: e.target.value })}
                placeholder="Ej: duplicar ventas mensuales"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
            </div>
          ))}
        </div>
        <button onClick={guardarObjetivos} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: BRAND.navy, color: BRAND.cream }}>
          Guardar objetivos
        </button>
        <Guardado ok={okObjetivos} />
      </div>
    </div>
  );
}
