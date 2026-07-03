import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { actualizarTarjetaPreapproval, obtenerPreapproval, mapEstadoMercadoPago } from "@/lib/mercadopago";

// Recibe el card_token_id generado en el browser por MercadoPago.js
// (nunca vemos el número de tarjeta acá, solo el token ya seguro) y lo
// aplica a la suscripción existente del usuario logueado.
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ error: "Falta el token de la tarjeta" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("mercadopago_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.mercadopago_subscription_id) {
    return NextResponse.json({ error: "Todavía no tenés una suscripción activa para actualizar." }, { status: 400 });
  }

  try {
    // Si la suscripción todavía está "pending" (nunca se autorizó desde el
    // checkout de MercadoPago), hay que activarla en el mismo request en el
    // que mandamos la tarjeta — si no, la tarjeta queda guardada pero nunca
    // se ejecuta ningún cobro.
    const actual = await obtenerPreapproval(profile.mercadopago_subscription_id);
    const activar = actual.status === "pending";

    const actualizado = await actualizarTarjetaPreapproval(profile.mercadopago_subscription_id, token, { activar });
    const nuevoEstado = mapEstadoMercadoPago(actualizado.status);

    const admin = createAdminClient();
    const cambios = { subscription_status: nuevoEstado };
    if (nuevoEstado === "active") {
      const { data: actualProfile } = await admin.from("profiles").select("subscription_started_at").eq("id", user.id).maybeSingle();
      if (!actualProfile?.subscription_started_at) cambios.subscription_started_at = new Date().toISOString();
    }
    await admin.from("profiles").update(cambios).eq("id", user.id);

    return NextResponse.json({ ok: true, paymentMethodId: actualizado.payment_method_id, status: actualizado.status });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
