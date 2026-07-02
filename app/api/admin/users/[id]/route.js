import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

// Detalle completo de un usuario puntual: su perfil + todo lo que tiene
// cargado en app_data (ventas, gastos, tareas, plan de negocio, etc.).
// Pensado para que Marisa pueda entrar y ayudar a un suscriptor puntual,
// o entender qué está usando. Requiere is_admin.
export async function GET(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: profile, error: profileError }, { data: rows, error: rowsError }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).maybeSingle(),
    admin.from("app_data").select("key, value, updated_at").eq("user_id", id),
  ]);

  if (profileError || rowsError) {
    return NextResponse.json({ error: (profileError || rowsError).message }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const datos = {};
  (rows || []).forEach((r) => { datos[r.key] = r.value; });

  return NextResponse.json({ profile, datos });
}
