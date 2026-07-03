import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tieneAccesoActivo, SIN_ACCESO_ERROR } from "@/lib/subscriptionGate";

// Editar o borrar una unidad de negocio puntual. RLS restringe todo a las
// unidades del propio usuario. Al borrar una unidad, sus datos (app_data)
// se borran en cascada — se avisa esto claramente en la UI antes de llamar acá.

async function verificarAcceso(supabase, userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, subscription_status, trial_ends_at")
    .eq("id", userId)
    .maybeSingle();
  return tieneAccesoActivo(profile);
}

export async function PATCH(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!(await verificarAcceso(supabase, user.id))) {
    return NextResponse.json({ error: SIN_ACCESO_ERROR }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const cambios = {};
  if (body.nombre !== undefined) cambios.nombre = body.nombre.trim();
  if (body.rubro !== undefined) cambios.rubro = body.rubro || null;
  if (body.tipoNegocio !== undefined) cambios.tipo_negocio = body.tipoNegocio;

  const { data, error } = await supabase
    .from("unidades_negocio")
    .update(cambios)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ unidad: data });
}

export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!(await verificarAcceso(supabase, user.id))) {
    return NextResponse.json({ error: SIN_ACCESO_ERROR }, { status: 403 });
  }

  const { id } = await params;

  const { count } = await supabase
    .from("unidades_negocio")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (count <= 1) {
    return NextResponse.json({ error: "No podés borrar tu única unidad de negocio." }, { status: 400 });
  }

  const { error } = await supabase
    .from("unidades_negocio")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
