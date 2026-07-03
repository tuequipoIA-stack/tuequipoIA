import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { obtenerPreapproval } from "@/lib/mercadopago";
import { obtenerPrecioMembresia } from "@/lib/appConfig";

// Devuelve el estado de la suscripción del usuario logueado, combinando
// lo que tenemos guardado en profiles con el estado en vivo de MercadoPago
// (medio de pago, próximo cobro) cuando está disponible.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, trial_ends_at, mercadopago_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  let mp = null;
  if (profile?.mercadopago_subscription_id) {
    try {
      mp = await obtenerPreapproval(profile.mercadopago_subscription_id);
    } catch (e) {
      // si falla la consulta en vivo, seguimos mostrando lo que tenemos guardado
    }
  }

  // Si ya tiene una suscripción en MercadoPago, mostramos el monto que
  // quedó fijado ahí (puede diferir del precio actual si se cambió
  // después). Si todavía no se suscribió, mostramos el precio vigente.
  const precio = mp?.auto_recurring?.transaction_amount || (await obtenerPrecioMembresia());

  return NextResponse.json({
    subscriptionStatus: profile?.subscription_status || "trial",
    trialEndsAt: profile?.trial_ends_at || null,
    precio,
    mercadopago: mp
      ? {
          status: mp.status,
          paymentMethodId: mp.payment_method_id || null,
          nextPaymentDate: mp?.auto_recurring?.next_payment_date || null,
          lastChargedDate: mp?.summarized?.last_charged_date || null,
          initPoint: mp.init_point || null,
        }
      : null,
  });
}
