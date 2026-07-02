"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import BrandHeader from "@/components/BrandHeader";
import PasswordInput from "@/components/PasswordInput";

export default function ConfirmarResetPasswordPage() {
  const [sesionLista, setSesionLista] = useState(false);
  const [sesionValida, setSesionValida] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [listo, setListo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // El link del mail deja al usuario logueado con una sesión de recuperación.
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setSesionValida(!!data?.user);
      setSesionLista(true);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("La contraseña tiene que tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setListo(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  };

  return (
    <div style={{ background: BRAND.navy }} className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <BrandHeader />

        <h1 style={{ color: BRAND.cream }} className="text-xl font-semibold text-center mb-6">Elegí tu nueva contraseña</h1>

        {!sesionLista && (
          <p style={{ color: "#8b8b9a" }} className="text-sm text-center">Verificando el link...</p>
        )}

        {sesionLista && !sesionValida && (
          <p style={{ color: "#e08a86" }} className="text-sm text-center">
            Este link venció o ya se usó. Pedí uno nuevo desde "¿Olvidaste tu contraseña?" en el login.
          </p>
        )}

        {sesionLista && sesionValida && !listo && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña" required minLength={6} />
            <PasswordInput value={confirmar} onChange={(e) => setConfirmar(e.target.value)} placeholder="Repetí la contraseña" required minLength={6} />

            {error && <p className="text-xs" style={{ color: "#e08a86" }}>{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
              style={{ background: BRAND.teal, color: BRAND.navy }}>
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        )}

        {listo && (
          <p style={{ color: BRAND.teal }} className="text-sm text-center">Contraseña actualizada ✓ Entrando...</p>
        )}
      </div>
    </div>
  );
}
