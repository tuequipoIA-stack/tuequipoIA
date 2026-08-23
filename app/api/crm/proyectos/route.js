import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Proyectos en ventas_proyectos: se crean al convertir un prospecto del
// Pipeline en "Ganado" (ver modal de conversión en CrmSection) y se listan
// en Ventas → Seguimiento.

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
    .from("ventas_proyectos")
    .select("*")
    .eq("unidad_id", unidadId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ proyectos: data || [] });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { unidadId, cliente } = body;
  if (!unidadId) {
    return NextResponse.json({ error: "Falta unidadId" }, { status: 400 });
  }
  if (!cliente || !cliente.trim()) {
    return NextResponse.json({ error: "Falta el cliente" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ventas_proyectos")
    .insert({
      user_id: user.id,
      unidad_id: unidadId,
      prospecto_origen_id: body.prospectoOrigenId || null,
      cliente: cliente.trim(),
      servicio: body.servicio || null,
      monto: body.monto || null,
      forma_pago: body.formaPago || null,
      responsable: body.responsable || null,
      fecha_inicio: body.fechaInicio || null,
      mantenimiento_activo: !!body.mantenimientoActivo,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ proyecto: data });
}
