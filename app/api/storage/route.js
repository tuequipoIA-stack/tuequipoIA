import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tieneAccesoActivo, SIN_ACCESO_ERROR } from "@/lib/subscriptionGate";

// Storage por usuario Y por unidad de negocio en Supabase (tabla app_data:
// user_id, unidad_id, key, value jsonb). Una empresa puede tener varias
// unidades (Picadas, Viandas diarias...), cada una con sus propios datos.
// RLS ya garantiza que cada usuario solo toca sus propias filas; acá además
// filtramos explícitamente por user_id y unidad_id.
//
// Además: si la persona no tiene acceso activo (prueba vencida, se dio de
// baja, o el admin le cortó el acceso), no puede leer ni escribir nada acá
// — esto es lo que de verdad bloquea tareas, ventas, productos, etc. para
// cuentas inactivas, más allá de lo que se ve grisado en la pantalla.

async function verificarAcceso(supabase, userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, subscription_status, trial_ends_at")
    .eq("id", userId)
    .maybeSingle();
  return tieneAccesoActivo(profile);
}

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!(await verificarAcceso(supabase, user.id))) {
    return NextResponse.json({ error: SIN_ACCESO_ERROR }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const unidadId = searchParams.get("unidadId");
  if (!key) {
    return NextResponse.json({ error: "Falta el parámetro 'key'" }, { status: 400 });
  }
  if (!unidadId) {
    return NextResponse.json({ error: "Falta el parámetro 'unidadId'" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("app_data")
    .select("value")
    .eq("user_id", user.id)
    .eq("unidad_id", unidadId)
    .eq("key", key)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ value: data?.value ?? null });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!(await verificarAcceso(supabase, user.id))) {
    return NextResponse.json({ error: SIN_ACCESO_ERROR }, { status: 403 });
  }

  const body = await request.json();
  const { key, value, unidadId } = body || {};
  if (!key) {
    return NextResponse.json({ error: "Falta 'key'" }, { status: 400 });
  }
  if (!unidadId) {
    return NextResponse.json({ error: "Falta 'unidadId'" }, { status: 400 });
  }

  const { error } = await supabase
    .from("app_data")
    .upsert(
      { user_id: user.id, unidad_id: unidadId, key, value, updated_at: new Date().toISOString() },
      { onConflict: "user_id,unidad_id,key" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
