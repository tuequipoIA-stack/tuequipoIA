"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Calculator, Check, Loader2, Sparkles } from "lucide-react";
import { BRAND, CADENCIAS } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid, money, calcularPlanNumeros } from "@/lib/helpers";
import { planSystemPrompt } from "@/lib/businessContext";
import { askClaude } from "@/lib/chat";
import MoneyInput from "@/components/MoneyInput";

const OBJETIVOS_VACIO = { tresMeses: "", seisMeses: "", unAnio: "", tresAnios: "", cincoAnios: "" };
const HORIZONTES_REFERENCIA = [
  { key: "tresMeses", label: "3 meses" },
  { key: "seisMeses", label: "6 meses" },
  { key: "unAnio", label: "1 año" },
];

export default function PlanNegocio({ business, onIrAOferta }) {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [form, setForm] = useState({
    vision: "", productoPrincipal: "", costoUnitario: "", margenDeseado: "50", sueldoObjetivo: "", diasHabiles: "24",
  });
  const [plan, setPlan] = useState(null);
  const [horizonte, setHorizonte] = useState("unAnio");
  const [loaded, setLoaded] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  // Contexto de "Definir oferta de negocio" (solo lectura acá).
  const [cliente, setCliente] = useState(null);
  const [valorProp, setValorProp] = useState(null);
  const [objetivos, setObjetivos] = useState(OBJETIVOS_VACIO);

  useEffect(() => {
    if (!unidadId) return;
    setLoaded(false);
    Promise.all([
      loadData("plan-negocio", null),
      loadData("marketing-cliente", null),
      loadData("marketing-valor", null),
      loadData("oferta-objetivos", OBJETIVOS_VACIO),
    ]).then(([d, c, v, o]) => {
      if (d) { setForm((prev) => d.form || prev); setPlan(d.plan || null); setHorizonte(d.horizonte || "unAnio"); }
      setCliente(c);
      setValorProp(v);
      setObjetivos(o);
      setLoaded(true);
    });
  }, [unidadId]);

  const guardarForm = async (nuevoForm) => {
    setForm(nuevoForm);
    await saveData("plan-negocio", { form: nuevoForm, plan, horizonte });
  };

  const cambiarHorizonte = async (h) => {
    setHorizonte(h);
    await saveData("plan-negocio", { form, plan, horizonte: h });
  };

  const {
    sueldoObjetivo, precioVenta, gananciaUnidad, unidadesPorDia, unidadesPorSemana, unidadesPorMes,
    unidadesPorTrimestre, unidadesPorSemestre, unidadesPorAnio, facturacionMensual, puedeCalcular,
  } = calcularPlanNumeros(form);

  const cascada = {
    dia: { label: "Por día", unidades: unidadesPorDia },
    semana: { label: "Por semana", unidades: unidadesPorSemana },
    mes: { label: "Por mes", unidades: unidadesPorMes },
    trimestre: { label: "Por trimestre", unidades: unidadesPorTrimestre },
    semestre: { label: "Por 6 meses", unidades: unidadesPorSemestre },
    anio: { label: "Por año", unidades: unidadesPorAnio },
  };

  const objetivoElegido = objetivos[horizonte] || "";
  const horizonteLabel = HORIZONTES_REFERENCIA.find((h) => h.key === horizonte)?.label || "";
  const faltaContexto = !cliente?.nombre && !valorProp?.propuesta && !objetivoElegido;

  const generarPlan = async () => {
    if (!puedeCalcular) return;
    setGenerando(true);
    setError("");
    try {
      const numeros = {
        vision: form.vision, productoPrincipal: form.productoPrincipal, precioVenta, gananciaUnidad,
        unidadesPorDia, unidadesPorSemana, unidadesPorMes, unidadesPorTrimestre, unidadesPorSemestre, unidadesPorAnio,
        sueldoObjetivo,
      };
      const contexto = {
        clienteIdeal: cliente?.nombre ? `${cliente.nombre} — ${cliente.descripcion || ""}` : "",
        propuestaValor: valorProp?.propuesta || "",
        dolores: cliente?.dolores || "",
        objetivoElegidoLabel: horizonteLabel,
        objetivoElegidoTexto: objetivoElegido,
      };
      const raw = await askClaude({
        system: planSystemPrompt(business, numeros, contexto),
        messages: [{ role: "user", content: "Generá el plan de acción." }],
        max_tokens: 1400,
      });
      const limpio = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(limpio);
      const conIds = {};
      CADENCIAS.forEach((c) => {
        conIds[c.id] = (parsed[c.id] || []).map((texto) => ({ id: uid(), texto, hecha: false }));
      });
      setPlan(conIds);
      await saveData("plan-negocio", { form, plan: conIds, horizonte });
    } catch (e) {
      setError("No se pudo generar el plan. Probá de nuevo.");
    } finally {
      setGenerando(false);
    }
  };

  const toggleTarea = async (cadenciaId, tareaId) => {
    const actualizado = {
      ...plan,
      [cadenciaId]: plan[cadenciaId].map((t) => (t.id === tareaId ? { ...t, hecha: !t.hecha } : t)),
    };
    setPlan(actualizado);
    await saveData("plan-negocio", { form, plan: actualizado, horizonte });
  };

  if (!loaded) return null;

  return (
    <div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">
        Esto es la bajada a números y tareas concretas de lo que definiste en "Definir oferta de negocio": cuánto tenés que vender
        cada día, semana, mes, trimestre, semestre y año para llegar a tu objetivo.
      </p>

      {/* Punto de partida */}
      <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Punto de partida</span>
          {onIrAOferta && (
            <button onClick={onIrAOferta} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#127a79" }}>
              Editar en "Definir oferta de negocio" <ArrowRight size={12} />
            </button>
          )}
        </div>

        {faltaContexto ? (
          <p style={{ color: "#a89f88" }} className="text-xs">
            Todavía no cargaste tu cliente ideal, propuesta de valor u objetivo en "Definir oferta de negocio". No es obligatorio, pero
            si lo completás el plan que armemos abajo va a ser mucho más específico.
          </p>
        ) : (
          <div className="space-y-2 text-xs" style={{ color: "#4a4740" }}>
            {cliente?.nombre && <p><b>Cliente ideal:</b> {cliente.nombre}{cliente.descripcion ? ` — ${cliente.descripcion}` : ""}</p>}
            {valorProp?.propuesta && <p><b>Propuesta de valor:</b> {valorProp.propuesta}</p>}
          </div>
        )}

        <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f0ece2" }}>
          <span style={{ color: "#8a8578" }} className="text-xs block mb-2">Objetivo de referencia para este plan</span>
          <div className="flex gap-1.5 mb-2">
            {HORIZONTES_REFERENCIA.map((h) => (
              <button key={h.key} onClick={() => cambiarHorizonte(h.key)} className="px-3 py-1.5 rounded-md text-xs font-medium"
                style={horizonte === h.key ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
                {h.label}
              </button>
            ))}
          </div>
          <p style={{ color: objetivoElegido ? BRAND.navy : "#a89f88" }} className="text-xs">
            {objetivoElegido || "Sin objetivo cargado para este horizonte todavía."}
          </p>
        </div>
      </div>

      <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-2">Tu visión, en una frase</span>
        <input value={form.vision} onChange={(e) => guardarForm({ ...form, vision: e.target.value })}
          placeholder='Ej: "Quiero ser la mejor sanguchería de Mendoza"'
          className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />

        <span style={{ color: "#8a8578" }} className="text-xs block mb-2">¿Qué vas a vender para lograrlo?</span>
        <input value={form.productoPrincipal} onChange={(e) => guardarForm({ ...form, productoPrincipal: e.target.value })}
          placeholder="Ej: Sánguches gourmet"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <span style={{ color: "#8a8578" }} className="text-xs block mb-2">Costo por unidad</span>
            <MoneyInput value={form.costoUnitario} onChange={(n) => guardarForm({ ...form, costoUnitario: n })}
              placeholder="$" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
          </div>
          <div>
            <span style={{ color: "#8a8578" }} className="text-xs block mb-2">Margen que querés ganar</span>
            <input type="number" value={form.margenDeseado} onChange={(e) => guardarForm({ ...form, margenDeseado: e.target.value })}
              placeholder="%" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span style={{ color: "#8a8578" }} className="text-xs block mb-2">Sueldo mensual que querés sacar</span>
            <MoneyInput value={form.sueldoObjetivo} onChange={(n) => guardarForm({ ...form, sueldoObjetivo: n })}
              placeholder="$" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
          </div>
          <div>
            <span style={{ color: "#8a8578" }} className="text-xs block mb-2">Días hábiles al mes</span>
            <input type="number" value={form.diasHabiles} onChange={(e) => guardarForm({ ...form, diasHabiles: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
          </div>
        </div>
      </div>

      {puedeCalcular && (
        <div className="rounded-xl p-4 mb-5" style={{ background: BRAND.navy }}>
          <div className="flex items-center gap-2 mb-3">
            <Calculator size={15} color={BRAND.teal} />
            <span style={{ color: BRAND.cream }} className="text-sm font-semibold">Números bajados en cascada</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <span style={{ color: "#8b8b9a" }} className="text-xs">Precio de venta sugerido</span>
              <div style={{ color: BRAND.teal }} className="text-base font-semibold">{money(precioVenta)}</div>
            </div>
            <div>
              <span style={{ color: "#8b8b9a" }} className="text-xs">Ganancia por unidad</span>
              <div style={{ color: BRAND.teal }} className="text-base font-semibold">{money(gananciaUnidad)}</div>
            </div>
            <div>
              <span style={{ color: "#8b8b9a" }} className="text-xs">Facturación mensual</span>
              <div style={{ color: BRAND.teal }} className="text-base font-semibold">{money(facturacionMensual)}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3" style={{ borderTop: "1px solid #2a2a45" }}>
            {Object.values(cascada).map((c) => (
              <div key={c.label} className="rounded-lg p-2 text-center" style={{ background: "#242440" }}>
                <div style={{ color: "#8b8b9a" }} className="text-[10px] mb-1">{c.label}</div>
                <div style={{ color: BRAND.cream }} className="text-sm font-semibold">{c.unidades}</div>
                <div style={{ color: "#6f6f82" }} className="text-[9px]">unidades</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={generarPlan} disabled={!puedeCalcular || generando}
        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold mb-6 disabled:opacity-40"
        style={{ background: BRAND.teal, color: BRAND.navy }}>
        {generando ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        {generando ? "Armando el plan..." : plan ? "Regenerar plan de acción" : "Generar plan de acción"}
      </button>
      {!puedeCalcular && (
        <p style={{ color: "#a89f88" }} className="text-xs -mt-4 mb-6">Completá costo, margen y sueldo objetivo para calcular.</p>
      )}
      {error && <p className="text-xs mb-4" style={{ color: "#b3453f" }}>{error}</p>}

      {plan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CADENCIAS.map((c) => (
            <div key={c.id} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: BRAND.navy }} className="text-sm font-semibold">{c.label}</span>
                {puedeCalcular && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "#eef7f6", color: "#127a79" }}>
                    meta: {cascada[c.cascada].unidades} un.
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {(plan[c.id] || []).map((t) => (
                  <div key={t.id} className="flex items-start gap-2">
                    <button onClick={() => toggleTarea(c.id, t.id)}
                      className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5"
                      style={t.hecha ? { background: BRAND.teal } : { border: "1.5px solid #d8d2c3" }}>
                      {t.hecha && <Check size={10} color={BRAND.navy} />}
                    </button>
                    <span style={{ color: t.hecha ? "#a8a397" : "#4a4740", textDecoration: t.hecha ? "line-through" : "none" }} className="text-xs leading-snug">
                      {t.texto}
                    </span>
                  </div>
                ))}
                {(plan[c.id] || []).length === 0 && (
                  <p style={{ color: "#a89f88" }} className="text-xs">Sin tareas en esta frecuencia.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
