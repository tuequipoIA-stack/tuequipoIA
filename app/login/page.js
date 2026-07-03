"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import BrandHeader from "@/components/BrandHeader";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : error.message);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div style={{ background: BRAND.navy }} className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <BrandHeader variant="stacked" className="mb-9" />

        <h1 style={{ color: BRAND.cream }} className="text-xl font-semibold text-center mb-6">Iniciá sesión</h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none" style={{ background: "#242440", color: BRAND.cream, border: "1px solid #35354f" }} />
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required />

          <div className="text-right -mt-1">
            <Link href="/reset-password" className="text-xs" style={{ color: "#8b8b9a" }}>¿Olvidaste tu contraseña?</Link>
          </div>

          {error && <p className="text-xs" style={{ color: "#e08a86" }}>{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-lg py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
            style={{ background: BRAND.teal, color: BRAND.navy }}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p style={{ color: "#8b8b9a" }} className="text-xs text-center mt-5">
          ¿Todavía no tenés cuenta?{" "}
          <Link href="/signup" style={{ color: BRAND.teal }}>Creá una</Link>
        </p>
      </div>
    </div>
  );
}
