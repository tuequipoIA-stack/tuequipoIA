import { createAdminClient } from "@/lib/supabase/admin";

// Precio de la membresía por defecto, solo se usa si por algún motivo
// falla la lectura de app_config (no debería pasar en producción).
const PRECIO_FALLBACK_ARS = 10000;

// Lectura server-side del precio actual de la membresía. Usa el cliente
// admin (no depende de sesión) porque también se llama desde el webhook
// de MercadoPago, que corre sin usuario logueado.
export async function obtenerPrecioMembresia() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("app_config")
    .select("value")
    .eq("key", "membresia_precio_ars")
    .maybeSingle();
  const precio = Number(data?.value);
  return precio > 0 ? precio : PRECIO_FALLBACK_ARS;
}

export async function actualizarPrecioMembresia(nuevoPrecio) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("app_config")
    .upsert({ key: "membresia_precio_ars", value: nuevoPrecio, updated_at: new Date().toISOString() });
  if (error) throw error;
}
