"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, Shield } from "lucide-react";
import { BRAND, NAV_ITEMS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import LogoMark from "@/components/LogoMark";
import UnidadSwitcher from "@/components/UnidadSwitcher";

const COLLAPSE_KEY = "tuequipoia-sidebar-collapsed";
const ANCHO_EXPANDIDO = 208;
const ANCHO_COLAPSADO = 68;

function NavButton({ active, collapsed, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group flex items-center rounded-xl text-sm font-semibold text-left transition-all duration-150 ease-out
      active:translate-y-[2px] active:shadow-none
      ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-3"}`}
      style={
        active
          ? { background: BRAND.teal, color: BRAND.navy, boxShadow: "0 2px 0 0 #12807f, 0 4px 10px -2px rgba(0,0,0,0.35)" }
          : { background: "#1f1f38", color: "#b4b4c4", boxShadow: "0 2px 0 0 #14142a" }
      }
    >
      <Icon size={17} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

export default function Sidebar({ active, onChange, isAdmin, mobileOpen = false, onCloseMobile }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [hidratado, setHidratado] = useState(false);
  // En mobile el drawer siempre se muestra expandido (con etiquetas legibles),
  // sin importar la preferencia de "colapsado" que es un concepto solo de escritorio.
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const guardado = typeof window !== "undefined" && window.localStorage.getItem(COLLAPSE_KEY);
    if (guardado === "1") setCollapsed(true);
    setHidratado(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const actualizar = () => setIsDesktop(mq.matches);
    actualizar();
    mq.addEventListener("change", actualizar);
    return () => mq.removeEventListener("change", actualizar);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const nuevo = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, nuevo ? "1" : "0");
      return nuevo;
    });
  };

  const cerrarSesion = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const seleccionar = (id) => {
    onChange(id);
    onCloseMobile?.();
  };

  const ancho = !isDesktop ? ANCHO_EXPANDIDO : collapsed ? ANCHO_COLAPSADO : ANCHO_EXPANDIDO;

  return (
    <>
      {/* Fondo oscuro detrás del drawer, solo en mobile y solo si está abierto */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={onCloseMobile}
        />
      )}
      <div
        style={{
          background: BRAND.navy,
          width: ancho,
          minWidth: ancho,
          transition: hidratado ? "width 180ms ease-out, min-width 180ms ease-out" : "none",
        }}
        className={`h-full flex flex-col p-3 fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out
        md:static md:translate-x-0 md:z-auto
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Botón de colapsar (solo escritorio: en mobile el drawer siempre va expandido) */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
          className="hidden md:flex absolute -right-3 top-6 w-6 h-6 rounded-full items-center justify-center z-10 transition-transform active:translate-y-[1px]"
          style={{ background: BRAND.teal, color: BRAND.navy, boxShadow: "0 2px 6px rgba(0,0,0,0.35)" }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* Marca */}
        <div className={`flex items-center mb-1 px-1 ${collapsed ? "justify-center" : "gap-2"}`}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: BRAND.teal }}>
            <LogoMark size={19} color="#ffffff" />
          </div>
          {!collapsed && (
            <span style={{ color: BRAND.cream }} className="text-xs tracking-widest uppercase font-semibold truncate">
              Tu Equipo IA
            </span>
          )}
        </div>

        <UnidadSwitcher collapsed={collapsed && isDesktop} />

        <div className="flex flex-col gap-1.5 mt-1 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavButton key={item.id} active={active === item.id} collapsed={collapsed && isDesktop}
              onClick={() => seleccionar(item.id)} icon={item.icon} label={item.label} />
          ))}
          {isAdmin && (
            <div className={collapsed && isDesktop ? "mt-1" : "mt-2 pt-2"} style={!(collapsed && isDesktop) ? { borderTop: "1px solid #2a2a45" } : undefined}>
              <NavButton active={active === "admin"} collapsed={collapsed && isDesktop}
                onClick={() => seleccionar("admin")} icon={Shield} label="Admin" />
            </div>
          )}
        </div>

        <button onClick={cerrarSesion}
          title={collapsed && isDesktop ? "Cerrar sesión" : undefined}
          className={`flex items-center rounded-xl text-sm font-medium text-left transition-all duration-150 active:translate-y-[2px]
          ${collapsed && isDesktop ? "justify-center px-0 py-2.5" : "gap-2.5 px-3.5 py-2.5"}`}
          style={{ background: "transparent", color: "#6f6f82" }}>
          <LogOut size={16} className="shrink-0" />
          {!(collapsed && isDesktop) && "Cerrar sesión"}
        </button>
      </div>
    </>
  );
}
