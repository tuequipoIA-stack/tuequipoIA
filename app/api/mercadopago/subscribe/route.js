import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearPreapproval } from "@/lib/mercadopago";
import { obtenerPrecioMembresia } from "@/lib/appConfig";

// Crea la suscripción del usuario logueado y devuelve la URL de checkout
// de MercadoPago (init_point) para redirigirlo ahí.
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const origin = request.nextUrl.origin;

  try {
    const precio = await obtenerPrecioMembresia();
    const preapproval = await crearPreapproval({
      email: user.email,
      userId: user.id,
      backUrl: `${origin}/suscripcion/resultado`,
      notificationUrl: `${origin}/api/mercadopago/webhook`,
      precio,
    });

    // Guardamos el id de la suscripción ni bien se crea (todavía "pending",
    // el webhook la va a actualizar a "active" cuando el usuario complete
    // el pago en MercadoPago). Usamos el cliente admin porque los usuarios
    // ya no tienen permiso de RLS para escribir directo en su fila de profiles.
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ mercadopago_subscription_id: preapproval.id })
      .eq("id", user.id);

    return NextResponse.json({ init_point: preapproval.init_point });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
