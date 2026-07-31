import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";

const CAMPOS_EDITABLES = [
  "nombre", "empresa", "puesto", "industria", "pais", "telefono", "email",
  "estado", "canal_preferido", "proximo_seguimiento", "segmento_id", "observaciones",
];

export async function PATCH(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json();

  const update = { updated_at: new Date().toISOString() };
  for (const campo of CAMPOS_EDITABLES) {
    if (body[campo] !== undefined) update[campo] = body[campo];
  }
  if (body.estado && body.estado !== "nuevo" && !body.fecha_primer_contacto) {
    update.fecha_primer_contacto = new Date().toISOString();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contactos")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacto: data });
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("contactos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
