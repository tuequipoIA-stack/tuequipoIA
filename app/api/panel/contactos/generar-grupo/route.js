import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { PERFILES_MARCA, inferirDolor } from "@/lib/panel/coldEmailMatrix";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

// Genera UNA plantilla de cold email (asunto A, asunto B y cuerpo, con
// {{nombre}} / {{empresa}} como placeholders) para un grupo de contactos
// elegidos a mano en el panel (checkboxes de Contactos), siguiendo el
// manual de cold email interno: regla 30/30/50, estructura AIDA, un solo
// CTA binario, tono de marca y dolor inferido cruzando marca × industria
// × puesto. No persiste nada — el resultado se usa al vuelo para armar
// la cola de envío en el cliente (ver GeneradorGrupoIA en PanelContactos).
export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta configurar ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const { ids, trigger_event, objetivo } = body || {};
  if (!Array.isArray(ids) || !ids.length) {
    return NextResponse.json({ error: "Falta 'ids' (array)" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: contactos, error: fetchError } = await supabase
    .from("contactos")
    .select("id, nombre, empresa, puesto, industria, marca_origen")
    .in("id", ids);
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!contactos || !contactos.length) return NextResponse.json({ error: "No se encontraron contactos" }, { status: 404 });

  const marcas = [...new Set(contactos.map((c) => c.marca_origen))];
  if (marcas.length > 1) {
    return NextResponse.json({ error: `Los contactos seleccionados son de marcas distintas (${marcas.join(", ")}). Elegí contactos de una sola marca.` }, { status: 400 });
  }
  const marca = marcas[0];
  const perfil = PERFILES_MARCA[marca];
  if (!perfil) {
    return NextResponse.json({ error: `No hay perfil de cold email cargado para la marca "${marca}"` }, { status: 400 });
  }

  // Dolor representativo del grupo: el más frecuente entre los contactos
  // seleccionados (lo normal es que Marisa agrupe empresas parecidas).
  const conteoDolor = {};
  for (const c of contactos) {
    const { dolor } = inferirDolor(marca, c.industria, c.puesto);
    conteoDolor[dolor] = (conteoDolor[dolor] || 0) + 1;
  }
  const dolor = Object.entries(conteoDolor).sort((a, b) => b[1] - a[1])[0][0];

  const empresas = [...new Set(contactos.map((c) => c.empresa).filter(Boolean))];
  const industrias = [...new Set(contactos.map((c) => c.industria).filter(Boolean))];
  const puestos = [...new Set(contactos.map((c) => c.puesto).filter(Boolean))];

  const prompt = `Actuás como redactor experto en cold email B2B para el mercado argentino/LATAM. Seguís al pie de la letra estas reglas (basadas en benchmarks Scrap.io 2026 / Instantly 2026):
- Regla 30/30/50: 30% personalización real + 30% propuesta de valor cuantificada + 50% orientado a un único CTA.
- Estructura AIDA: Atención (asunto) -> Interés (dolor específico) -> Deseo (dato o prueba social) -> Acción (CTA binario).
- Nunca abras con "Me presento, soy... y ofrecemos soluciones innovadoras".
- Cero adjuntos, cero imágenes.

Marca emisora: ${marca}
Qué vende: ${perfil.que_vende}
A quién le habla: ${perfil.a_quien}
Tono de esta marca (no lo mezcles con el de otra marca): ${perfil.tono}
CTA típico de esta marca: ${perfil.cta_tipico}

Este mail se va a enviar, con la misma plantilla, a un GRUPO de ${contactos.length} contacto(s) de estas empresas: ${empresas.join(", ") || "(sin dato)"}.
Industria(s) del grupo: ${industrias.join(", ") || "(sin dato)"}.
Puesto(s) del grupo: ${puestos.join(", ") || "(sin dato)"}.
Dolor específico que esta marca resuelve para este grupo: ${dolor}
${trigger_event ? `Trigger event a mencionar si encaja naturalmente: ${trigger_event}` : "No hay trigger event específico — no inventes uno."}
Objetivo del mail: ${objetivo || "agendar llamada de 15 minutos"}

Reglas obligatorias:
1. Como es UNA plantilla para varias empresas, usá {{nombre}} y {{empresa}} como placeholders literales donde corresponda (nombre de pila y empresa) — nunca inventes un nombre o empresa concretos.
2. Asunto: 6 a 10 palabras, menos de 45 caracteres contando los placeholders sin reemplazar, sin mayúsculas sostenidas, sin signos de exclamación múltiples, sin palabras spam (gratis, urgente, 100% garantizado, oferta exclusiva, felicidades).
3. Cuerpo: menos de 90 palabras, un solo CTA binario (nunca "cuando puedas, si te interesa"), arranca con "Hola {{nombre}}," y termina con la firma "Marisa — ${marca}".
4. El hook (primera línea después del saludo) tiene que sonar a que investigaste la industria del grupo, nunca un saludo genérico tipo "espero que estés bien".
5. Entregá también un asunto alternativo (variante B) para poder testear.

Devolvé SOLO un objeto JSON (sin markdown, sin \`\`\`, sin texto extra fuera del JSON) con exactamente estas claves:
{"asunto_a": "...", "asunto_b": "...", "cuerpo": "..."}
En "cuerpo" usá \\n para los saltos de línea entre párrafos.`;

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

    return NextResponse.json({
      asunto_a: parsed.asunto_a || "",
      asunto_b: parsed.asunto_b || "",
      cuerpo: parsed.cuerpo || "",
      marca,
      dolor,
      contactos: contactos.map((c) => ({ id: c.id, nombre: c.nombre, empresa: c.empresa })),
    });
  } catch (e) {
    return NextResponse.json({ error: "No se pudo generar el mensaje: " + (e.message || "error desconocido") }, { status: 502 });
  }
}
