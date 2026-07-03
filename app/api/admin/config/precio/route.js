import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { obtenerPrecioMembresia, actualizarPrecioMembresia } from "@/lib/appConfig";

// Permite al admin cambiar el precio de la membresía sin tocar código.
// Importante: esto solo afecta a las suscripciones NUEVAS que se creen de
// acá en adelante (MercadoPago fija el monto de cada suscripción existente
// al momento de crearla — cambiar este valor no modifica lo que ya le
// cobra a alguien que ya está suscripto).
export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { precio } = await request.json();
  const numero = Number(precio);
  if (!numero || numero <= 0) {
    return NextResponse.json({ error: "El precio tiene que ser un número mayor a 0" }, { status: 400 });
  }

  try {
    await actualizarPrecioMembresia(numero);
    return NextResponse.json({ ok: true, precio: numero });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const precio = await obtenerPrecioMembresia();
  return NextResponse.json({ precio });
}
