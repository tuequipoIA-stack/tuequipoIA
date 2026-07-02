"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, Shield } from "lucide-react";
import { BRAND, NAV_ITEMS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { logoUrl } from "@/lib/logo";
import LogoMark from "@/components/LogoMark";

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

export default function Sidebar({ business, active, onChange, isAdmin }) {
  const router = useRouter();
  const [logoSrc, setLogoSrc] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    const guardado = typeof window !== "undefined" && window.localStorage.getItem(COLLAPSE_KEY);
    if (guardado === "1") setCollapsed(true);
    setHidratado(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const nuevo = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, nuevo ? "1" : "0");
      return nuevo;
    });
  };

  useEffect(() => {
    if (!business?.logoUpdatedAt) {
      setLogoSrc(null);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setLogoError(false);
        setLogoSrc(logoUrl(data.user.id, business.logoUpdatedAt));
      }
    });
  }, [business?.logoUpdatedAt]);

  const cerrarSesion = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const ancho = collapsed ? ANCHO_COLAPSADO : ANCHO_EXPANDIDO;

  return (
    <div
      style={{
        background: BRAND.navy,
        width: ancho,
        minWidth: ancho,
        transition: hidratado ? "width 180ms ease-out, min-width 180ms ease-out" : "none",
      }}
      className="h-full flex flex-col p-3 relative"
    >
      {/* Botón de colapsar */}
      <button
        onClick={toggleCollapsed}
        title={collapsed ? "Expandir menú" : "Contraer menú"}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-transform active:translate-y-[1px]"
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

      {!collapsed && business?.nombre && (
        <div className="flex items-center gap-1.5 px-1 mb-5">
          {logoSrc && !logoError && (
            <img src={logoSrc} alt="Logo" className="w-4 h-4 object-contain rounded-sm shrink-0" onError={() => setLogoError(true)} />
          )}
          <div style={{ color: "#8686a0" }} className="text-[11px] truncate">{business.nombre}</div>
        </div>
      )}
      {collapsed && <div className="mb-5" />}

      <div className="flex flex-col gap-1.5 mt-1 flex-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavButton key={item.id} active={active === item.id} collapsed={collapsed}
            onClick={() => onChange(item.id)} icon={item.icon} label={item.label} />
        ))}
        {isAdmin && (
          <div className={collapsed ? "mt-1" : "mt-2 pt-2"} style={!collapsed ? { borderTop: "1px solid #2a2a45" } : undefined}>
            <NavButton active={active === "admin"} collapsed={collapsed}
              onClick={() => onChange("admin")} icon={Shield} label="Admin" />
          </div>
        )}
      </div>

      <button onClick={cerrarSesion}
        title={collapsed ? "Cerrar sesión" : undefined}
        className={`flex items-center rounded-xl text-sm font-medium text-left transition-all duration-150 active:translate-y-[2px]
          ${collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3.5 py-2.5"}`}
        style={{ background: "transparent", color: "#6f6f82" }}>
        <LogOut size={16} className="shrink-0" />
        {!collapsed && "Cerrar sesión"}
      </button>
    </div>
  );
}
