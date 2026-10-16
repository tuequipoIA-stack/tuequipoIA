import { hoyISO, diasDesde } from "@/lib/fechas";
import { C } from "@/lib/theme";

// Días que una tarea queda en "Tareas hechas" antes de pasar sola a "Tareas acumuladas".
export const DIAS_ARCHIVO = 3;

// Tarjetas de la "Rutina del plan" (tareas diarias que vienen del Plan de negocio).
export const COLOR_PLAN_DIARIO = { bg: "#f3ecf6", border: "#e1d2ea", tagBg: "#e9dcf3", tagText: "#7c3aed" };

// Estilo de los selects chiquitos de las tarjetas.
export const MINI = { background: C.chip, color: C.muted, border: "none", outline: "none" };
export const MINI_CLS = "text-[10px] px-1.5 py-1 rounded-md font-semibold min-w-0";

// Cambia la columna de una tarea manteniendo `hechoEn` coherente:
// al entrar a "hecho" se marca la fecha; al salir se borra.
export function conColumna(t, col) {
  const n = { ...t, columna: col };
  if (col === "hecho" && t.columna !== "hecho") n.hechoEn = hoyISO();
  if (col !== "hecho") delete n.hechoEn;
  return n;
}

// Separa las tareas hechas hace DIAS_ARCHIVO días o más (pasan a acumuladas).
export function separarArchivables(lista) {
  const quedan = [];
  const pasan = [];
  for (const t of lista) {
    if (t.columna === "hecho" && t.hechoEn && diasDesde(t.hechoEn) >= DIAS_ARCHIVO) pasan.push(t);
    else quedan.push(t);
  }
  return { quedan, pasan };
}

// Tarea del tablero → registro de "tareas-acumuladas" (se conservan todos los campos).
export function aAcumulada(t) {
  const { columna, ...resto } = t;
  return { ...resto, id: t.id, texto: t.texto, empresa: t.empresa || null, hechoEn: t.hechoEn, audio: !!t.audio };
}

// ¿La tarea/objetivo pasa el filtro de empresa? ("sin" incluye empresas borradas)
export function pasaFiltro(item, filtro, porId) {
  if (filtro === "todas") return true;
  if (filtro === "sin") return !porId(item.empresa);
  return item.empresa === filtro;
}
