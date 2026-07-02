"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import BrandHeader from "@/components/BrandHeader";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Si el proyecto tiene confirmación de email activada, no hay sesión todavía.
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setEnviado(true);
    }
  };

  return (
    <div style={{ background: BRAND.navy }} className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <BrandHeader />

        <h1 style={{ color: BRAND.cream }} className="text-xl font-semibold text-center mb-6">Creá tu cuenta</h1>

        {enviado ? (
          <p style={{ color: BRAND.cream }} className="text-sm text-center">
            Te mandamos un mail para confirmar tu cuenta. Una vez confirmada, ya podés iniciar sesión.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ background: "#242440", color: BRAND.cream, border: "1px solid #35354f" }} />
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña (mínimo 6 caracteres)"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ background: "#242440", color: BRAND.cream, border: "1px solid #35354f" }} />

            {error && <p className="text-xs" style={{ color: "#e08a86" }}>{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
              style={{ background: BRAND.teal, color: BRAND.navy }}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        )}

        <p style={{ color: "#8b8b9a" }} className="text-xs text-center mt-5">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" style={{ color: BRAND.teal }}>Iniciá sesión</Link>
        </p>
      </div>
    </div>
  );
}
