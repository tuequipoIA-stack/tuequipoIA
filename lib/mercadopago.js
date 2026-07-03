// Helper mínimo contra la API de MercadoPago (Suscripciones / Preapproval).
// No usamos el SDK oficial para mantener las dependencias livianas — son
// dos llamados REST bien simples.
// Docs: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/landing

const MP_API = "https://api.mercadopago.com";

function accessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("Falta configurar MERCADOPAGO_ACCESS_TOKEN en .env.local");
  return token;
}

// Crea una suscripción (preapproval) para un usuario puntual y devuelve
// la respuesta completa de MercadoPago, que incluye `init_point` (la URL
// de checkout a la que hay que redirigir al usuario) y `id`.
export async function crearPreapproval({ email, userId, backUrl, notificationUrl, precio }) {
  const res = await fetch(`${MP_API}/preapproval`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify({
      reason: "Membresía Tu Equipo IA",
      external_reference: userId,
      payer_email: email,
      back_url: backUrl,
      notification_url: notificationUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: precio,
        currency_id: "ARS",
      },
      status: "pending",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Error de MercadoPago (${res.status})`);
  }
  return data;
}

// Trae el estado actual de una suscripción por id. El webhook nunca debe
// confiar en el payload que manda MercadoPago tal cual: siempre hay que
// volver a pedir el recurso por id para confirmar el estado real.
export async function obtenerPreapproval(id) {
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Error de MercadoPago (${res.status})`);
  }
  return data;
}

// Mapea el status de MercadoPago a nuestro subscription_status.
// MercadoPago: pending | authorized | paused | cancelled
export function mapEstadoMercadoPago(mpStatus) {
  if (mpStatus === "authorized") return "active";
  if (mpStatus === "paused") return "past_due";
  if (mpStatus === "cancelled") return "canceled";
  return "trial";
}

// Cambia la tarjeta asociada a una suscripción existente.
// https://www.mercadopago.com.ar/developers/es/docs/subscriptions/subscription-management
export async function actualizarTarjetaPreapproval(id, cardTokenId) {
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify({ card_token_id: cardTokenId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Error de MercadoPago (${res.status})`);
  }
  return data;
}

// Cancela una suscripción — corta los cobros futuros en MercadoPago. No
// devuelve el último pago ya hecho, solo evita que se vuelva a cobrar.
export async function cancelarPreapproval(id) {
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify({ status: "cancelled" }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Error de MercadoPago (${res.status})`);
  }
  return data;
}

// Cambia el monto de una suscripción ya existente. Esto NO cambia la fecha
// del próximo cobro (next_payment_date sigue igual) — solo el monto que se
// le va a cobrar en esa fecha y en las siguientes. Se usa desde el panel de
// admin para "empujar" un cambio de precio a gente que ya está suscripta.
export async function actualizarMontoPreapproval(id, monto) {
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken()}`,
    },
    body: JSON.stringify({ auto_recurring: { transaction_amount: monto, currency_id: "ARS" } }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Error de MercadoPago (${res.status})`);
  }
  return data;
}
