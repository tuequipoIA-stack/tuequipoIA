import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
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

// Elimina un usuario para siempre (perfil, datos de app, etc. se borran en
// cascada por las foreign keys). Exige confirmar con la contraseña del
// propio admin como último resguardo antes de una acción irreversible.
export async function DELETE(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  if (id === auth.user.id) {
    return NextResponse.json({ error: "No podés eliminar tu propia cuenta de admin desde acá." }, { status: 400 });
  }

  const { password } = await request.json();
  if (!password) {
    return NextResponse.json({ error: "Falta la contraseña" }, { status: 400 });
  }

  // Verificamos la identidad del admin re-autenticando con su contraseña,
  // en un cliente aparte que no toca la sesión/cookies actuales.
  const verificador = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { error: passError } = await verificador.auth.signInWithPassword({
    email: auth.user.email,
    password,
  });
  if (passError) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
