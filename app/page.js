"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { BRAND, EQUIPO_HABILITADO } from "@/lib/constants";
import LogoMark from "@/components/LogoMark";
import * as storage from "@/lib/storage";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid } from "@/lib/helpers";
import { createClient } from "@/lib/supabase/client";
import { UnidadProvider, useUnidad } from "@/components/UnidadProvider";
import Sidebar from "@/components/Sidebar";
import Onboarding from "@/components/Onboarding";
import HelpButton from "@/components/HelpButton";
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

function PantallaCarga() {
  return (
    <div className="w-full h-screen flex items-center justify-center" style={{ background: BRAND.navy, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center animate-pulse" style={{ background: BRAND.teal }}>
        <LogoMark size={24} color="#ffffff" />
      </div>
    </div>
  );
}

// Contenido de la app una vez que ya sabemos qué unidad de negocio está
// activa (vive adentro de UnidadProvider para poder usar useUnidad/useUnidadStorage).
function AppShell({ isAdmin, bloqueado }) {
  const { unidadId, unidadActual } = useUnidad();
  const { loadData, saveData } = useUnidadStorage();
  const [business, setBusiness] = useState(null);
  const [section, setSection] = useState(isAdmin ? "admin" : "dashboard");

  useEffect(() => {
    if (!unidadId) { setBusiness(null); return; }
    loadData("negocio-perfil", null).then((b) => {
      setBusiness(b || { nombre: unidadActual?.nombre, rubro: unidadActual?.rubro, tipoNegocio: unidadActual?.tipo_negocio });
    });
  }, [unidadId]);

  const enPerfil = section === "perfil";
  const restringirContenido = bloqueado && !enPerfil;

  if (!unidadId && !isAdmin) {
    return <PantallaCarga />;
  }

  return (
    <div className="w-full h-screen flex flex-col" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {bloqueado && (
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 shrink-0" style={{ background: "#b3453f" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} color="#ffffff" />
            <span className="text-sm text-white">
              No pudimos procesar tu pago. Regularizá tu suscripción para volver a usar la plataforma.
            </span>
          </div>
          <button onClick={() => setSection("perfil")}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0" style={{ background: "#ffffff", color: "#b3453f" }}>
            Actualizar pago
          </button>
        </div>
      )}
      <div className="flex-1 flex min-h-0">
        <Sidebar active={section} onChange={setSection} isAdmin={isAdmin} />
        <div style={{ background: BRAND.cream }} className="flex-1 h-full overflow-y-auto p-6 relative">
          <HelpButton />
          <div key={`${section}-${unidadId}`} className="seccion-animada"
            style={restringirContenido ? { filter: "grayscale(1) opacity(0.5)", pointerEvents: "none", userSelect: "none" } : undefined}>
            {section === "equipo" && EQUIPO_HABILITADO && <EquipoSection business={business} />}
            {section === "recursos" && <RecursosSection isAdmin={isAdmin} />}
            {section === "marketing" && <MarketingSection />}
            {section === "ventas" && <VentasSection business={business} />}
            {section === "finanzas" && <FinanzasSection business={business} />}
            {section === "estrategia" && <EstrategiaSection business={business} />}
            {section === "dashboard" && <DashboardSection business={business} />}
            {section === "tablero" && <TableroSection />}
            {section === "perfil" && <PerfilSection business={business} onBusinessUpdate={setBusiness} />}
            {section === "admin" && isAdmin && <AdminSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TuEquipoIA() {
  const [stage, setStage] = useState("loading");
  const [isAdmin, setIsAdmin] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [unidades, setUnidades] = useState([]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStage("app"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, subscription_status, trial_ends_at, mercadopago_subscription_id")
        .eq("id", user.id)
        .maybeSingle();

      const admin = !!profile?.is_admin;
      setIsAdmin(admin);

      if (!admin) {
        const enTrial = profile?.subscription_status === "trial" && profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
        const activa = profile?.subscription_status === "active";
        if (!activa && !enTrial) {
          if (!profile?.mercadopago_subscription_id) {
            window.location.href = "/suscripcion";
            return;
          }
          setBloqueado(true);
        }
      }

      const resUnidades = await fetch("/api/unidades").then((r) => r.json());
      const listaUnidades = resUnidades.unidades || [];
      setUnidades(listaUnidades);

      if (listaUnidades.length === 0 && !admin) {
        setStage("onboarding");
      } else {
        setStage("app");
      }
    })();
  }, []);

  const finalizarOnboarding = async (perfil) => {
    const res = await fetch("/api/unidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: perfil.nombre || "Mi negocio", rubro: perfil.rubro, tipoNegocio: perfil.tipoNegocio }),
    });
    const data = await res.json();
    const unidad = data.unidad;

    await storage.saveData("negocio-perfil", perfil, unidad.id);
    if (perfil.objetivo3Meses && perfil.objetivo3Meses.trim()) {
      const actualizado = {
        vision: "",
        objetivos: [{ id: uid(), plazo: "trimestral", texto: perfil.objetivo3Meses.trim(), completado: false }],
      };
      await storage.saveData("estrategia-data", actualizado, unidad.id);
    }

    setUnidades([unidad]);
    setStage("app");
  };

  if (stage === "loading") return <PantallaCarga />;

  if (stage === "onboarding") {
    return (
      <div className="w-full h-screen" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Onboarding onStart={finalizarOnboarding} />
      </div>
    );
  }

  return (
    <UnidadProvider unidadesIniciales={unidades}>
      <AppShell isAdmin={isAdmin} bloqueado={bloqueado} />
    </UnidadProvider>
  );
}
