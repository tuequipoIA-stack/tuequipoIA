import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerPreapproval } from "@/lib/mercadopago";
import { obtenerPrecioMembresia } from "@/lib/appConfig";

// Métricas de negocio para el admin: cuántos suscriptores hay, cuántos
// activos, cuánto se estima que va a entrar el próximo mes, y cuánto entró
// en total hasta ahora. Los montos reales salen de MercadoPago
// (auto_recurring.transaction_amount para lo que viene, summarized.charged_amount
// para lo ya cobrado) — no hay forma de saber cuánto entró por
// efectivo/transferencia salvo lo que el admin activó manualmente, así que
// esos casos se estiman con el precio vigente pero no se suman al histórico.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email, is_admin, subscription_status, trial_ends_at, mercadopago_subscription_id, subscription_started_at")
    .eq("is_admin", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ahora = new Date();
  const totalSuscriptores = profiles.length;
  const activos = profiles.filter((p) => p.subscription_status === "active");
  const enPrueba = profiles.filter((p) => p.subscription_status === "trial" && p.trial_ends_at && new Date(p.trial_ends_at) > ahora);
  const pruebaVencida = profiles.filter((p) => p.subscription_status === "trial" && (!p.trial_ends_at || new Date(p.trial_ends_at) <= ahora));
  const pagoVencido = profiles.filter((p) => p.subscription_status === "past_due");
  const cancelados = profiles.filter((p) => p.subscription_status === "canceled");

  const conMercadoPago = profiles.filter((p) => p.mercadopago_subscription_id);
  const resultadosMp = await Promise.allSettled(
    conMercadoPago.map((p) => obtenerPreapproval(p.mercadopago_subscription_id))
  );

  const precioVigente = await obtenerPrecioMembresia();

  let proximoMesEstimado = 0;
  let totalHistorico = 0;
  let usuariosConErrorMp = 0;

  conMercadoPago.forEach((p, i) => {
    const r = resultadosMp[i];
    if (r.status !== "fulfilled") {
      usuariosConErrorMp += 1;
      return;
    }
    const mp = r.value;
    totalHistorico += Number(mp?.summarized?.charged_amount) || 0;
    if (mp?.status === "authorized") {
      proximoMesEstimado += Number(mp?.auto_recurring?.transaction_amount) || 0;
    }
  });

  // Activos "manuales" (sin id de MercadoPago, activados a mano por
  // efectivo/transferencia): se estiman al precio vigente para la
  // proyección, pero no hay forma de sumarlos al histórico ya cobrado.
  const activosManuales = activos.filter((p) => !p.mercadopago_subscription_id);
  proximoMesEstimado += activosManuales.length * precioVigente;

  return NextResponse.json({
    totalSuscriptores,
    activos: activos.length,
    enPrueba: enPrueba.length,
    pruebaVencida: pruebaVencida.length,
    pagoVencido: pagoVencido.length,
    cancelados: cancelados.length,
    activosManuales: activosManuales.length,
    proximoMesEstimado,
    totalHistorico,
    usuariosConErrorMp,
    precioVigente,
  });
}
