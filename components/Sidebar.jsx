"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { BRAND, NAV_ITEMS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { logoUrl } from "@/lib/logo";

export default function Sidebar({ business, active, onChange }) {
  const router = useRouter();
  const [logoSrc, setLogoSrc] = useState(null);
  const [logoError, setLogoError] = useState(false);

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

  return (
    <div style={{ background: BRAND.navy, width: "200px", minWidth: "200px" }} className="h-full flex flex-col p-4">
      <div className="flex items-center gap-2 mb-1 px-1">
        {logoSrc && !logoError ? (
          <img src={logoSrc} alt="Logo" className="w-[17px] h-[17px] object-contain rounded-sm" onError={() => setLogoError(true)} />
        ) : (
          <Sparkles size={17} color={BRAND.teal} />
        )}
        <span style={{ color: BRAND.cream }} className="text-xs tracking-widest uppercase font-medium">Tu Equipo IA</span>
      </div>
      {business?.nombre && (
        <div style={{ color: "#6f6f82" }} className="text-[11px] px-1 mb-5 truncate">{business.nombre}</div>
      )}
      <div className="flex flex-col gap-1 mt-2 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onChange(item.id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
              style={isActive ? { background: BRAND.teal, color: BRAND.navy } : { background: "transparent", color: "#a9a9b8" }}>
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>
      <button onClick={cerrarSesion}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left"
        style={{ background: "transparent", color: "#6f6f82" }}>
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </div>
  );
}
