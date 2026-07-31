import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

// Genera (o regenera) el mensaje base de email, whatsapp y los 3 hooks de
// un segmento con IA. Ver documento de arquitectura, sección 2.3.
export async function POST(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta configurar ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: seg, error: segError } = await supabase
    .from("segmentos")
    .select("*")
    .eq("id", id)
    .single();
  if (segError || !seg) return NextResponse.json({ error: "Segmento no encontrado" }, { status: 404 });

  const contexto = seg.marca_origen === "LiftyFive"
    ? "LiftyFive es una empresa de agentes de IA para retail intelligence: auditoría de cuentas, generación de creativos, optimización de pauta y segmentación de audiencias para marcas que venden en retailers."
    : "Tu Equipo IA ofrece agentes de IA y automatización para que emprendedores y pequeñas empresas optimicen sus operaciones, marketing y ventas.";

  const prompt = `${contexto} Necesito mensajes de prospección en frío para el segmento: puesto "${seg.puesto}", industria "${seg.industria}". Devolvé SOLO un objeto JSON (sin markdown, sin texto extra) con las claves: asunto (asunto de email corto), mensaje_email (cuerpo de email en español rioplatense, profesional, breve, usa {{nombre}} y {{empresa}} como placeholders, termina con una pregunta simple para agendar 15 minutos), mensaje_whatsapp (version mas corta y directa para WhatsApp, tambien con {{nombre}} y {{empresa}}), hooks (array de exactamente 3 strings cortos, cada uno una apertura distinta basada en un dolor tipico de ese puesto/industria).`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || "Error llamando a Anthropic" }, { status: response.status });
    }
    let text = (data.content || []).map((b) => b.text || "").join("").trim();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);

    const { data: actualizado, error: updError } = await supabase
      .from("segmentos")
      .update({
        asunto_email: parsed.asunto || "",
        mensaje_base_email: parsed.mensaje_email || "",
        mensaje_base_whatsapp: parsed.mensaje_whatsapp || "",
        hooks: parsed.hooks || [],
        aprobado: false,
      })
      .eq("id", id)
      .select()
      .single();
    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });

    return NextResponse.json({ segmento: actualizado });
  } catch (e) {
    return NextResponse.json({ error: "No se pudo generar el mensaje: " + (e.message || "error desconocido") }, { status: 502 });
  }
}
