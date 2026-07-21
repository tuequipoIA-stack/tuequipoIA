import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";

const CAMPOS_EDITABLES = ["nombre", "empresa", "monto", "proximoCobro", "estado", "notas"];
const MAPA_COLUMNA = { proximoCobro: "proximo_cobro" };

export async function PATCH(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json();

  const update = { updated_at: new Date().toISOString() };
  for (const campo of CAMPOS_EDITABLES) {
    if (body[campo] !== undefined) {
      update[MAPA_COLUMNA[campo] || campo] = body[campo];
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("panel_cobros")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cobro: data });
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("panel_cobros").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
