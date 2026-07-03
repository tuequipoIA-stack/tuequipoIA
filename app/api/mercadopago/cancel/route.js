import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelarPreapproval } from "@/lib/mercadopago";

// Permite a cualquier usuario logueado dar de baja su propia membresía.
// Si tiene una suscripción activa en MercadoPago, la cancelamos ahí (corta
// los cobros futuros); en todos los casos marcamos subscription_status como
// "canceled" en el momento (no esperamos al webhook para reflejarlo).
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("mercadopago_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.mercadopago_subscription_id) {
    try {
      await cancelarPreapproval(profile.mercadopago_subscription_id);
    } catch (e) {
      return NextResponse.json({ error: e.message || "No se pudo cancelar en MercadoPago." }, { status: 502 });
    }
  }

  // Usamos el cliente admin: los usuarios ya no tienen permiso de RLS para
  // escribir directo en su propia fila de profiles (para que nadie pueda
  // marcarse "active" a mano sin pagar).
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ subscription_status: "canceled" })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
