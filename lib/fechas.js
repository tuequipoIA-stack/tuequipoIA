// Utilidades de fechas usadas en Organización, CRM y Ventas.
// Todas las fechas se guardan como texto "YYYY-MM-DD" (día) o "YYYY-MM" (mes),
// en hora local, para no tener corrimientos por zona horaria.

const DIA = 864e5;

export function hoy0() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function aISO(d) {
  const z = new Date(d);
  return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, "0")}-${String(z.getDate()).padStart(2, "0")}`;
}

export function hoyISO() {
  return aISO(hoy0());
}

// Fecha ISO a n días de hoy (negativo = pasado)
export function relISO(n) {
  return aISO(hoy0().getTime() + n * DIA);
}

export function sumarDias(iso, n) {
  return aISO(new Date(iso + "T00:00:00").getTime() + n * DIA);
}

// Días desde hoy hasta la fecha (positivo = futuro, negativo = pasado)
export function diasHasta(iso) {
  return Math.round((new Date(iso + "T00:00:00") - hoy0()) / DIA);
}

// Días transcurridos desde la fecha hasta hoy
export function diasDesde(iso) {
  return -diasHasta(iso);
}

const DSEM = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export function fechaCorta(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}
export function fechaDia(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${DSEM[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ---- Meses ("YYYY-MM") ----
export function mesKey(offset = 0) {
  const h = hoy0();
  const d = new Date(h.getFullYear(), h.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
// Cuántos meses hay entre el mes actual y el mes dado (0 = este mes)
export function mesOffset(k) {
  const h = hoy0();
  const [y, m] = k.split("-").map(Number);
  return (y - h.getFullYear()) * 12 + (m - 1 - h.getMonth());
}
export function mesSumar(k, n) {
  return mesKey(mesOffset(k) + n);
}
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export function mesCorto(k) {
  const [y, m] = k.split("-").map(Number);
  return `${MESES[m - 1]} ${String(y).slice(2)}`;
}
export function mesLargo(k) {
  const [y, m] = k.split("-").map(Number);
  return `${MESES_LARGO[m - 1]} ${y}`;
}

// Lunes de la semana de una fecha ISO
export function lunesDe(iso) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return aISO(d);
}
