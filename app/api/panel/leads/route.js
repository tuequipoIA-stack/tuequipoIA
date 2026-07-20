import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";

// Leads del Panel de Comunicación (Membresías/Apps a medida). Solo admin.
// RLS ya exige is_admin + user_id = auth.uid(); acá además usamos el
// cliente "normal" (respeta RLS) porque este dato es propio del admin,
// no hace falta el cliente con service_role.

export async function GET(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const proyecto = searchParams.get("proyecto");

  let query = supabase.from("panel_leads").select("*").order("created_at", { ascending: false });
  if (proyecto) query = query.eq("proyecto", proyecto);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data || [] });
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { proyecto, nombre, empresa, rubro, canal, telefono, mail, proximaAccion, estado, notas } = body || {};
  if (!proyecto || !nombre) {
    return NextResponse.json({ error: "Faltan 'proyecto' y/o 'nombre'" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("panel_leads")
    .insert({
      user_id: auth.user.id,
      proyecto, nombre,
      empresa: empresa || null,
      rubro: rubro || null,
      canal: canal || null,
      telefono: telefono || null,
      mail: mail || null,
      proxima_accion: proximaAccion || null,
      estado: estado || null,
      notas: notas || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}
