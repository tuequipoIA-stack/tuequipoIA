import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { requireAdmin } from "@/lib/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { fillTemplate } from "@/lib/panel/constants";

// Manda el email del segmento (ya generado y aprobado) a todos sus
// contactos con un solo click, personalizando {{nombre}}/{{empresa}} por
// contacto. Usa una casilla de Gmail propia vía SMTP (nodemailer) — hace
// falta configurar EMAIL_ENVIO_USER (la casilla que envía) y
// EMAIL_ENVIO_APP_PASSWORD (contraseña de aplicación de esa casilla,
// generada en myaccount.google.com/apppasswords, no la contraseña normal)
// como variables de entorno en Vercel.
export async function POST(request, { params }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const user = process.env.EMAIL_ENVIO_USER;
  const pass = process.env.EMAIL_ENVIO_APP_PASSWORD;
  if (!user || !pass) {
    return NextResponse.json({ error: "Falta configurar EMAIL_ENVIO_USER y EMAIL_ENVIO_APP_PASSWORD en Vercel" }, { status: 500 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: seg, error: segError } = await supabase.from("segmentos").select("*").eq("id", id).single();
  if (segError || !seg) return NextResponse.json({ error: "Segmento no encontrado" }, { status: 404 });
  if (!seg.aprobado) return NextResponse.json({ error: "El segmento todavía no está aprobado" }, { status: 400 });
  if (!seg.mensaje_base_email || !seg.asunto_email) {
    return NextResponse.json({ error: "El segmento no tiene mensaje de email generado" }, { status: 400 });
  }

  const { data: contactos, error: fetchError } = await supabase
    .from("contactos")
    .select("id, nombre, empresa, puesto, industria, pais, email, estado")
    .eq("segmento_id", id);
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const objetivo = (contactos || []).filter((c) => c.email && c.estado !== "descartado");
  if (!objetivo.length) {
    return NextResponse.json({ error: "No hay contactos con email disponibles en este segmento" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  let enviados = 0;
  const detalle = [];
  for (const c of objetivo) {
    const asunto = fillTemplate(seg.asunto_email, c);
    const mensaje = fillTemplate(seg.mensaje_base_email, c);
    try {
      await transporter.sendMail({
        from: `"Marisa · ${seg.marca_origen}" <${user}>`,
        to: c.email,
        subject: asunto,
        text: mensaje,
      });
      enviados++;
      detalle.push({ id: c.id, ok: true });

      await supabase.from("interacciones").insert({
        contacto_id: c.id,
        canal: "email",
        tipo: "mensaje_enviado",
        contenido: mensaje,
        user_id: auth.user.id,
      });
      // Mismo criterio que ya usa /api/panel/interacciones al registrar un
      // mensaje_enviado manual: pasa a "contactado" si estaba "nuevo", y
      // siempre actualiza la fecha de último contacto.
      await supabase
        .from("contactos")
        .update({ estado: "contactado", fecha_primer_contacto: new Date().toISOString(), fecha_ultimo_contacto: new Date().toISOString() })
        .eq("id", c.id)
        .eq("estado", "nuevo");
      await supabase
        .from("contactos")
        .update({ fecha_ultimo_contacto: new Date().toISOString() })
        .eq("id", c.id)
        .neq("estado", "nuevo");
    } catch (e) {
      detalle.push({ id: c.id, ok: false, error: e.message });
    }
  }

  return NextResponse.json({ enviados, fallidos: objetivo.length - enviados, detalle });
}
