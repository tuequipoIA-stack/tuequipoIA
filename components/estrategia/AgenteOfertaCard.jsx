"use client";

import { ArrowUpRight, Compass } from "lucide-react";
import { BRAND, AGENTE_OFERTA_URL } from "@/lib/constants";

export default function AgenteOfertaCard() {
  return (
    <div className="rounded-xl p-5 mb-6" style={{ background: BRAND.navy }}>
      <div className="flex items-center gap-2 mb-2.5">
        <Compass size={16} color={BRAND.teal} />
        <span style={{ color: BRAND.cream }} className="text-sm font-semibold">Definí las bases primero</span>
      </div>
      <p style={{ color: "#c7c7d6" }} className="text-sm leading-relaxed mb-4">
        Antes de armar tu plan de negocio, necesitás tener claro tres cosas: quién es tu cliente ideal, qué le ofrecés
        y qué dolores le resolvés. Sin esto, cualquier estrategia tira para cualquier lado. Te guiamos con preguntas
        simples y directas —nada de formularios largos ni jerga de marketing— para que en pocos minutos tengas esto
        definido y listo para usar en tus redes, tus ventas y el resto de los bots.
      </p>
      <a href={AGENTE_OFERTA_URL} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        style={{ background: BRAND.teal, color: BRAND.navy }}>
        Consultar al agente de oferta
        <ArrowUpRight size={15} />
      </a>
    </div>
  );
}
