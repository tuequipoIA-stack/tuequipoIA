"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Compass, Heart, Map, Plus, Target, TrendingUp, Trash2 } from "lucide-react";
import { BRAND, PLAZOS, CADENCIAS } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid, calcularPlanNumeros } from "@/lib/helpers";

const OBJETIVOS_OFERTA_VACIO = { tresMeses: "", seisMeses: "", unAnio: "", tresAnios: "", cincoAnios: "" };
const HORIZONTES = [
  { key: "tresMeses", label: "3 meses" },
  { key: "seisMeses", label: "6 meses" },
  { key: "unAnio", label: "1 año" },
  { key: "tresAnios", label: "3 años" },
  { key: "cincoAnios", label: "5 años" },
];

export default function TuGuiaTab({ onIrAOferta, onIrAPlan }) {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [loaded, setLoaded] = useState(false);

  const [cliente, setCliente] = useState(null);
  const [valorProp, setValorProp] = useState(null);
  const [objetivosOferta, setObjetivosOferta] = useState(OBJETIVOS_OFERTA_VACIO);
  const [planData, setPlanData] = useState(null);

  const [data, setData] = useState({ vision: "", objetivos: [] });
  const [visionDraft, setVisionDraft] = useState("");
  const [nuevoObjetivo, setNuevoObjetivo] = useState({ plazo: "mensual", texto: "" });
  const [savedVision, setSavedVision] = useState(false);

  useEffect(() => {
    if (!unidadId) return;
    setLoaded(false);
    Promise.all([
      loadData("marketing-cliente", null),
      loadData("marketing-valor", null),
      loadData("oferta-objetivos", OBJETIVOS_OFERTA_VACIO),
      loadData("plan-negocio", null),
      loadData("estrategia-data", { vision: "", objetivos: [] }),
    ]).then(([c, v, o, p, e]) => {
      setCliente(c);
      setValorProp(v);
      setObjetivosOferta(o);
      setPlanData(p);
      setData(e);
      setVisionDraft(e.vision || "");
      setLoaded(true);
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

  if (!loaded) return null;

  const numeros = calcularPlanNumeros(planData?.form);
  const cascadaItems = [
    { label: "Día", valor: numeros.unidadesPorDia },
    { label: "Semana", valor: numeros.unidadesPorSemana },
    { label: "Mes", valor: numeros.unidadesPorMes },
    { label: "Trimestre", valor: numeros.unidadesPorTrimestre },
    { label: "6 meses", valor: numeros.unidadesPorSemestre },
    { label: "Año", valor: numeros.unidadesPorAnio },
  ];
  const maxCascada = Math.max(1, ...cascadaItems.map((c) => c.valor));

  const plan = planData?.plan;
  const avancePorCadencia = CADENCIAS.map((c) => {
    const items = plan?.[c.id] || [];
    const hechas = items.filter((t) => t.hecha).length;
    return { ...c, total: items.length, hechas, pct: items.length ? Math.round((hechas / items.length) * 100) : 0 };
  });
  const totalTareas = avancePorCadencia.reduce((s, c) => s + c.total, 0);
  const totalHechas = avancePorCadencia.reduce((s, c) => s + c.hechas, 0);
  const pctGeneral = totalTareas ? Math.round((totalHechas / totalTareas) * 100) : 0;

  return (
    <div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">
        Todo lo que definiste en "Definir oferta de negocio" y "Plan de negocio", resumido en un solo lugar.
      </p>

      {/* Cliente, oferta y dolores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} color="#127a79" />
            <span style={{ color: BRAND.navy }} className="text-xs font-semibold">Cliente ideal</span>
          </div>
          {cliente?.nombre ? (
            <p style={{ color: "#4a4740" }} className="text-xs leading-relaxed">{cliente.nombre}{cliente.descripcion ? ` — ${cliente.descripcion}` : ""}</p>
          ) : (
            <p style={{ color: "#a89f88" }} className="text-xs">Sin definir todavía.</p>
          )}
        </div>
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex items-center gap-2 mb-2">
            <Compass size={14} color="#127a79" />
            <span style={{ color: BRAND.navy }} className="text-xs font-semibold">Oferta de valor</span>
          </div>
          {valorProp?.propuesta ? (
            <p style={{ color: "#4a4740" }} className="text-xs leading-relaxed">{valorProp.propuesta}</p>
          ) : (
            <p style={{ color: "#a89f88" }} className="text-xs">Sin definir todavía.</p>
          )}
        </div>
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex items-center gap-2 mb-2">
            <Heart size={14} color="#127a79" />
            <span style={{ color: BRAND.navy }} className="text-xs font-semibold">Dolores del cliente</span>
          </div>
          {cliente?.dolores ? (
            <p style={{ color: "#4a4740" }} className="text-xs leading-relaxed">{cliente.dolores}</p>
          ) : (
            <p style={{ color: "#a89f88" }} className="text-xs">Sin definir todavía.</p>
          )}
        </div>
      </div>
      {(!cliente?.nombre || !valorProp?.propuesta || !cliente?.dolores) && onIrAOferta && (
        <button onClick={onIrAOferta} className="flex items-center gap-1 text-xs font-medium mb-5" style={{ color: "#127a79" }}>
          Completar en "Definir oferta de negocio" <ArrowRight size={12} />
        </button>
      )}

      {/* Hoja de ruta */}
      <div className="rounded-xl p-4 mb-5" style={{ background: BRAND.navy }}>
        <div className="flex items-center gap-2 mb-3">
          <Map size={15} color={BRAND.teal} />
          <span style={{ color: BRAND.cream }} className="text-sm font-semibold">Tu hoja de ruta</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {HORIZONTES.map((h, i) => (
            <div key={h.key} className="rounded-lg p-3" style={{ background: "#242440", borderTop: `2px solid ${BRAND.teal}` }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{ background: BRAND.teal, color: BRAND.navy }}>{i + 1}</span>
                <span style={{ color: "#8b8b9a" }} className="text-[10px] uppercase tracking-wide">{h.label}</span>
              </div>
              <p style={{ color: objetivosOferta[h.key] ? BRAND.cream : "#6f6f82" }} className="text-xs leading-snug">
                {objetivosOferta[h.key] || "Sin definir"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Números en cascada */}
      {numeros.puedeCalcular && (
        <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} color={BRAND.navy} />
            <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Tus números, en cascada</span>
          </div>
          <div className="flex items-end justify-between gap-2" style={{ height: "110px" }}>
            {cascadaItems.map((c) => (
              <div key={c.label} className="flex-1 flex flex-col items-center justify-end h-full">
                <span style={{ color: BRAND.navy }} className="text-xs font-semibold mb-1">{c.valor}</span>
                <div className="w-full rounded-t-md" style={{ background: BRAND.teal, height: `${Math.max(6, (c.valor / maxCascada) * 100)}%` }} />
                <span style={{ color: "#8a8578" }} className="text-[10px] mt-1.5">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avance del plan */}
      <div className="rounded-xl p-4 mb-6" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Avance de tu plan de tareas</span>
          {totalTareas > 0 && <span style={{ color: "#127a79" }} className="text-xs font-semibold">{pctGeneral}% completado</span>}
        </div>
        {totalTareas === 0 ? (
          <div>
            <p style={{ color: "#a89f88" }} className="text-xs mb-2">Todavía no generaste un plan de tareas.</p>
            {onIrAPlan && (
              <button onClick={onIrAPlan} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#127a79" }}>
                Ir a "Plan de negocio" <ArrowRight size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {avancePorCadencia.filter((c) => c.total > 0).map((c) => (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: "#4a4740" }} className="text-xs">{c.label}</span>
                  <span style={{ color: "#8a8578" }} className="text-xs">{c.hechas}/{c.total}</span>
                </div>
                <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: "#f0ece2" }}>
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: BRAND.teal }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visión y objetivos generales (histórico) */}
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
    </div>
  );
}
