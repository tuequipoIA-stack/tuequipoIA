import { NextResponse } from "next/server";
import { obtenerPreapproval, mapEstadoMercadoPago } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";

// Webhook público (MercadoPago lo llama servidor-a-servidor, no hay sesión
// de usuario acá) — por eso usamos el cliente admin para poder actualizar
// el perfil del usuario que corresponda según external_reference.
//
// Nunca confiamos en el "status" que viene en el payload de la notificación:
// siempre volvemos a pedir el recurso por id a la API de MercadoPago antes
// de actualizar algo. Así, aunque alguien llame a este endpoint con un id
// inventado, lo único que pasa es que el fetch a MercadoPago falla o trae
// datos de otra suscripción que no matchea ningún external_reference.

function extraerPreapprovalId(body, searchParams) {
  const type = body?.type || searchParams.get("type") || searchParams.get("topic");
  const dataId = body?.data?.id || searchParams.get("data.id") || searchParams.get("id");
  if (!dataId) return null;
  if (type && !["subscription_preapproval", "preapproval"].includes(type)) return null;
  return dataId;
}

async function procesarNotificacion(request) {
  const { searchParams } = request.nextUrl;
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    // algunas notificaciones vienen solo por query params, sin body
  }

  const preapprovalId = extraerPreapprovalId(body, searchParams);
  if (!preapprovalId) {
    // no es una notificación de suscripción (puede ser de pago u otro tipo) — la ignoramos
    return NextResponse.json({ ok: true, skipped: true });
  }

  const preapproval = await obtenerPreapproval(preapprovalId);
  const userId = preapproval.external_reference;
  if (!userId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const subscription_status = mapEstadoMercadoPago(preapproval.status);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_status,
      mercadopago_subscription_id: preapproval.id,
      plan: "membresia",
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request) {
  try {
    return await procesarNotificacion(request);
  } catch (e) {
    // Devolvemos 200 igual para que MercadoPago no reintente en loop por
    // errores nuestros; el detalle queda en los logs del servidor.
    console.error("Error procesando webhook de MercadoPago:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

// MercadoPago a veces valida la URL con un GET simple.
export async function GET() {
  return NextResponse.json({ ok: true });
}
