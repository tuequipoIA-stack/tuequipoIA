"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import BrandHeader from "@/components/BrandHeader";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/confirmar`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEnviado(true);
  };

  return (
    <div style={{ background: BRAND.navy }} className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <BrandHeader />

        <h1 style={{ color: BRAND.cream }} className="text-xl font-semibold text-center mb-2">Recuperar contraseña</h1>
        <p style={{ color: "#8b8b9a" }} className="text-sm text-center mb-6">
          Te mandamos un link a tu email para que puedas elegir una contraseña nueva.
        </p>

        {enviado ? (
          <p style={{ color: BRAND.cream }} className="text-sm text-center">
            Listo, revisá tu correo (y la carpeta de spam) — el link puede tardar unos minutos en llegar.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ background: "#242440", color: BRAND.cream, border: "1px solid #35354f" }} />

            {error && <p className="text-xs" style={{ color: "#e08a86" }}>{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
              style={{ background: BRAND.teal, color: BRAND.navy }}>
              {loading ? "Enviando..." : "Enviar link de recuperación"}
            </button>
          </form>
        )}

        <p style={{ color: "#8b8b9a" }} className="text-xs text-center mt-5">
          <Link href="/login" style={{ color: BRAND.teal }}>Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
