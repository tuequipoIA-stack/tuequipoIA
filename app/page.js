"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { loadData, saveData } from "@/lib/storage";
import { uid } from "@/lib/helpers";
import Sidebar from "@/components/Sidebar";
import Onboarding from "@/components/Onboarding";
import DashboardSection from "@/components/sections/DashboardSection";
import EquipoSection from "@/components/sections/EquipoSection";
import RecursosSection from "@/components/sections/RecursosSection";
import MarketingSection from "@/components/sections/MarketingSection";
import VentasSection from "@/components/sections/VentasSection";
import FinanzasSection from "@/components/sections/FinanzasSection";
import EstrategiaSection from "@/components/sections/EstrategiaSection";
import TableroSection from "@/components/sections/TableroSection";

export default function TuEquipoIA() {
  const [stage, setStage] = useState("loading");
  const [business, setBusiness] = useState(null);
  const [section, setSection] = useState("dashboard");

  useEffect(() => {
    (async () => {
      const perfil = await loadData("negocio-perfil", null);
      if (perfil && perfil.nombre) {
        setBusiness(perfil);
        setStage("app");
      } else {
        setStage("onboarding");
      }
    })();
  }, []);

  const finalizarOnboarding = async (perfil) => {
    await saveData("negocio-perfil", perfil);
    if (perfil.objetivo3Meses && perfil.objetivo3Meses.trim()) {
      const estrategia = await loadData("estrategia-data", { vision: "", objetivos: [] });
      if (!estrategia.objetivos || estrategia.objetivos.length === 0) {
        const actualizado = {
          ...estrategia,
          objetivos: [{ id: uid(), plazo: "trimestral", texto: perfil.objetivo3Meses.trim(), completado: false }],
        };
        await saveData("estrategia-data", actualizado);
      }
    }
    setBusiness(perfil);
    setStage("app");
  };

  if (stage === "loading") {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ background: BRAND.navy, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Sparkles size={22} color={BRAND.teal} />
      </div>
    );
  }

  if (stage === "onboarding") {
    return (
      <div className="w-full h-screen" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Onboarding onStart={finalizarOnboarding} />
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Sidebar business={business} active={section} onChange={setSection} />
      <div style={{ background: BRAND.cream }} className="flex-1 h-full overflow-y-auto p-6">
        {section === "equipo" && <EquipoSection business={business} />}
        {section === "recursos" && <RecursosSection />}
        {section === "marketing" && <MarketingSection />}
        {section === "ventas" && <VentasSection />}
        {section === "finanzas" && <FinanzasSection />}
        {section === "estrategia" && <EstrategiaSection business={business} />}
        {section === "dashboard" && <DashboardSection business={business} />}
        {section === "tablero" && <TableroSection />}
      </div>
    </div>
  );
}
