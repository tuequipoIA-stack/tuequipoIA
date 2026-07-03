import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

const ESTADOS_VALIDOS = ["trial", "active", "past_due", "canceled"];

// Permite al admin cambiar el subscription_status de cualquier usuario a
// mano — pensado para pagos que se hicieron por fuera de MercadoPago
// (efectivo, transferencia) o para destrabar a alguien puntualmente.
export async function POST(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const { status } = await request.json();

  if (!ESTADOS_VALIDOS.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const admin = createAdminClient();

  const cambios = { subscription_status: status };
  if (status === "active") {
    const { data: actual } = await admin.from("profiles").select("subscription_started_at").eq("id", id).maybeSingle();
    if (!actual?.subscription_started_at) {
      cambios.subscription_started_at = new Date().toISOString();
    }
  }

  const { error } = await admin.from("profiles").update(cambios).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
