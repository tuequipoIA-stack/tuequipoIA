import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CAMPOS = {
  cliente: "cliente", plan: "plan", montoMensual: "monto_mensual", estadoCobro: "estado_cobro",
  proximoCobro: "proximo_cobro", proximoTouchpoint: "proximo_touchpoint",
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
  if (body.cliente !== undefined) cambios.cliente = (body.cliente || "").trim();

  const { data, error } = await supabase
    .from("crm_suscripciones")
    .update(cambios)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ suscripcion: data });
}

export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await supabase.from("crm_suscripciones").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
