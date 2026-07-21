import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("panel_cobros")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cobros: data || [] });
}

// Se crea automáticamente cuando un lead pasa a "Confirmado" en el tablero
// de Seguimiento de Interesados (ver PanelSection en el cliente).
export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { leadId, nombre, empresa, monto, proximoCobro, notas } = body || {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("panel_cobros")
    .insert({
      user_id: auth.user.id,
      lead_id: leadId || null,
      nombre: nombre || null,
      empresa: empresa || null,
      monto: monto || null,
      proximo_cobro: proximoCobro || null,
      notas: notas || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cobro: data });
}
