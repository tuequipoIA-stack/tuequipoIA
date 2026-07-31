import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("grupos_segmentos").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
