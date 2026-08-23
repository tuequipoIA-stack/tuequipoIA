import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Pacientes del modo CRM "Pacientes" (crm_pacientes). Mismo patrón que
// /api/crm/prospectos: RLS + scoping manual por unidad_id.

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unidadId = searchParams.get("unidadId");
  if (!unidadId) {
    return NextResponse.json({ error: "Falta unidadId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crm_pacientes")
    .select("*")
    .eq("unidad_id", unidadId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pacientes: data || [] });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { unidadId, nombre } = body;
  if (!unidadId) {
    return NextResponse.json({ error: "Falta unidadId" }, { status: 400 });
  }
  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crm_pacientes")
    .insert({
      user_id: user.id,
      unidad_id: unidadId,
      nombre: nombre.trim(),
      motivo: body.motivo || null,
      frecuencia: body.frecuencia || null,
      fase: body.fase || "primera_consulta",
      ultima_sesion: body.ultimaSesion || null,
      proxima_sesion: body.proximaSesion || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ paciente: data });
}
