import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Crea el mantenimiento mensual de un proyecto (toggle del modal de
// conversión "Marcar como Ganado"). Un proyecto tiene a lo sumo un
// mantenimiento activo.

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { unidadId, proyectoId, montoMensual } = body;
  if (!unidadId || !proyectoId) {
    return NextResponse.json({ error: "Falta unidadId o proyectoId" }, { status: 400 });
  }
  if (!montoMensual) {
    return NextResponse.json({ error: "Falta el monto mensual" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ventas_mantenimiento")
    .insert({
      user_id: user.id,
      unidad_id: unidadId,
      proyecto_id: proyectoId,
      monto_mensual: montoMensual,
      dia_cobro: body.diaCobro || null,
      proximo_cobro: body.proximoCobro || null,
      estado: "activo",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mantenimiento: data });
}
