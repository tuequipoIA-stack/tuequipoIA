"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/constants";
import { money } from "@/lib/helpers";
import { createClient } from "@/lib/supabase/client";
import BrandHeader from "@/components/BrandHeader";
import TransferenciaBancaria from "@/components/perfil/TransferenciaBancaria";

export default function SuscripcionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [precio, setPrecio] = useState(null);
  const [mostrarTransferencia, setMostrarTransferencia] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/config/precio")
      .then((r) => r.json())
      .then((d) => setPrecio(d.precio))
      .catch(() => {});
  }, []);

  const suscribirse = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/mercadopago/subscribe", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar la suscripción.");
      window.location.href = data.init_point;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const cerrarSesion = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div style={{ background: BRAND.navy }} className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <BrandHeader />

        <h1 style={{ color: BRAND.cream }} className="text-xl font-semibold mb-2">Activá tu membresía</h1>
        <p style={{ color: "#8b8b9a" }} className="text-sm mb-6">
          Acceso completo a los 4 agentes y a todas las secciones de la app.
        </p>

        <div className="rounded-xl p-5 mb-6" style={{ background: "#242440", border: "1px solid #35354f" }}>
          <div style={{ color: BRAND.teal }} className="text-3xl font-semibold">{precio !== null ? money(precio) : "..."}</div>
          <div style={{ color: "#8b8b9a" }} className="text-xs mt-1">por mes</div>
        </div>

        {error && <p className="text-xs mb-4" style={{ color: "#e08a86" }}>{error}</p>}

        <button onClick={suscribirse} disabled={loading}
          className="w-full rounded-lg py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40 mb-3"
          style={{ background: BRAND.teal, color: BRAND.navy }}>
          {loading ? "Redirigiendo a MercadoPago..." : "Suscribirme con MercadoPago"}
        </button>

        {!mostrarTransferencia ? (
          <button onClick={() => setMostrarTransferencia(true)}
            className="text-xs font-medium mb-4" style={{ color: BRAND.teal }}>
            ¿Preferís pagar por transferencia?
          </button>
        ) : (
          <div className="rounded-xl p-4 mb-4 text-left" style={{ background: "#242440", border: "1px solid #35354f" }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: BRAND.cream }} className="text-xs font-semibold">Pagar por transferencia</span>
              <button onClick={() => setMostrarTransferencia(false)} className="text-xs font-medium" style={{ color: "#8b8b9a" }}>
                Cerrar
              </button>
            </div>
            <TransferenciaBancaria dark />
          </div>
        )}

        <button onClick={cerrarSesion} className="text-xs opacity-60 hover:opacity-100" style={{ color: BRAND.cream }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
