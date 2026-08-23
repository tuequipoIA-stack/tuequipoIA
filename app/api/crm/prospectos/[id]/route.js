import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Editar (incluye mover de etapa) o borrar un prospecto puntual. RLS
// restringe todo a los prospectos del propio usuario.

const CAMPOS = {
  nombre: "nombre", empresa: "empresa", cargo: "cargo", telefono: "telefono",
  email: "email", servicioInteres: "servicio_interes", valorEstimado: "valor_estimado",
  etapa: "etapa", canalOrigen: "canal_origen", prioridad: "prioridad",
  proximaAccion: "proxima_accion", fechaProximoContacto: "fecha_proximo_contacto",
  responsable: "responsable", motivoEstancamiento: "motivo_estancamiento", notas: "notas",
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
    if (body[campoBody] !== undefined) cambios[columna] = body[campoBody] || null;
  }
  if (body.nombre !== undefined) cambios.nombre = (body.nombre || "").trim();

  const { data, error } = await supabase
    .from("crm_prospectos")
    .update(cambios)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prospecto: data });
}

export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase
    .from("crm_prospectos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
