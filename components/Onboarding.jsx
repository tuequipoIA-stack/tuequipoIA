"use client";

import { useState } from "react";
import { BRAND, ETAPAS, TIEMPOS, FACTURACIONES, CANALES, DESAFIOS } from "@/lib/constants";
import Chip from "./Chip";
import BrandHeader from "./BrandHeader";

export default function Onboarding({ onStart }) {
  const [step, setStep] = useState(0);
  const [perfil, setPerfil] = useState({
    nombre: "", rubro: "", etapa: "", tiempoFuncionando: "", facturacionMensual: "",
    canalVenta: "", desafios: [], objetivo3Meses: "",
  });

  const update = (k, v) => setPerfil((p) => ({ ...p, [k]: v }));
  const toggleDesafio = (id) => {
    setPerfil((p) => ({
      ...p,
      desafios: p.desafios.includes(id) ? p.desafios.filter((d) => d !== id) : [...p.desafios, id],
    }));
  };

  const steps = [
    {
      title: "Contanos de tu negocio",
      body: (
        <div className="space-y-3">
          <input value={perfil.nombre} onChange={(e) => update("nombre", e.target.value)} placeholder="¿Cómo se llama tu negocio?"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ background: "#242440", color: BRAND.cream, border: "1px solid #35354f" }} />
          <input value={perfil.rubro} onChange={(e) => update("rubro", e.target.value)} placeholder="¿A qué se dedica?"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ background: "#242440", color: BRAND.cream, border: "1px solid #35354f" }} />
        </div>
      ),
    },
    {
      title: "¿En qué etapa estás?",
      body: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {ETAPAS.map((e) => <Chip key={e} active={perfil.etapa === e} onClick={() => update("etapa", e)}>{e}</Chip>)}
          </div>
          <div>
            <p style={{ color: "#8b8b9a" }} className="text-xs mb-2">¿Hace cuánto funciona?</p>
            <div className="grid grid-cols-2 gap-2">
              {TIEMPOS.map((t) => <Chip key={t} active={perfil.tiempoFuncionando === t} onClick={() => update("tiempoFuncionando", t)}>{t}</Chip>)}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Números y canal de venta",
      body: (
        <div className="space-y-4">
          <div>
            <p style={{ color: "#8b8b9a" }} className="text-xs mb-2">Facturación mensual aproximada</p>
            <div className="grid grid-cols-1 gap-2">
              {FACTURACIONES.map((f) => <Chip key={f} active={perfil.facturacionMensual === f} onClick={() => update("facturacionMensual", f)}>{f}</Chip>)}
            </div>
          </div>
          <div>
            <p style={{ color: "#8b8b9a" }} className="text-xs mb-2">¿Cuál es tu canal de venta principal?</p>
            <div className="grid grid-cols-2 gap-2">
              {CANALES.map((c) => <Chip key={c} active={perfil.canalVenta === c} onClick={() => update("canalVenta", c)}>{c}</Chip>)}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Lo que más te cuesta hoy",
      body: (
        <div className="space-y-4">
          <div>
            <p style={{ color: "#8b8b9a" }} className="text-xs mb-2">Elegí uno o más (esto define qué te recomendamos)</p>
            <div className="grid grid-cols-2 gap-2">
              {DESAFIOS.map((d) => <Chip key={d.id} active={perfil.desafios.includes(d.id)} onClick={() => toggleDesafio(d.id)}>{d.label}</Chip>)}
            </div>
          </div>
          <div>
            <p style={{ color: "#8b8b9a" }} className="text-xs mb-2">¿A dónde querés llegar en los próximos 3 meses?</p>
            <textarea value={perfil.objetivo3Meses} onChange={(e) => update("objetivo3Meses", e.target.value)} rows={3}
              placeholder="Ej: duplicar ventas, ordenar las finanzas, lanzar un producto nuevo..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ background: "#242440", color: BRAND.cream, border: "1px solid #35354f" }} />
          </div>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const canAdvance = step === 0 ? perfil.nombre.trim().length > 0 : true;

  return (
    <div style={{ background: BRAND.navy }} className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <BrandHeader className="mb-6" />

        <div className="flex items-center gap-1.5 justify-center mb-6">
          {steps.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full" style={{ width: 28, background: i <= step ? BRAND.teal : "#35354f" }} />
          ))}
        </div>

        <h2 style={{ color: BRAND.cream }} className="text-xl font-semibold text-center mb-5">{steps[step].title}</h2>

        {steps[step].body}

        <div className="flex items-center gap-2 mt-6">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: "transparent", color: "#8b8b9a", border: "1px solid #35354f" }}>
              Atrás
            </button>
          )}
          <button
            disabled={!canAdvance}
            onClick={() => (isLast ? onStart(perfil) : setStep(step + 1))}
            className="flex-1 rounded-lg py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
            style={{ background: BRAND.teal, color: BRAND.navy }}>
            {isLast ? "Entrar a mi negocio" : "Siguiente"}
          </button>
        </div>
        {step === 0 && (
          <button onClick={() => onStart({ nombre: "", rubro: "" })} className="w-full mt-2 text-xs py-2 opacity-60 hover:opacity-100" style={{ color: BRAND.cream }}>
            Saltear por ahora
          </button>
        )}
      </div>
    </div>
  );
}
