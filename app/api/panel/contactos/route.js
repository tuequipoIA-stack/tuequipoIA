import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";

// Contactos del Panel de Prospección. Solo admin (RLS en contactos ya lo
// exige también a nivel de base). Ver documento de arquitectura: cada
// contacto se asigna solo a un segmento (industria + puesto + marca),
// creado automáticamente si no existía.

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contactos")
    .select("*, segmentos(id, industria, puesto, marca_origen, aprobado)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contactos: data || [] });
}

// Body: { contactos: [{ nombre, email, telefono, puesto, industria, empresa, pais }], marca }
// Sirve tanto para alta manual (1 contacto) como para la importación CSV (muchos).
export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { contactos, marca } = body || {};
  if (!Array.isArray(contactos) || !contactos.length) {
    return NextResponse.json({ error: "Falta 'contactos' (array)" }, { status: 400 });
  }
  if (!marca) {
    return NextResponse.json({ error: "Falta 'marca'" }, { status: 400 });
  }

  const supabase = await createClient();
  let importados = 0;
  let omitidos = 0;
  const segmentoCache = new Map();

  for (const c of contactos) {
    const nombre = (c.nombre || "").trim();
    if (!nombre) { omitidos++; continue; }

    let email = (c.email || "").trim().toLowerCase();
    if (email && !isValidEmail(email)) email = "";
    const telefono = (c.telefono || "").replace(/[^0-9+]/g, "");
    const puesto = (c.puesto || "").trim() || "Sin especificar";
    const industria = (c.industria || "").trim() || "Sin especificar";
    const empresa = (c.empresa || "").trim() || null;
    const pais = (c.pais || "").trim() || null;

    const segKey = `${industria}::${puesto}::${marca}`;
    let segmentoId = segmentoCache.get(segKey);
    if (!segmentoId) {
      const { data: seg, error: segError } = await supabase
        .from("segmentos")
        .upsert(
          { industria, puesto, marca_origen: marca, user_id: auth.user.id },
          { onConflict: "industria,puesto,marca_origen", ignoreDuplicates: false }
        )
        .select("id")
        .single();
      if (segError) { omitidos++; continue; }
      segmentoId = seg.id;
      segmentoCache.set(segKey, segmentoId);
    }

    const payload = {
      nombre, telefono, puesto, industria, empresa, pais,
      marca_origen: marca, segmento_id: segmentoId, user_id: auth.user.id,
      updated_at: new Date().toISOString(),
    };

    if (email) {
      const { error } = await supabase
        .from("contactos")
        .upsert({ ...payload, email }, { onConflict: "email" });
      if (error) { omitidos++; continue; }
    } else {
      const { error } = await supabase.from("contactos").insert(payload);
      if (error) { omitidos++; continue; }
    }
    importados++;
  }

  return NextResponse.json({ importados, omitidos });
}
