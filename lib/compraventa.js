// Modelo de ganancia "compraventa": comprás un producto, lo arreglás y lo vendés.
// Los datos viven en `cv` dentro de la oportunidad del CRM y se copian al
// proyecto de Ventas cuando se marca como vendido (ganado).
//
// cv = {
//   compra:   { f: "YYYY-MM-DD", monto, de: "a quién se lo compraste" },
//   arreglos: [{ f, d: "qué se hizo", m: costo }],
//   listo:    "YYYY-MM-DD"   // terminó el arreglo / quedó a la venta
//   objetivo: precio de venta esperado
//   venta:    { f, monto, a: "a quién se lo vendiste" },
//   cobrado:  true/false     // si ya cobraste la venta
// }
import { hoyISO } from "@/lib/fechas";

const DIA = 864e5;
const n = (v) => {
  const x = parseFloat(String(v ?? "").replace(",", "."));
  return isNaN(x) ? 0 : x;
};
const esDia = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const dias = (a, b) => (esDia(a) && esDia(b) ? Math.max(0, Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / DIA)) : null);

export const ETAPAS_COMPRAVENTA = {
  calificado: "Comprado",
  propuesta_enviada: "En arreglo",
  negociacion: "A la venta",
  ganado: "Vendido",
  perdido: "Descartado",
};

export const esCompraventa = (empresa) => empresa?.modelo === "compraventa";

// Etiqueta de etapa según la empresa (compraventa usa sus propios nombres)
export const etiquetaEtapa = (k, empresa, ETAPAS) =>
  esCompraventa(empresa) ? ETAPAS_COMPRAVENTA[k] || ETAPAS[k]?.l : ETAPAS[k]?.l;

export function normalizarCV(cv) {
  const c = cv || {};
  return {
    compra: { f: esDia(c.compra?.f) ? c.compra.f : "", monto: n(c.compra?.monto), de: c.compra?.de || "" },
    arreglos: Array.isArray(c.arreglos) ? c.arreglos.filter(Boolean).map((a) => ({ f: esDia(a.f) ? a.f : "", d: a.d || "", m: n(a.m) })) : [],
    listo: esDia(c.listo) ? c.listo : "",
    objetivo: n(c.objetivo),
    venta: { f: esDia(c.venta?.f) ? c.venta.f : "", monto: n(c.venta?.monto), a: c.venta?.a || "" },
    cobrado: c.cobrado === undefined ? true : !!c.cobrado,
  };
}

// Estado del producto según las fechas cargadas
export function estadoCV(cv) {
  if (cv.venta.f) return "vendido";
  if (cv.listo) return "a_la_venta";
  if (cv.arreglos.length) return "en_arreglo";
  if (cv.compra.f) return "comprado";
  return "sin_datos";
}
export const ESTADO_CV_LABEL = {
  vendido: "Vendido", a_la_venta: "A la venta", en_arreglo: "En arreglo", comprado: "Comprado", sin_datos: "Sin cargar",
};

// Números de rentabilidad. Si no se vendió todavía, usa el precio objetivo
// y cuenta los días hasta hoy (proyección).
export function resumenCV(cv) {
  const hoy = hoyISO();
  const compra = cv.compra.monto;
  const arreglos = cv.arreglos.reduce((a, x) => a + x.m, 0);
  const inversion = compra + arreglos;
  const vendido = !!cv.venta.f;
  const venta = vendido ? cv.venta.monto : cv.objetivo;
  const ganancia = venta - inversion;
  const margen = venta ? (ganancia / venta) * 100 : 0; // sobre el precio de venta
  const roi = inversion ? (ganancia / inversion) * 100 : 0; // sobre lo invertido

  // Fin del arreglo: fecha "listo", o el último arreglo cargado
  const ultArreglo = cv.arreglos.map((a) => a.f).filter(esDia).sort().at(-1) || "";
  const finArreglo = cv.listo || ultArreglo;
  const hasta = vendido ? cv.venta.f : hoy;

  const diasArreglo = finArreglo ? dias(cv.compra.f, finArreglo) : cv.arreglos.length && !vendido ? dias(cv.compra.f, hoy) : null;
  const diasVenta = finArreglo ? dias(finArreglo, hasta) : null; // publicado → vendido
  const diasTotal = dias(cv.compra.f, hasta); // capital inmovilizado
  const gananciaDia = diasTotal ? ganancia / diasTotal : null;
  const roiMensual = diasTotal ? (roi / diasTotal) * 30 : null;
  const roiAnual = diasTotal ? (roi / diasTotal) * 365 : null;

  return {
    compra, arreglos, inversion, venta, ganancia, margen, roi, vendido,
    diasArreglo, diasVenta, diasTotal, gananciaDia, roiMensual, roiAnual,
  };
}

// Mes en que se registra la ganancia (el de la venta, o el actual si no se vendió)
export const mesGananciaCV = (cv) => (cv.venta.f || hoyISO()).slice(0, 7);
