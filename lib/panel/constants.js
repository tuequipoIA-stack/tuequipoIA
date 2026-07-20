// Datos del Panel de Comunicación (CRM interno), portados 1 a 1 desde el
// artifact HTML que Marisa venía usando, para no perder ninguna decisión
// de tono/cadencia/plantillas ya afinada ahí.

export const PROJECTS = {
  ia: {
    nombre: "Membresías — Portal Emprendedores",
    color: "#C13584",
    canalPrincipal: "Instagram",
    canales: ["instagram"],
    tono: "Educativo, cercano, inspirador",
    cadencia: "3–4 posts/semana + stories diarias + pauta activa en Instagram Ads",
    contenido: [
      "Reels educativos sobre uso de IA",
      "Casos de uso reales de emprendedores",
      "Testimonios de miembros del portal",
      "Carruseles de tips prácticos",
      "Anuncios de conversión a landing de suscripción",
    ],
    objetivo: "Llevar tráfico a DM de Instagram o landing de suscripción al portal",
    waTemplate: "Hola {nombre}, vi tu interés en la membresía del portal de herramientas de IA para emprendedores. ¿Charlamos?",
    mailSubject: "Membresía del portal para emprendedores",
    mailBody: "Hola {nombre},\n\nGracias por tu interés en la membresía del portal de herramientas de IA para emprendedores. Quería contarte los beneficios y cómo sumarte.\n\nSaludos.",
    defaultCheck: ["Reel educativo de la semana", "Story de caso de uso", "Carrusel de tips", "Revisar métricas de la campaña de Ads", "Responder DMs pendientes"],
  },
  apps: {
    nombre: "Apps / Software a Medida",
    color: "#2563eb",
    canalPrincipal: "Email + WhatsApp + Reunión",
    canales: ["email", "whatsapp"],
    tono: "Consultivo, técnico y accesible",
    cadencia: "Outreach personalizado + seguimiento en día 1, 3 y 7 por rubro",
    contenido: [
      "Propuesta técnica a medida",
      "Casos de automatización por rubro",
      "Demo en video del proceso automatizado",
      "Relevamiento inicial del proceso del cliente",
    ],
    objetivo: "Agendar reunión de relevamiento del proceso a automatizar",
    waTemplate: "Hola {nombre}, te contacto sobre la automatización a medida para {empresa}. ¿Coordinamos una llamada?",
    mailSubject: "Automatización a medida para {empresa}",
    mailBody: "Hola {nombre},\n\nMe gustaría coordinar una reunión breve para entender el proceso de {empresa} y ver cómo podemos automatizarlo con una app 100% a medida.\n\nSaludos.",
    defaultCheck: ["Prospección de 5 empresas nuevas", "Seguimiento de propuestas enviadas", "Preparar demo/caso técnico", "Relevamiento agendado esta semana"],
  },
};

export const RUBROS = ["Inmobiliaria", "Retail / Comercio", "Salud", "Gastronomía", "Logística", "Educación", "Servicios profesionales", "Otro"];

export const ESTADOS = ["Nuevo", "Contactado", "Seguimiento", "Reunión agendada", "Cerrado ganado", "Cerrado perdido"];

export const ETAPAS = ["Reunión coordinada", "Presupuesto enviado", "Confirmado", "Perdido"];

export function labelCanal(c) {
  return c === "instagram" ? "Instagram" : c === "whatsapp" ? "WhatsApp" : "Email";
}

export function fillTemplate(str, lead) {
  return (str || "")
    .replace(/\{nombre\}/g, lead?.nombre || "")
    .replace(/\{empresa\}/g, lead?.empresa || "tu empresa");
}

export function money(n) {
  return `$${(Number(n) || 0).toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function gmailAuthUserKey() {
  return "panel_comunicacion_gmail_authuser";
}

export function gmailLink(to, subject, body, bcc, authuser) {
  const params = ["view=cm", "fs=1", "tf=1"];
  if (to) params.push(`to=${encodeURIComponent(to)}`);
  if (bcc) params.push(`bcc=${encodeURIComponent(bcc)}`);
  params.push(`su=${encodeURIComponent(subject || "")}`);
  params.push(`body=${encodeURIComponent(body || "")}`);
  return `https://mail.google.com/mail/u/${authuser ?? "0"}/?${params.join("&")}`;
}

export function waLink(lead) {
  const p = PROJECTS[lead.proyecto];
  const phone = (lead.telefono || "").replace(/\D/g, "");
  const text = fillTemplate(p.waTemplate, lead);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function mailLink(lead, authuser) {
  const p = PROJECTS[lead.proyecto];
  const subject = fillTemplate(p.mailSubject, lead);
  const body = fillTemplate(p.mailBody, lead);
  return gmailLink(lead.mail, subject, body, null, authuser);
}
