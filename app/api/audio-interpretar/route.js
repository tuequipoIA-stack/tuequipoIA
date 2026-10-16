import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Recibe la transcripción de un audio y, con Claude, la convierte en cambios
// estructurados para Organización, CRM o Ventas. El cliente muestra esos
// cambios para revisarlos antes de aplicarlos (nada se guarda acá).
// Si esta ruta falla, el cliente usa un intérprete de respaldo por reglas.

const MODEL = process.env.ANTHROPIC_AUDIO_MODEL || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

const BASE = (hoy, dia) => `Convertís lo que una persona dictó en un audio (español rioplatense, transcripción automática que puede tener errores) en cambios estructurados para su sistema de gestión.
Hoy es ${dia} ${hoy}. Las fechas relativas ("mañana", "el martes", "la semana que viene", "el 20 de noviembre") convertilas a YYYY-MM-DD; siempre hacia adelante salvo que diga lo contrario. Meses en formato YYYY-MM.
Los números pueden venir en palabras ("la cinco" = 5). Respondé SOLO con JSON válido, sin texto antes ni después, sin bloques de código.
No inventes cambios que la persona no dijo. Redactá los textos breves, en español, empezando con mayúscula.`;

const PROMPTS = {
  organizacion: `Contexto: tablero de tareas. La persona dicta tareas para hacer. Cada tarea puede pertenecer a una empresa (usá el id de la lista de empresas; null si no corresponde a ninguna) y va a la columna "hoy" si dice que es para hoy, si no a "semana".
Formato: {"tareas":[{"texto":"...","empresa":"<id>|null","columna":"hoy|semana"}]}`,

  crm: `Contexto: CRM de oportunidades comerciales. Cada oportunidad tiene un número fijo (num). La persona cuenta cómo avanzaron. Identificá cada oportunidad por número o por nombre de cliente (usá el num de la lista; si no la podés identificar, num: null).
Tipos de cambio:
- {"tipo":"conv","f":"YYYY-MM-DD","c":"Reunión|Llamada|WhatsApp|Mail|Videollamada","r":"resumen de lo que se habló"}  (registrar una conversación; si no dice el canal, "Llamada"; fecha hoy salvo que diga otra)
- {"tipo":"etapa","e":"calificado|propuesta_enviada|negociacion|ganado|perdido"}  (solo si dice que cambió de etapa)
- {"tipo":"proximo","f":"YYYY-MM-DD","m":"motivo"}  (agendar un próximo contacto: reunión, llamada, seguimiento)
- {"tipo":"tarea","t":"texto de la tarea","c":"hoy|semana"}  (algo que la persona tiene que hacer: mandar, armar, preparar...)
Formato: {"oportunidades":[{"num":5,"cambios":[...]}]}`,

  ventas: `Contexto: seguimiento de proyectos ya vendidos. Cada proyecto tiene un número (num), hitos (con índice i), y según la empresa: cuotas del cliente (meses), ejecución mensual en USD (AdSpot) o cobros del cliente (índice idx).
Tipos de cambio:
- {"tipo":"hito","hi":<índice del hito>,"e":"pendiente|en_curso|hecho"}  (terminó / arrancó un hito)
- {"tipo":"fecha","hi":<índice>,"f":"YYYY-MM-DD"}  (se movió la fecha de un hito)
- {"tipo":"horas","h":<número>,"d":"en qué trabajó","f":"YYYY-MM-DD"}  (cargar horas trabajadas; fecha hoy salvo que diga otra)
- {"tipo":"cuota","mes":"YYYY-MM"}  (el cliente pagó la cuota de ese mes — proyectos con cuotas)
- {"tipo":"pago","ejecMes":"YYYY-MM"}  (le pagaron su comisión de lo ejecutado en ese mes — proyectos con ejecución mensual)
- {"tipo":"ejec","mes":"YYYY-MM","monto":<USD>}  (se ejecutó/facturó ese monto en ese mes)
- {"tipo":"cobro","idx":<índice>}  (el cliente pagó ese cobro — proyectos propios)
Formato: {"proyectos":[{"num":4,"cambios":[...]}]}`,
};

function extraerJSON(texto) {
  const ini = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");
  if (ini < 0 || fin < 0) return null;
  try { return JSON.parse(texto.slice(ini, fin + 1)); } catch { return null; }
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY" }, { status: 500 });

  const { contexto, texto, datos } = (await request.json()) || {};
  if (!PROMPTS[contexto] || !texto) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const ahora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Mendoza" }));
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
  const dia = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][ahora.getDay()];

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: `${BASE(hoy, dia)}\n\n${PROMPTS[contexto]}`,
        messages: [{
          role: "user",
          content: `Datos actuales:\n${JSON.stringify(datos || {})}\n\nTranscripción del audio:\n"""${String(texto).slice(0, 6000)}"""`,
        }],
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data?.error?.message || "Error de IA" }, { status: 502 });
    const salida = (data.content || []).map((b) => b.text || "").join("");
    const json = extraerJSON(salida);
    if (!json) return NextResponse.json({ error: "Respuesta inválida" }, { status: 502 });

    // Normalizamos al formato que usan las pantallas de revisión
    let propuesta;
    if (contexto === "organizacion") {
      propuesta = (json.tareas || []).filter((t) => t?.texto).map((t) => ({ texto: t.texto, empresa: t.empresa || null, columna: t.columna === "hoy" ? "hoy" : "semana", on: true }));
    } else {
      const lista = contexto === "crm" ? json.oportunidades : json.proyectos;
      propuesta = (lista || []).map((x) => ({ num: x.num ?? null, cambios: (x.cambios || []).map((c) => ({ ...c, on: true })) })).filter((x) => x.cambios.length);
    }
    return NextResponse.json({ propuesta });
  } catch (e) {
    return NextResponse.json({ error: "Error de conexión con la IA" }, { status: 502 });
  }
}
