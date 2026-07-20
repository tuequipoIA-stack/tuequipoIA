"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, LogOut, Shield, LayoutGrid } from "lucide-react";
import { BRAND, NAV_GROUPS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import LogoMark from "@/components/LogoMark";
import UnidadSwitcher from "@/components/UnidadSwitcher";

const COLLAPSE_KEY = "tuequipoia-sidebar-collapsed";
const GRUPO_ABIERTO_KEY = "tuequipoia-sidebar-grupo-abierto";
const ANCHO_EXPANDIDO = 224;
const ANCHO_COLAPSADO = 68;

function NavButton({ active, collapsed, onClick, icon: Icon, label, sub = false }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group flex items-center rounded-xl text-sm font-semibold text-left transition-all duration-150 ease-out
      active:translate-y-[2px] active:shadow-none
      ${collapsed ? "justify-center px-0 py-3" : sub ? "gap-2.5 pl-6 pr-3 py-2.5" : "gap-3 px-3.5 py-3"}`}
      style={
        active
          ? { background: BRAND.teal, color: BRAND.navy, boxShadow: "0 2px 0 0 #12807f, 0 4px 10px -2px rgba(0,0,0,0.35)" }
          : { background: sub ? "transparent" : "#1f1f38", color: "#b4b4c4", boxShadow: sub ? "none" : "0 2px 0 0 #14142a" }
      }
    >
      <Icon size={sub ? 15 : 17} className="shrink-0" />
      {!collapsed && <span className={`truncate ${sub ? "text-[13px] font-medium" : ""}`}>{label}</span>}
    </button>
  );
}

// Botón de grupo (nivel superior): al presionarlo despliega hacia abajo los
// botones de cada sección de ese grupo. Se acuerda cuál quedó abierto.
function GroupButton({ label, icon: Icon, collapsed, open, onToggle, activeInside }) {
  return (
    <button
      onClick={onToggle}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center rounded-xl text-sm font-bold text-left transition-all duration-150 ease-out
      active:translate-y-[2px]
      ${collapsed ? "justify-center px-0 py-3" : "justify-between gap-2 px-3.5 py-3"}`}
      style={
        activeInside && !open
          ? { background: "#242452", color: BRAND.teal, boxShadow: "0 2px 0 0 #14142a" }
          : { background: "#14142a", color: BRAND.cream, boxShadow: "0 2px 0 0 #0c0c1a" }
      }
    >
      <span className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
        <Icon size={17} className="shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </span>
      {!collapsed && (
        <ChevronDown size={15} className="shrink-0 transition-transform duration-150" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      )}
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
  // Qué grupo ("tuequipoia" / "tuequipoia-panel") está desplegado. Solo uno
  // a la vez, como un acordeón, para no llenar la barra de botones.
  const [grupoAbierto, setGrupoAbierto] = useState("tuequipoia");

  // El botón "Admin" (gestión de suscriptores) ya existía suelto; ahora
  // vive dentro del grupo "TuequipoIA" para que solo queden 2 botones
  // de primer nivel, tal como se pidió.
  const grupos = NAV_GROUPS.map((g) => {
    if (g.id === "tuequipoia" && isAdmin) {
      return { ...g, items: [...g.items, { id: "admin", label: "Admin", icon: Shield }] };
    }
    return g;
  }).filter((g) => !g.adminOnly || isAdmin);

  useEffect(() => {
    const guardado = typeof window !== "undefined" && window.localStorage.getItem(COLLAPSE_KEY);
    if (guardado === "1") setCollapsed(true);
    const grupoGuardado = typeof window !== "undefined" && window.localStorage.getItem(GRUPO_ABIERTO_KEY);
    if (grupoGuardado) setGrupoAbierto(grupoGuardado);
    setHidratado(true);
  }, []);

  // Si la sección activa pertenece a un grupo, ese grupo se despliega solo
  // (por ejemplo al entrar directo a una sección del Panel).
  useEffect(() => {
    const grupoDeActivo = grupos.find((g) => g.items.some((it) => it.id === active));
    if (grupoDeActivo) setGrupoAbierto(grupoDeActivo.id);
  }, [active]);

  const toggleGrupo = (id) => {
    setGrupoAbierto((prev) => {
      const nuevo = prev === id ? null : id;
      window.localStorage.setItem(GRUPO_ABIERTO_KEY, nuevo || "");
      return nuevo;
    });
  };

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

        <div className="flex flex-col gap-2 mt-1 flex-1 overflow-y-auto">
          {grupos.map((grupo, i) => {
            const abierto = grupoAbierto === grupo.id;
            const activeInside = grupo.items.some((it) => it.id === active);
            return (
              <div key={grupo.id} className={i > 0 ? "pt-2" : undefined} style={i > 0 ? { borderTop: "1px solid #2a2a45" } : undefined}>
                <GroupButton
                  label={grupo.label}
                  icon={grupo.id === "tuequipoia-panel" ? Shield : LayoutGrid}
                  collapsed={collapsed && isDesktop}
                  open={abierto}
                  onToggle={() => toggleGrupo(grupo.id)}
                  activeInside={activeInside}
                />
                {abierto && (
                  <div className="flex flex-col gap-1 mt-1.5">
                    {grupo.items.map((item) => (
                      <NavButton key={item.id} active={active === item.id} collapsed={collapsed && isDesktop}
                        onClick={() => seleccionar(item.id)} icon={item.icon} label={item.label} sub />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
