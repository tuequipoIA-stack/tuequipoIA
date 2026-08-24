import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const cambios = {};
  if (body.numero !== undefined) cambios.numero = body.numero || null;
  if (body.monto !== undefined) cambios.monto = body.monto;
  if (body.fecha !== undefined) cambios.fecha = body.fecha || null;
  if (body.estado !== undefined) cambios.estado = body.estado;

  const { data, error } = await supabase
    .from("ventas_facturas")
    .update(cambios)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ factura: data });
}

export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await supabase.from("ventas_facturas").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
