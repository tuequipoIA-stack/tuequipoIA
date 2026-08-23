import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Suscripciones del modo CRM "Suscripciones" (crm_suscripciones). Mismo
// patrón que /api/crm/prospectos: RLS + scoping manual por unidad_id.

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
    .from("crm_suscripciones")
    .select("*")
    .eq("unidad_id", unidadId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ suscripciones: data || [] });
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
    .from("crm_suscripciones")
    .insert({
      user_id: user.id,
      unidad_id: unidadId,
      cliente: cliente.trim(),
      plan: body.plan || null,
      monto_mensual: body.montoMensual || null,
      estado_cobro: body.estadoCobro || "al_dia",
      proximo_cobro: body.proximoCobro || null,
      proximo_touchpoint: body.proximoTouchpoint || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ suscripcion: data });
}
