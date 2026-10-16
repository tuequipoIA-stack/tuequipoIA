import { diasHasta } from "@/lib/fechas";
import { C } from "@/lib/theme";

export const ETAPAS = {
  calificado: { l: "Calificado", bg: "#e3e9f5", fg: "#3b5d99", bar: "#7f9bd0" },
  propuesta_enviada: { l: "Propuesta enviada", bg: "#f3e6cf", fg: "#9a6421", bar: "#d9a35a" },
  negociacion: { l: "Negociación", bg: "#dbeee0", fg: "#2f7a45", bar: "#4f9e66" },
  ganado: { l: "Ganado", bg: "#2f7a45", fg: "#fff", bar: "#2f7a45" },
  perdido: { l: "Perdido", bg: "#e9d2cf", fg: "#9b3c35", bar: "#c25a54" },
};
export const ETAPAS_ORDEN = ["calificado", "propuesta_enviada", "negociacion", "ganado", "perdido"];
export const ETAPAS_ABIERTAS = ["calificado", "propuesta_enviada", "negociacion"];

export const TIPOS_DOC = { propuesta: "Propuesta comercial", cotizacion: "Cotización", artifact: "Artifact / mockup", otro: "Otro" };
export const TIPO_DOC_COL = {
  propuesta: { bg: "#e2eafa", fg: "#2f5fb3" },
  cotizacion: { bg: "#f6e3c9", fg: "#9a6421" },
  artifact: { bg: "#d6efee", fg: "#127a79" },
  otro: { bg: C.chip, fg: C.muted },
};
export const CANALES = ["Reunión", "Llamada", "WhatsApp", "Mail", "Videollamada"];
export const COLUMNA_LABEL = { semana: "Esta semana", hoy: "Hoy", hecho: "Hecha" };
export const COLUMNA_COL = {
  semana: { bg: "#f1e1c8", fg: "#a8732f" },
  hoy: { bg: "#d9e5f1", fg: "#335f8f" },
  hecho: { bg: "#d9eadc", fg: "#357a49" },
};

export const TC_DEFAULT = 1450;
export const SIN_EMPRESA = { id: null, nombre: "Sin empresa", color: "#958b74" };

export const normalizar = (o) => ({
  contactos: [], proximos: [], docs: [], conv: [], notas: "", prob: 50, moneda: "USD", valor: 0, rubro: "", empresa: null,
  ...o,
  contactos: Array.isArray(o?.contactos) ? o.contactos : [],
  proximos: Array.isArray(o?.proximos) ? o.proximos : [],
  docs: Array.isArray(o?.docs) ? o.docs : [],
  conv: Array.isArray(o?.conv) ? o.conv : [],
});

export const enCurso = (o) => o.etapa !== "ganado" && o.etapa !== "perdido";
export const ultima = (o) => (o.conv.length ? o.conv.map((c) => c.f).sort().at(-1) : null);
export const ultimaObj = (o) => {
  const u = ultima(o);
  return u ? o.conv.filter((c) => c.f === u).at(-1) : null;
};
export const proxima = (o) => o.proximos.filter((p) => !p.h && p.f).map((p) => p.f).sort()[0] || null;
export const proxObj = (o) => {
  const f = proxima(o);
  return f ? o.proximos.find((p) => p.f === f && !p.h) : null;
};
export const enUSD = (o, tc) => {
  const v = Number(o.valor) || 0;
  return o.moneda === "ARS" ? v / (tc || TC_DEFAULT) : v;
};
export const money = (n, m) => (m === "USD" ? "USD " : "$ ") + Math.round(Number(n || 0)).toLocaleString("es-AR");

export const proxEn = (o, cond) => {
  const p = proxima(o);
  if (!p) return false;
  return cond(diasHasta(p));
};

// Tareas de una oportunidad: tablero (pendientes y hechas) + acumuladas (hechas)
export const tareasDe = (num, tablero, acumuladas) => [
  ...tablero.filter((t) => t.opNum === num),
  ...acumuladas.filter((t) => t.opNum === num).map((t) => ({ ...t, columna: "hecho" })),
];
export const pendientesDe = (num, tablero) => tablero.filter((t) => t.opNum === num && t.columna !== "hecho").length;

// Estilos compartidos
export const sel = { background: C.card, border: `1px solid ${C.line}`, outline: "none", borderRadius: 8, padding: "7px 9px", fontSize: 12.5, fontWeight: 600, color: C.ink };
export const inp = { background: C.card, border: `1px solid ${C.line}`, outline: "none", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: C.ink, minWidth: 0 };
export const btnTeal = { background: "#1AABAA", color: "#1A1A2E" };

export const CSS = `
.crmop-row{display:grid;grid-template-columns:44px minmax(160px,1.6fr) 128px 110px 140px 150px 64px;gap:12px;align-items:center;padding:11px 16px}
.crmop-th{font-size:10px;text-transform:uppercase;letter-spacing:.05em;font-weight:700}
.crmop-op{cursor:pointer;font-size:13px}
.crmop-op:hover{background:#efe8da}
.crmop-flash{animation:crmopflash 2s ease}
@keyframes crmopflash{0%{background:#cfeeed}100%{background:transparent}}
.crmop-dgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media (max-width:1000px){
  .crmop-th{display:none}
  .crmop-op{grid-template-columns:40px 1fr auto;gap:6px 12px}
  .crmop-op .c-etapa{grid-column:3;grid-row:1;justify-self:end}
  .crmop-op .c-valor{grid-column:3;justify-self:end}
  .crmop-op .c-ult,.crmop-op .c-prox{grid-column:2}
  .crmop-op .c-iconos{grid-column:3;justify-self:end}
  .crmop-dgrid{grid-template-columns:1fr}
}
@media (max-width:760px){
  .crmop-campos{grid-template-columns:1fr !important}
}
`;
