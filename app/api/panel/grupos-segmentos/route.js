import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grupos_segmentos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ grupos: data || [] });
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const nombre = (body.nombre || "").trim();
  const segmento_ids = Array.isArray(body.segmento_ids) ? body.segmento_ids : [];

  if (!nombre) return NextResponse.json({ error: "Falta el nombre del grupo" }, { status: 400 });
  if (!segmento_ids.length) return NextResponse.json({ error: "El grupo necesita al menos un segmento" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grupos_segmentos")
    .insert({ nombre, segmento_ids, user_id: auth.user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ grupo: data });
}
