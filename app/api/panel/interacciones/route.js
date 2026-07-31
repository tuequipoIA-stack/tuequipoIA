import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const contactoId = searchParams.get("contacto_id");
  if (!contactoId) return NextResponse.json({ error: "Falta 'contacto_id'" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interacciones")
    .select("*")
    .eq("contacto_id", contactoId)
    .order("fecha", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ interacciones: data || [] });
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { contacto_id, canal, tipo, contenido } = body || {};
  if (!contacto_id || !canal || !tipo) {
    return NextResponse.json({ error: "Faltan 'contacto_id', 'canal' y/o 'tipo'" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interacciones")
    .insert({ contacto_id, canal, tipo, contenido: contenido || null, user_id: auth.user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (tipo === "mensaje_enviado") {
    await supabase
      .from("contactos")
      .update({
        estado: "contactado",
        fecha_primer_contacto: new Date().toISOString(),
        fecha_ultimo_contacto: new Date().toISOString(),
      })
      .eq("id", contacto_id)
      .eq("estado", "nuevo");
    await supabase
      .from("contactos")
      .update({ fecha_ultimo_contacto: new Date().toISOString() })
      .eq("id", contacto_id)
      .neq("estado", "nuevo");
  }

  return NextResponse.json({ interaccion: data });
}
