"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Megaphone, ShoppingCart, ListChecks, BookOpen } from "lucide-react";
import { BRAND } from "@/lib/constants";

// Mini "tour" animado de las secciones principales de la app — pantallas
// simplificadas (no son screenshots reales), pensado para el login.
const ESCENAS = [
  {
    id: "dashboard", label: "Dashboard", icon: LayoutDashboard,
    render: () => (
      <div>
        <div style={{ color: "#8b8b9a" }} className="text-[10px] mb-2">Resumen de tu negocio</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[["Ventas del mes", "$184.200"], ["Gastos", "$62.100"], ["Ganancia", "$122.100"]].map(([label, valor]) => (
            <div key={label} className="rounded-lg p-2" style={{ background: "#242440" }}>
              <div style={{ color: "#8b8b9a" }} className="text-[8px]">{label}</div>
              <div style={{ color: BRAND.teal }} className="text-[11px] font-semibold">{valor}</div>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1.5 h-14">
          {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: BRAND.teal, opacity: 0.4 + i * 0.08 }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "marketing", label: "Marketing", icon: Megaphone,
    render: () => (
      <div>
        <div style={{ color: "#8b8b9a" }} className="text-[10px] mb-2">Calendario de contenido</div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <div key={i} style={{ color: "#5f5f78" }} className="text-[7px] text-center">{d}</div>
          ))}
          {Array.from({ length: 14 }).map((_, i) => {
            const conPost = [1, 3, 4, 8, 10, 12].includes(i);
            return (
              <div key={i} className="aspect-square rounded-sm flex items-center justify-center"
                style={{ background: conPost ? BRAND.teal : "#242440", opacity: conPost ? 0.85 : 0.5 }}>
                {conPost && <div className="w-1 h-1 rounded-full" style={{ background: BRAND.navy }} />}
              </div>
            );
          })}
        </div>
        <div style={{ color: "#8b8b9a" }} className="text-[8px]">6 piezas planificadas esta semana</div>
      </div>
    ),
  },
  {
    id: "ventas", label: "Ventas", icon: ShoppingCart,
    render: () => (
      <div>
        <div style={{ color: "#8b8b9a" }} className="text-[10px] mb-2">Ventas recientes</div>
        <div className="space-y-1.5">
          {[["Torta x 2", "$12.000"], ["Combo viandas", "$8.500"], ["Docena facturas", "$4.200"]].map(([nom, val]) => (
            <div key={nom} className="flex items-center justify-between rounded-lg px-2 py-1.5" style={{ background: "#242440" }}>
              <span style={{ color: BRAND.cream }} className="text-[9px]">{nom}</span>
              <span style={{ color: BRAND.teal }} className="text-[9px] font-semibold">{val}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "organizacion", label: "Organización", icon: ListChecks,
    render: () => (
      <div>
        <div style={{ color: "#8b8b9a" }} className="text-[10px] mb-2">Tareas de la semana</div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { nombre: "Semana", items: ["Publicar reel", "Pedir insumos"] },
            { nombre: "Hoy", items: ["Responder DMs"] },
            { nombre: "Hecho", items: ["Cerrar caja"] },
          ].map((col) => (
            <div key={col.nombre} className="rounded-lg p-1.5" style={{ background: "#242440" }}>
              <div style={{ color: "#8b8b9a" }} className="text-[7px] mb-1 uppercase">{col.nombre}</div>
              <div className="space-y-1">
                {col.items.map((it) => (
                  <div key={it} className="rounded px-1 py-1" style={{ background: "#2f2f52" }}>
                    <span style={{ color: BRAND.cream }} className="text-[7px]">{it}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "recursos", label: "Recursos", icon: BookOpen,
    render: () => (
      <div>
        <div style={{ color: "#8b8b9a" }} className="text-[10px] mb-2">Hacks de la semana</div>
        <div className="grid grid-cols-2 gap-2">
          {["Guion para reel de venta", "Plantilla de precios"].map((t) => (
            <div key={t} className="rounded-lg p-2" style={{ background: "#242440" }}>
              <div className="w-full h-8 rounded mb-1.5" style={{ background: BRAND.teal, opacity: 0.35 }} />
              <div style={{ color: BRAND.cream }} className="text-[8px] leading-snug">{t}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function AppDemo() {
  const [activo, setActivo] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActivo((i) => (i + 1) % ESCENAS.length), 3800);
    return () => clearInterval(t);
  }, []);

  const escena = ESCENAS[activo];

  return (
    <div className="w-full max-w-md">
      <style>{`
        @keyframes appDemoFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .app-demo-scene { animation: appDemoFade 0.4s ease; }
      `}</style>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#1c1c34", border: "1px solid #2f2f52" }}>
        {/* barra superior tipo navegador */}
        <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "#16162a", borderBottom: "1px solid #2f2f52" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "#e0736a" }} />
          <span className="w-2 h-2 rounded-full" style={{ background: "#e0b56a" }} />
          <span className="w-2 h-2 rounded-full" style={{ background: "#6ac48a" }} />
          <div className="flex-1 flex justify-center">
            <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "#242440", color: "#5f5f78" }}>
              tuequipoia.com.ar
            </span>
          </div>
        </div>

        <div key={escena.id} className="app-demo-scene p-4" style={{ minHeight: "150px" }}>
          {escena.render()}
        </div>
      </div>

      {/* selector de escenas */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {ESCENAS.map((e, i) => (
          <button key={e.id} onClick={() => setActivo(i)} title={e.label}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-opacity"
            style={{ background: i === activo ? BRAND.teal : "#242440", opacity: i === activo ? 1 : 0.6 }}>
            <e.icon size={11} color={i === activo ? BRAND.navy : "#8b8b9a"} />
          </button>
        ))}
      </div>
    </div>
  );
}
