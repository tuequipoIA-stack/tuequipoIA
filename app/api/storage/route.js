import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Storage por usuario Y por unidad de negocio en Supabase (tabla app_data:
// user_id, unidad_id, key, value jsonb). Una empresa puede tener varias
// unidades (Picadas, Viandas diarias...), cada una con sus propios datos.
// RLS ya garantiza que cada usuario solo toca sus propias filas; acá además
// filtramos explícitamente por user_id y unidad_id.

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
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
