import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";

const CAMPOS_EDITABLES = ["asunto_email", "mensaje_base_email", "mensaje_base_whatsapp", "hooks", "aprobado"];

export async function PATCH(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json();
  const update = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (body[campo] !== undefined) update[campo] = body[campo];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("segmentos")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ segmento: data });
}
