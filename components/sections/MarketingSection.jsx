"use client";

import { useState } from "react";
import { BRAND } from "@/lib/constants";
import CalendarioContenidoTab from "@/components/marketing/CalendarioContenidoTab";
import PilaresContenidoTab from "@/components/marketing/PilaresContenidoTab";
import MarketingSidebar from "@/components/marketing/MarketingSidebar";

export default function MarketingSection() {
  const [vista, setVista] = useState("calendario");
  const tabs = [
    { id: "calendario", label: "Calendario de contenido" },
    { id: "pilares", label: "Pilares de contenido" },
  ];

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Marketing</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">A quién le hablás, qué le ofrecés, y cuándo se lo contás.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        <div className="min-w-0">
          <div className="flex gap-1.5 mb-5 flex-wrap">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setVista(t.id)} className="px-3 py-1.5 rounded-md text-xs font-medium"
                style={vista === t.id ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
                {t.label}
              </button>
            ))}
          </div>

          {vista === "calendario" && <CalendarioContenidoTab />}
          {vista === "pilares" && <PilaresContenidoTab />}
        </div>

        <MarketingSidebar />
      </div>
    </div>
  );
}
