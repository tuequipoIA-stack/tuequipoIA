"use client";

import { useEffect, useState } from "react";
import { Calculator, Check, Loader2, Sparkles } from "lucide-react";
import { BRAND, CADENCIAS } from "@/lib/constants";
import { loadData, saveData } from "@/lib/storage";
import { uid, money } from "@/lib/helpers";
import { planSystemPrompt } from "@/lib/businessContext";
import { askClaude } from "@/lib/chat";

export default function PlanNegocio({ business }) {
  const [form, setForm] = useState({
    vision: "", productoPrincipal: "", costoUnitario: "", margenDeseado: "50", sueldoObjetivo: "", diasHabiles: "24",
  });
  const [plan, setPlan] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData("plan-negocio", null).then((d) => {
      if (d) { setForm((prev) => d.form || prev); setPlan(d.plan || null); }
      setLoaded(true);
    });
  }, []);

  const guardarForm = async (nuevoForm) => {
    setForm(nuevoForm);
    await saveData("plan-negocio", { form: nuevoForm, plan });
  };

  const costo = Number(form.costoUnitario) || 0;
  const margen = Number(form.margenDeseado) || 0;
  const sueldoObjetivo = Number(form.sueldoObjetivo) || 0;
  const diasHabiles = Number(form.diasHabiles) || 24;

  const precioVenta = margen < 100 && costo > 0 ? costo / (1 - margen / 100) : 0;
  const gananciaUnidad = precioVenta - costo;
  const unidadesPorMes = gananciaUnidad > 0 ? Math.ceil(sueldoObjetivo / gananciaUnidad) : 0;
  const unidadesPorDia = diasHabiles > 0 ? Math.ceil(unidadesPorMes / diasHabiles) : 0;
  const facturacionMensual = unidadesPorMes * precioVenta;

  const puedeCalcular = costo > 0 && margen > 0 && margen < 100 && sueldoObjetivo > 0;

  const generarPlan = async () => {
    if (!puedeCalcular) return;
    setGenerando(true);
    setError("");
    try {
      const numeros = { vision: form.vision, productoPrincipal: form.productoPrincipal, precioVenta, gananciaUnidad, unidadesPorDia, unidadesPorMes, sueldoObjetivo };
      const raw = await askClaude({
        system: planSystemPrompt(business, numeros),
        messages: [{ role: "user", content: "Generá el plan de acción." }],
        max_tokens: 1200,
      });
      const limpio = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(limpio);
      const conIds = {};
      CADENCIAS.forEach((c) => {
        conIds[c.id] = (parsed[c.id] || []).map((texto) => ({ id: uid(), texto, hecha: false }));
      });
      setPlan(conIds);
      await saveData("plan-negocio", { form, plan: conIds });
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
    await saveData("plan-negocio", { form, plan: actualizado });
  };

  return (
    <div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">
        Bajá tu visión a números: cuánto tenés que vender y a qué precio para vivir de esto. Después armamos el plan de tareas para lograrlo.
      </p>

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
            <input type="number" value={form.costoUnitario} onChange={(e) => guardarForm({ ...form, costoUnitario: e.target.value })}
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
            <input type="number" value={form.sueldoObjetivo} onChange={(e) => guardarForm({ ...form, sueldoObjetivo: e.target.value })}
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
            <span style={{ color: BRAND.cream }} className="text-sm font-semibold">Lo que dicen los números</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span style={{ color: "#8b8b9a" }} className="text-xs">Precio de venta sugerido</span>
              <div style={{ color: BRAND.teal }} className="text-lg font-semibold">{money(precioVenta)}</div>
            </div>
            <div>
              <span style={{ color: "#8b8b9a" }} className="text-xs">Ganancia por unidad</span>
              <div style={{ color: BRAND.teal }} className="text-lg font-semibold">{money(gananciaUnidad)}</div>
            </div>
            <div>
              <span style={{ color: "#8b8b9a" }} className="text-xs">Unidades por día</span>
              <div style={{ color: BRAND.teal }} className="text-lg font-semibold">{unidadesPorDia}</div>
            </div>
            <div>
              <span style={{ color: "#8b8b9a" }} className="text-xs">Facturación mensual necesaria</span>
              <div style={{ color: BRAND.teal }} className="text-lg font-semibold">{money(facturacionMensual)}</div>
            </div>
          </div>
          <p style={{ color: "#8b8b9a" }} className="text-xs mt-3">
            Necesitás vender {unidadesPorMes} unidades por mes (~{unidadesPorDia} por día) para sacar {money(sueldoObjetivo)} de sueldo.
          </p>
        </div>
      )}

      <button onClick={generarPlan} disabled={!puedeCalcular || generando}
        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold mb-6 disabled:opacity-40"
        style={{ background: BRAND.teal, color: BRAND.navy }}>
        {generando ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        {generando ? "Armando el plan..." : "Generar plan de acción"}
      </button>
      {!puedeCalcular && (
        <p style={{ color: "#a89f88" }} className="text-xs -mt-4 mb-6">Completá costo, margen y sueldo objetivo para calcular.</p>
      )}
      {error && <p className="text-xs mb-4" style={{ color: "#b3453f" }}>{error}</p>}

      {plan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CADENCIAS.map((c) => (
            <div key={c.id} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
              <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-2">{c.label}</div>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
