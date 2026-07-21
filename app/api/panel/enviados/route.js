import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";

// Registro de "ya le mandé este correo/wsp a este contacto" — se usa para
// tildar filas en Armado de Correos / Difusión WSP y no perder el rastro
// de a quién ya se le escribió dentro de una lista.

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  const { data, error } = await supabase.from("panel_enviados").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ enviados: data || [] });
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { leadId, canal, listaId } = body || {};
  if (!leadId || !canal) return NextResponse.json({ error: "Faltan 'leadId' y/o 'canal'" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("panel_enviados")
    .insert({ user_id: auth.user.id, lead_id: leadId, canal, lista_id: listaId || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ enviado: data });
}

export async function DELETE(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  const canal = searchParams.get("canal");
  if (!leadId || !canal) return NextResponse.json({ error: "Faltan 'leadId' y/o 'canal'" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("panel_enviados").delete().eq("lead_id", leadId).eq("canal", canal);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
