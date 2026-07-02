"use client";

import { useState } from "react";
import { ArrowUpRight, ClipboardCheck, Lightbulb, MessageCircle } from "lucide-react";
import { BRAND, CHECKLIST_ANTES_DE_PUBLICAR, MARKETING_TIPS, AGENTE_MARKETING_URL } from "@/lib/constants";
import { numeroSemanaISO } from "@/lib/helpers";

export default function MarketingSidebar() {
  const [marcados, setMarcados] = useState(() => CHECKLIST_ANTES_DE_PUBLICAR.map(() => false));

  const toggle = (i) => setMarcados((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  const tip = MARKETING_TIPS[numeroSemanaISO() % MARKETING_TIPS.length];

  return (
    <div className="flex flex-col gap-4">
      {/* Antes de publicar */}
      <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardCheck size={15} color={BRAND.navy} />
          <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Antes de publicar</span>
        </div>
        <div className="space-y-2.5">
          {CHECKLIST_ANTES_DE_PUBLICAR.map((item, i) => (
            <button key={i} onClick={() => toggle(i)} className="flex items-start gap-2.5 text-left w-full">
              <span className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5"
                style={marcados[i] ? { background: BRAND.teal } : { border: "1.5px solid #d8d2c3" }}>
                {marcados[i] && <span className="w-1.5 h-1.5 rounded-sm" style={{ background: BRAND.navy }} />}
              </span>
              <span style={{ color: marcados[i] ? "#a8a397" : "#4a4740", textDecoration: marcados[i] ? "line-through" : "none" }} className="text-xs leading-snug">
                {item}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tip de la semana */}
      <div className="rounded-xl p-4" style={{ background: BRAND.navy }}>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={15} color={BRAND.teal} />
          <span style={{ color: BRAND.cream }} className="text-sm font-semibold">Tip de la semana</span>
        </div>
        <p style={{ color: "#c7c7d6" }} className="text-xs leading-relaxed">{tip}</p>
      </div>

      {/* Agente de marketing */}
      <a href={AGENTE_MARKETING_URL} target="_blank" rel="noopener noreferrer"
        className="rounded-xl p-4 flex items-center justify-between gap-2 hover:opacity-90 transition-opacity"
        style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eef7f6" }}>
            <MessageCircle size={14} color="#127a79" />
          </div>
          <span style={{ color: BRAND.navy }} className="text-sm font-semibold truncate">Consultar al agente de marketing</span>
        </div>
        <ArrowUpRight size={15} color="#8a8578" className="shrink-0" />
      </a>
    </div>
  );
}
