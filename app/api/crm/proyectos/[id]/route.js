import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Editar un proyecto puntual (mover de etapa_seguimiento, editar datos
// desde la ficha). RLS restringe todo a los proyectos del propio usuario.

const CAMPOS = {
  cliente: "cliente", servicio: "servicio", monto: "monto", formaPago: "forma_pago",
  etapaSeguimiento: "etapa_seguimiento", responsable: "responsable", fechaInicio: "fecha_inicio",
  mantenimientoActivo: "mantenimiento_activo",
};

export async function PATCH(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const cambios = {};
  for (const [campoBody, columna] of Object.entries(CAMPOS)) {
    if (body[campoBody] !== undefined) cambios[columna] = body[campoBody];
  }
  if (body.cliente !== undefined) cambios.cliente = (body.cliente || "").trim();

  const { data, error } = await supabase
    .from("ventas_proyectos")
    .update(cambios)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ proyecto: data });
}
