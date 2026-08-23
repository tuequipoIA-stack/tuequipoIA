import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Crea un proyecto en ventas_proyectos. Se usa al convertir un prospecto
// del Pipeline en "Ganado" (ver modal de conversión en CrmSection). El
// GET (listado para Ventas → Seguimiento) se suma cuando se construya esa
// pantalla.

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
