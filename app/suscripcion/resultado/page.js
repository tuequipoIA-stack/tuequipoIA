"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BRAND } from "@/lib/constants";

export default function ResultadoSuscripcionPage() {
  return (
    <div style={{ background: BRAND.navy }} className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Sparkles size={20} color={BRAND.teal} />
          <span style={{ color: BRAND.cream }} className="text-sm tracking-widest uppercase font-medium">Tu Equipo IA</span>
        </div>

        <h1 style={{ color: BRAND.cream }} className="text-xl font-semibold mb-2">¡Gracias!</h1>
        <p style={{ color: "#8b8b9a" }} className="text-sm mb-6">
          Estamos confirmando tu pago con MercadoPago. Puede tardar unos segundos en reflejarse.
        </p>

        <Link href="/"
          className="inline-block rounded-lg px-5 py-3 text-sm font-semibold hover:opacity-90"
          style={{ background: BRAND.teal, color: BRAND.navy }}>
          Ir a la app
        </Link>
      </div>
    </div>
  );
}
