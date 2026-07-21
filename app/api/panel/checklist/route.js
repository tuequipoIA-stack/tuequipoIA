import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";

// Checklist de "plan de contenido recurrente" del Panel, una fila por
// proyecto ('ia' | 'apps'). Solo admin.

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  const { data, error } = await supabase.from("panel_checklist").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ checklist: data || [] });
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { proyecto, items } = body || {};
  if (!proyecto || !Array.isArray(items)) {
    return NextResponse.json({ error: "Faltan 'proyecto' y/o 'items'" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("panel_checklist")
    .upsert(
      { user_id: auth.user.id, proyecto, items, updated_at: new Date().toISOString() },
      { onConflict: "user_id,proyecto" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ checklist: data });
}
