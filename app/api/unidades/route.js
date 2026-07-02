import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Lista y crea "unidades de negocio" (Picadas, Viandas diarias, etc.) del
// usuario logueado. RLS en unidades_negocio ya garantiza que cada usuario
// solo ve/crea las suyas.

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("unidades_negocio")
    .select("*")
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ unidades: data || [] });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { nombre, rubro, tipoNegocio } = await request.json();
  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "Falta el nombre de la unidad" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("unidades_negocio")
    .insert({
      user_id: user.id,
      nombre: nombre.trim(),
      rubro: rubro || null,
      tipo_negocio: tipoNegocio || "productos",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ unidad: data });
}
