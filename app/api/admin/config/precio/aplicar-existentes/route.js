import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerPrecioMembresia } from "@/lib/appConfig";
import { actualizarMontoPreapproval } from "@/lib/mercadopago";

// Devuelve cuántos suscriptores activos con MercadoPago se verían
// afectados si se aplica el precio actual — para mostrar antes de confirmar.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("email")
    .eq("subscription_status", "active")
    .not("mercadopago_subscription_id", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cantidad: data.length, precio: await obtenerPrecioMembresia() });
}

// Aplica el precio ACTUAL (el que está guardado en app_config) al monto de
// cada suscripción activa en MercadoPago. No cambia la fecha del próximo
// cobro, solo el monto que se va a cobrar de ahí en más. Es una acción
// explícita y manual — nunca se dispara sola al cambiar el precio.
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  const precio = await obtenerPrecioMembresia();

  const { data: usuarios, error } = await admin
    .from("profiles")
    .select("id, email, mercadopago_subscription_id")
    .eq("subscription_status", "active")
    .not("mercadopago_subscription_id", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const resultados = [];
  for (const u of usuarios) {
    try {
      await actualizarMontoPreapproval(u.mercadopago_subscription_id, precio);
      resultados.push({ email: u.email, ok: true });
    } catch (e) {
      resultados.push({ email: u.email, ok: false, error: e.message });
    }
  }

  const exitosos = resultados.filter((r) => r.ok).length;
  return NextResponse.json({ precio, total: resultados.length, exitosos, resultados });
}
