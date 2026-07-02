import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { actualizarTarjetaPreapproval } from "@/lib/mercadopago";

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
    const actualizado = await actualizarTarjetaPreapproval(profile.mercadopago_subscription_id, token);
    return NextResponse.json({ ok: true, paymentMethodId: actualizado.payment_method_id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
