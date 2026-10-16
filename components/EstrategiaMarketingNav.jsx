"use client";

import { ChevronRight } from "lucide-react";
import { ESTRATEGIA_MARKETING } from "@/lib/constants";
import { C } from "@/lib/theme";

// Encabezado común de Estrategia, Marketing y Recursos: la ruta
// ("Estrategia y marketing › Marketing › Calendario") y accesos rápidos
// para saltar entre las tres secciones sin volver al menú.
export default function EstrategiaMarketingNav({ seccion, subvista, onIr }) {
  const sec = ESTRATEGIA_MARKETING.secciones.find((s) => s.id === seccion);
  const sub = sec?.subs.find((x) => x.id === subvista) || sec?.subs[0];
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold mb-2" style={{ color: C.soft }}>
        <span>{ESTRATEGIA_MARKETING.label}</span>
        <ChevronRight size={12} />
        <span style={{ color: C.muted }}>{sec?.label}</span>
        {sub && (<><ChevronRight size={12} /><span>{sub.label}</span></>)}
      </div>
      <div className="flex gap-2 flex-wrap">
        {ESTRATEGIA_MARKETING.secciones.map((s) => {
          const Icon = s.icon;
          const on = s.id === seccion;
          return (
            <button key={s.id} onClick={() => onIr(s.id)}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-bold"
              style={on ? { border: "1px solid #1AABAA", background: "#e3efe9", color: C.tealDark } : { border: `1px solid ${C.line}`, background: C.card, color: C.muted }}>
              <Icon size={14} /> {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
