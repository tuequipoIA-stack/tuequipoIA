"use client";

import { useEffect, useState } from "react";
import { BRAND, EQUIPO_HABILITADO } from "@/lib/constants";
import LogoMark from "@/components/LogoMark";
import { loadData, saveData } from "@/lib/storage";
import { uid } from "@/lib/helpers";
import { createClient } from "@/lib/supabase/client";
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
import PerfilSection from "@/components/sections/PerfilSection";
import AdminSection from "@/components/sections/AdminSection";

export default function TuEquipoIA() {
  const [stage, setStage] = useState("loading");
  const [business, setBusiness] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [section, setSection] = useState("dashboard");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      let admin = false;
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
        admin = !!profile?.is_admin;
      }
      setIsAdmin(admin);

      const perfil = await loadData("negocio-perfil", null);
      if (perfil && perfil.nombre) {
        setBusiness(perfil);
        setStage("app");
      } else if (admin) {
        // los administradores no necesitan completar el onboarding de negocio
        setSection("admin");
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
        <div className="w-11 h-11 rounded-xl flex items-center justify-center animate-pulse" style={{ background: BRAND.teal }}>
          <LogoMark size={24} color="#ffffff" />
        </div>
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
      <Sidebar business={business} active={section} onChange={setSection} isAdmin={isAdmin} />
      <div style={{ background: BRAND.cream }} className="flex-1 h-full overflow-y-auto p-6">
       <div key={section} className="seccion-animada">
        {section === "equipo" && EQUIPO_HABILITADO && <EquipoSection business={business} />}
        {section === "recursos" && <RecursosSection isAdmin={isAdmin} />}
        {section === "marketing" && <MarketingSection />}
        {section === "ventas" && <VentasSection />}
        {section === "finanzas" && <FinanzasSection />}
        {section === "estrategia" && <EstrategiaSection business={business} />}
        {section === "dashboard" && <DashboardSection business={business} />}
        {section === "tablero" && <TableroSection />}
        {section === "perfil" && <PerfilSection business={business} onBusinessUpdate={setBusiness} />}
        {section === "admin" && isAdmin && <AdminSection />}
       </div>
      </div>
    </div>
  );
}
