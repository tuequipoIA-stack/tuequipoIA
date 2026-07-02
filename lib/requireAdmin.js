import { createClient } from "@/lib/supabase/server";

// Confirma que quien llama está logueado Y marcado como is_admin en su
// propio perfil (lectura permitida por RLS: auth.uid() = id). Recién
// después de esto se puede usar el cliente admin para leer datos de
// otros usuarios — nunca al revés.
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, status: 401, error: "No autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return { ok: false, status: 403, error: "No autorizado" };
  }

  return { ok: true, user };
}
