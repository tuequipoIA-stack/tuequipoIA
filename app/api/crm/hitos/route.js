import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Hitos/entregables de un proyecto (ventas_hitos) — tab "Avance del
// proyecto" de la ficha en Ventas → Seguimiento.

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const proyectoId = searchParams.get("proyectoId");
  if (!proyectoId) {
    return NextResponse.json({ error: "Falta proyectoId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ventas_hitos")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("fecha", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ hitos: data || [] });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { proyectoId, nombre } = body;
  if (!proyectoId) {
    return NextResponse.json({ error: "Falta proyectoId" }, { status: 400 });
  }
  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "Falta el nombre del hito" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ventas_hitos")
    .insert({
      user_id: user.id,
      proyecto_id: proyectoId,
      nombre: nombre.trim(),
      fecha: body.fecha || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ hito: data });
}
