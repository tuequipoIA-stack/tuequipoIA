import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Proxy server-side a la API de Anthropic. En el artifact original el
// fetch a api.anthropic.com se hacía directo desde el browser (funciona
// ahí porque el propio entorno de artifacts inyecta las credenciales).
// En una app Next.js normal eso expondría la API key en el cliente, así
// que acá lo hacemos desde el servidor usando ANTHROPIC_API_KEY.
// También exigimos sesión para que nadie no-suscripto gaste tu cuota de IA.

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta configurar ANTHROPIC_API_KEY en .env.local" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { system, messages, max_tokens } = body || {};

  if (!messages) {
    return NextResponse.json({ error: "Falta 'messages'" }, { status: 400 });
  }

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
        max_tokens: max_tokens || 1000,
        system,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Error llamando a la API de Anthropic" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Error de conexión con Anthropic" }, { status: 502 });
  }
}
