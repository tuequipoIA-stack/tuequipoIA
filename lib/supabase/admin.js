import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente "admin" con la secret key de Supabase: bypassea RLS.
// SOLO usar server-side, y SOLO en contextos sin sesión de usuario propia
// (ej: el webhook de MercadoPago, que es un llamado servidor-a-servidor
// y necesita poder actualizar el perfil de cualquier usuario según su
// external_reference). Nunca importar este archivo desde un Client Component.
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) {
    throw new Error("Falta configurar SUPABASE_SERVICE_ROLE_KEY en .env.local");
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
