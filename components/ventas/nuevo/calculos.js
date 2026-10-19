// Cálculos de Ventas (Operativa y Ganancias). Las reglas de ganancia salen
// de la empresa de cada proyecto (empresa.modelo + pct / agencia / hora).
import { mesKey, mesOffset, mesSumar, mesCorto } from "@/lib/fechas";
import { normalizarCV, resumenCV, mesGananciaCV } from "@/lib/compraventa";

export const ESTADOS_HITO = { pendiente: "Pendiente", en_curso: "En curso", hecho: "Hecho" };

export const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

export const money = (n, m) => (m === "USD" ? "USD " : "$ ") + Math.round(n || 0).toLocaleString("es-AR");

export const modeloDe = (e) => e?.modelo || "ninguno";

const esMes = (k) => typeof k === "string" && /^\d{4}-\d{2}$/.test(k);

// Completa los campos que falten según el modelo de la empresa (defensivo).
export function normalizar(p, e) {
  const modelo = modeloDe(e);
  const base = {
    ...p,
    cliente: p.cliente || "",
    desc: p.desc || "",
    moneda: p.moneda || (modelo === "agencia" ? "USD" : "ARS"),
    hitos: Array.isArray(p.hitos) ? p.hitos.map((h) => ({ n: h?.n || "", f: h?.f || "", estado: ESTADOS_HITO[h?.estado] ? h.estado : "pendiente" })) : [],
    horas: Array.isArray(p.horas) ? p.horas.filter(Boolean).map((h) => ({ f: h.f || "", h: num(h.h), d: h.d || "" })) : [],
  };
  if (modelo === "cuotas") {
    base.venta = num(p.venta);
    base.cuotas = Math.max(1, Math.round(num(p.cuotas)) || 1);
    base.inicio = esMes(p.inicio) ? p.inicio : mesKey(0);
    base.cobradas = Array.isArray(p.cobradas) ? p.cobradas.filter(esMes) : [];
  } else if (modelo === "agencia") {
    base.ejecucion = Array.isArray(p.ejecucion) ? p.ejecucion.filter((x) => x && esMes(x.mes)).map((x) => ({ mes: x.mes, monto: num(x.monto) })) : [];
    base.pagadas = Array.isArray(p.pagadas) ? p.pagadas.filter(esMes) : [];
    base.agencia = p.agencia === null || p.agencia === undefined || p.agencia === "" || isNaN(Number(p.agencia)) ? null : Number(p.agencia);
  } else if (modelo === "propio") {
    base.precio = num(p.precio);
    base.cobros = Array.isArray(p.cobros) ? p.cobros.filter((c) => c && esMes(c.mes)).map((c) => ({ mes: c.mes, monto: num(c.monto), ok: !!c.ok })) : [];
    base.otros = Array.isArray(p.otros) ? p.otros.filter(Boolean).map((o) => ({ d: o.d || "", m: num(o.m) })) : [];
  } else if (modelo === "compraventa") {
    base.moneda = "ARS";
    base.cv = normalizarCV(p.cv);
  }
  return base;
}

export const horasTot = (p) => (p.horas || []).reduce((a, h) => a + num(h.h), 0);

// % de agencia del cliente, o el predeterminado de la empresa
export const agDe = (p, e) => (p.agencia ?? num(e?.agencia ?? 25));

export const proxHito = (p) =>
  p.hitos.filter((h) => h.estado !== "hecho").sort((a, b) => String(a.f).localeCompare(String(b.f)))[0];

export function entregado(p, e) {
  if (modeloDe(e) === "compraventa") return !!p.cv?.venta?.f && p.cv.cobrado;
  return (
    p.hitos.length > 0 &&
    p.hitos.every((h) => h.estado === "hecho") &&
    (modeloDe(e) !== "agencia" || (p.ejecucion || []).every((x) => mesOffset(x.mes) < 0))
  );
}

// Cada ingreso propio con el mes en que se cobra.
export function movimientos(p, e) {
  const modelo = modeloDe(e);
  const pct = num(e?.pct);
  if (modelo === "cuotas") {
    const cuota = p.venta / p.cuotas;
    const com = (cuota * pct) / 100;
    return Array.from({ length: p.cuotas }, (_, i) => {
      const mes = mesSumar(p.inicio, i);
      return {
        mes, monto: com, moneda: p.moneda, ok: p.cobradas.includes(mes), i, cuotaCli: cuota,
        det: `Cuota ${i + 1}/${p.cuotas} del cliente: ${money(cuota, p.moneda)}`,
      };
    });
  }
  if (modelo === "agencia") {
    const ag = agDe(p, e);
    return p.ejecucion.map((x, i) => {
      const neto = x.monto * (1 - ag / 100);
      const mes = mesSumar(x.mes, 1);
      return {
        mes, monto: (neto * pct) / 100, moneda: p.moneda, ok: p.pagadas.includes(mes), ejec: x, neto, i,
        det: `Ejecutado en ${mesCorto(x.mes)}: ${money(x.monto, p.moneda)} · agencia ${ag}%`,
      };
    });
  }
  if (modelo === "compraventa") {
    const r = resumenCV(p.cv);
    const mes = mesGananciaCV(p.cv);
    return [{
      mes, monto: r.ganancia, moneda: "ARS", ok: r.vendido && p.cv.cobrado,
      det: `Venta ${Math.round(r.venta).toLocaleString("es-AR")} − inversión ${Math.round(r.inversion).toLocaleString("es-AR")}`,
    }];
  }
  if (modelo === "propio") {
    const hora = num(e?.hora);
    const porMes = {};
    p.cobros.forEach((c) => { porMes[c.mes] = (porMes[c.mes] || 0) + c.monto; });
    p.horas.forEach((h) => {
      if (!h.f) return;
      const k = h.f.slice(0, 7);
      porMes[k] = (porMes[k] || 0) - h.h * hora;
    });
    if (p.otros.length) {
      const k = p.cobros[0]?.mes || mesKey(0);
      porMes[k] = (porMes[k] || 0) - p.otros.reduce((a, o) => a + o.m, 0);
    }
    return Object.entries(porMes).map(([mes, monto]) => ({
      mes, monto, moneda: p.moneda,
      ok: mesOffset(mes) < 0 || (mesOffset(mes) === 0 && p.cobros.filter((c) => c.mes === mes).every((c) => c.ok)),
      det: "Cobros − costos del mes",
    }));
  }
  return [];
}

export function resumenPropio(p, e) {
  const hora = num(e?.hora);
  const cobrado = p.cobros.filter((c) => c.ok).reduce((a, c) => a + c.monto, 0);
  const ch = horasTot(p) * hora;
  const co = p.otros.reduce((a, o) => a + o.m, 0);
  const gan = p.precio - ch - co;
  return { cobrado, ch, co, gan, margen: p.precio ? (gan / p.precio) * 100 : 0 };
}

export const aARS = (n, m, tc) => (m === "USD" ? n * tc : n);

// Suma por moneda: { ARS: n, USD: n }
export function porMoneda(movs) {
  const r = {};
  movs.forEach((m) => { const k = m.moneda === "USD" ? "USD" : "ARS"; r[k] = (r[k] || 0) + m.monto; });
  return r;
}
