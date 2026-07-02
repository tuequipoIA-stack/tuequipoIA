"use client";

import Link from "next/link";
import { BRAND } from "@/lib/constants";
import BrandHeader from "@/components/BrandHeader";

export default function ResultadoSuscripcionPage() {
  return (
    <div style={{ background: BRAND.navy }} className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <BrandHeader />

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
