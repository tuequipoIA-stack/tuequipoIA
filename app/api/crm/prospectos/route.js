import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Prospectos del modo CRM "Pipeline" (crm_prospectos). RLS ya restringe
// cada fila a su dueño; acá además filtramos por unidad de negocio, porque
// un mismo usuario puede tener varias unidades y RLS no distingue entre ellas.

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
    .from("crm_prospectos")
    .select("*")
    .eq("unidad_id", unidadId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prospectos: data || [] });
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
    return NextResponse.json({ error: "Falta el nombre del prospecto" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crm_prospectos")
    .insert({
      user_id: user.id,
      unidad_id: unidadId,
      nombre: nombre.trim(),
      empresa: body.empresa || null,
      cargo: body.cargo || null,
      telefono: body.telefono || null,
      email: body.email || null,
      servicio_interes: body.servicioInteres || null,
      valor_estimado: body.valorEstimado || null,
      canal_origen: body.canalOrigen || null,
      prioridad: body.prioridad || null,
      proxima_accion: body.proximaAccion || null,
      fecha_proximo_contacto: body.fechaProximoContacto || null,
      responsable: body.responsable || null,
      notas: body.notas || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prospecto: data });
}
