import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Storage por usuario en Supabase (tabla app_data: user_id, key, value jsonb).
// RLS en la tabla ya garantiza que cada usuario solo puede leer/escribir sus
// propias filas; acá además filtramos explícitamente por user_id.

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Falta el parámetro 'key'" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("app_data")
    .select("value")
    .eq("user_id", user.id)
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
  const { key, value } = body || {};
  if (!key) {
    return NextResponse.json({ error: "Falta 'key'" }, { status: 400 });
  }

  const { error } = await supabase
    .from("app_data")
    .upsert(
      { user_id: user.id, key, value, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
