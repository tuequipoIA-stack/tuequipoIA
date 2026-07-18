"use client";

import { useState } from "react";
import { BRAND } from "@/lib/constants";
import PlanNegocio from "@/components/estrategia/PlanNegocio";
import DefinirOfertaTab from "@/components/estrategia/DefinirOfertaTab";
import TuGuiaTab from "@/components/estrategia/TuGuiaTab";
import AudioAyuda from "@/components/AudioAyuda";
import { AUDIO_GUIONES } from "@/lib/audioGuiones";

export default function EstrategiaSection({ business }) {
  const [vista, setVista] = useState("guia");

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold">Estrategia</h2>
        <AudioAyuda texto={AUDIO_GUIONES[`estrategia:${vista}`]} />
      </div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">Tu visión, tus objetivos, y los números para llegar.</p>

      <div className="flex gap-1.5 mb-5 flex-wrap">
        <button onClick={() => setVista("guia")} className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={vista === "guia" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
          Tu guía
        </button>
        <button onClick={() => setVista("oferta")} className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={vista === "oferta" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
          Definir oferta de negocio
        </button>
        <button onClick={() => setVista("plan")} className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={vista === "plan" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
          Plan de negocio
        </button>
      </div>

      {vista === "oferta" ? (
        <DefinirOfertaTab />
      ) : vista === "plan" ? (
        <PlanNegocio business={business} onIrAOferta={() => setVista("oferta")} />
      ) : (
        <TuGuiaTab onIrAOferta={() => setVista("oferta")} onIrAPlan={() => setVista("plan")} />
      )}
    </div>
  );
}
