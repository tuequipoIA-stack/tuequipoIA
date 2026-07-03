import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isThisMonth } from "@/lib/helpers";

// Lista de todos los usuarios con un resumen de su negocio y actividad
// del mes, para que Marisa pueda ver de un vistazo quién necesita ayuda
// o qué está pasando en la base de suscriptores. Requiere is_admin.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();

  const [{ data: profiles, error: profilesError }, { data: rows, error: rowsError }] = await Promise.all([
    admin.from("profiles").select("id, email, subscription_status, plan, trial_ends_at, mercadopago_subscription_id, subscription_started_at, is_admin, created_at").order("created_at", { ascending: false }),
    admin.from("app_data").select("user_id, key, value").in("key", ["negocio-perfil", "ventas-registro", "gastos-registro"]),
  ]);

  if (profilesError || rowsError) {
    return NextResponse.json({ error: (profilesError || rowsError).message }, { status: 500 });
  }

  const porUsuario = {};
  (rows || []).forEach((r) => {
    if (!porUsuario[r.user_id]) porUsuario[r.user_id] = {};
    porUsuario[r.user_id][r.key] = r.value;
  });

  const usuarios = (profiles || []).map((p) => {
    const datos = porUsuario[p.id] || {};
    const perfil = datos["negocio-perfil"] || {};
    const ventas = datos["ventas-registro"] || [];
    const gastos = datos["gastos-registro"] || [];
    const ventasMes = ventas.filter((v) => isThisMonth(v.fecha)).reduce((s, v) => s + Number(v.precio || 0) * Number(v.cantidad || 1), 0);
    const gastosMes = gastos.filter((g) => isThisMonth(g.fecha)).reduce((s, g) => s + Number(g.monto || 0), 0);

    return {
      id: p.id,
      email: p.email,
      isAdmin: p.is_admin,
      subscriptionStatus: p.subscription_status,
      plan: p.plan,
      trialEndsAt: p.trial_ends_at,
      mercadopagoSubscriptionId: p.mercadopago_subscription_id,
      subscriptionStartedAt: p.subscription_started_at,
      createdAt: p.created_at,
      nombreNegocio: perfil.nombre || null,
      rubro: perfil.rubro || null,
      etapa: perfil.etapa || null,
      ventasMes,
      gastosMes,
      cantidadVentas: ventas.length,
    };
  });

  return NextResponse.json({ usuarios });
}
