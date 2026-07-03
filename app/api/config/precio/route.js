import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { obtenerPrecioMembresia } from "@/lib/appConfig";

// Precio actual de la membresía, visible para cualquier usuario logueado
// (se usa en la pantalla de suscripción y en Perfil).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const precio = await obtenerPrecioMembresia();
  return NextResponse.json({ precio });
}
