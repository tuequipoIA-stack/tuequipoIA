// Datos del Panel de Prospección (CRM interno de Marisa), reconstruido
// siguiendo el documento "Arquitectura de Sistema — Agente de Prospección
// y Seguimiento de Clientes" (julio 2026). Reemplaza al Panel de
// Comunicación anterior (proyectos "ia"/"apps" con leads sueltos): ahora
// los contactos se agrupan solos por segmento (industria + puesto + marca)
// y el mensaje se genera una vez por segmento, no por contacto.

export const MARCAS = ["LiftyFive", "Tu Equipo IA"];

export const MARCA_COLOR = {
  "LiftyFive": "#2563eb",
  "Tu Equipo IA": "#1AABAA",
};

export const ESTADOS = [
  { id: "nuevo", label: "Nuevo" },
  { id: "contactado", label: "Contactado" },
  { id: "en_seguimiento", label: "En seguimiento" },
  { id: "respondio", label: "Respondió" },
  { id: "reunion", label: "Reunión agendada" },
  { id: "descartado", label: "Descartado" },
];

export const ESTADO_COLOR = {
  nuevo: { bg: "#f1efe8", text: "#5f5e5a" },
  contactado: { bg: "#e6f1fb", text: "#0c447c" },
  en_seguimiento: { bg: "#faeeda", text: "#854f0b" },
  respondio: { bg: "#eaf3de", text: "#27500a" },
  reunion: { bg: "#eeedfe", text: "#3c3489" },
  descartado: { bg: "#fcebeb", text: "#791f1f" },
};

export function labelEstado(id) {
  return ESTADOS.find((e) => e.id === id)?.label || id;
}

export function segNombre(seg) {
  return `${seg.puesto} — ${seg.industria}`;
}

export function fillTemplate(str, c) {
  return (str || "")
    .replace(/\{\{nombre\}\}/g, c?.nombre || "")
    .replace(/\{\{empresa\}\}/g, c?.empresa || "")
    .replace(/\{\{puesto\}\}/g, c?.puesto || "")
    .replace(/\{\{industria\}\}/g, c?.industria || "")
    .replace(/\{\{pais\}\}/g, c?.pais || "");
}

export function gmailAuthUserKey() {
  return "panel_prospeccion_gmail_authuser";
}

export function gmailLink(to, subject, body, authuser) {
  const params = ["view=cm", "fs=1", "tf=1"];
  if (to) params.push(`to=${encodeURIComponent(to)}`);
  params.push(`su=${encodeURIComponent(subject || "")}`);
  params.push(`body=${encodeURIComponent(body || "")}`);
  return `https://mail.google.com/mail/u/${authuser ?? "0"}/?${params.join("&")}`;
}

export function waLink(c, mensaje) {
  const phone = (c.telefono || "").replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(mensaje || "")}`;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
