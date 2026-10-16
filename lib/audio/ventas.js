// Respaldo local (sin IA) para "actualizar por audio" en Ventas.
// Busca cada proyecto nombrado por número ("la cuatro", "#12") o por cliente,
// parte lo que se dijo de cada uno en frases y arma los cambios:
// hitos terminados / empezados, fechas que se mueven, horas, cuotas cobradas,
// comisiones cobradas, montos ejecutados y cobros del cliente.
// Devuelve el mismo formato que /api/audio-interpretar:
//   [{ num, cambios: [{ tipo: "hito"|"fecha"|"horas"|"cuota"|"pago"|"ejec"|"cobro", on: true, ... }] }]

import { aISO, hoy0, relISO, mesKey, mesSumar } from "@/lib/fechas";

// Ejemplos para probar el audio, según cómo gana cada empresa.
export const EJEMPLOS_VENTAS = {
  cuotas:
    "La cuatro, El Depósito: cobramos la cuota de octubre y terminamos la implementación, la capacitación pasa al 20 de noviembre. La once, Grupo Gardien: cargá tres horas de reunión de seguimiento.",
  agencia:
    "La doce, Cheetos: ejecutamos 10.500 dólares en octubre. La uno, Farmacias Económicas: me pagaron la comisión de septiembre y mandé el reporte de octubre.",
  propio:
    "La catorce, Distribuidora Andina: terminé el primer entregable, le dediqué seis horas al modelo de costeo y la entrega del sistema pasa al viernes 30. La trece, Marche: cobré la segunda cuota.",
};

export function ejemploVentas(modelos = []) {
  const lista = [...new Set(modelos)].filter((m) => EJEMPLOS_VENTAS[m]);
  if (!lista.length) return EJEMPLOS_VENTAS.cuotas;
  return lista.map((m) => EJEMPLOS_VENTAS[m]).join(" ");
}

const NUMW = {
  uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, "dieciséis": 16, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20,
};
const ORD = { primera: 0, primer: 0, segunda: 1, tercera: 2, cuarta: 3, quinta: 4, sexta: 5 };
const MES_N = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8,
  septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};
const DIA_N = { domingo: 0, lunes: 1, martes: 2, "miércoles": 3, miercoles: 3, jueves: 4, viernes: 5, "sábado": 6, sabado: 6 };
const MESES_RE = "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre";
const STOP = new Set(["de", "del", "la", "el", "y", "a", "por", "con", "para", "los", "las", "reporte", "fin"]);

const escRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const nombreCliente = (p) => String(p.cliente || "").toLowerCase().split(/[·!]/)[0].trim();

function mesKeyDe(nombre) {
  const m = MES_N[nombre];
  if (!m) return null;
  const h = hoy0();
  let y = h.getFullYear();
  if (m < h.getMonth() + 1 - 6) y++;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function fechaDe(t) {
  let m = t.match(new RegExp(`(\\d{1,2}) de (${MESES_RE})`));
  if (m) return `${mesKeyDe(m[2])}-${String(m[1]).padStart(2, "0")}`;
  m = t.match(/(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\s*(\d{1,2})?/);
  if (m) {
    const d = hoy0();
    if (m[2]) {
      const n = +m[2];
      if (n < d.getDate()) d.setMonth(d.getMonth() + 1);
      d.setDate(n);
      return aISO(d);
    }
    const k = (DIA_N[m[1]] - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + k);
    return aISO(d);
  }
  if (/pasado mañana/.test(t)) return relISO(2);
  if (/\bmañana\b/.test(t)) return relISO(1);
  if (/semana que viene|próxima semana|proxima semana/.test(t)) return relISO(7);
  return null;
}

function mesEn(t) {
  const m = t.match(new RegExp(`(${MESES_RE})`));
  return m ? mesKeyDe(m[1]) : null;
}

// Hito cuyo nombre aparece en la frase (prioriza la coincidencia más completa)
function hitoEn(p, t) {
  let best = null;
  let score = 0;
  (p.hitos || []).forEach((h, i) => {
    const pal = String(h.n || "").toLowerCase().split(/[\s/·]+/).filter((w) => w.length > 3 && !STOP.has(w));
    const s = pal.filter((w) => t.includes(w.slice(0, Math.max(5, w.length - 2)))).length / (pal.length || 1);
    if (s > score && s >= 0.5) { score = s; best = i; }
  });
  return best;
}

export function interpretarVentas(texto, proyectos = [], empresas = []) {
  if (!texto || !texto.trim()) return [];
  const modeloDe = (p) => empresas.find((e) => e.id === p.empresa)?.modelo || "ninguno";
  const palabras = Object.keys(NUMW).sort((a, b) => b.length - a.length).join("|");
  const t = texto
    .toLowerCase()
    .replace(new RegExp(`\\b(la|número|numero|proyecto)\\s+(${palabras})(?![a-záéíóúñ])`, "g"), (m, a, b) => `${a} ${NUMW[b]}`);

  const marcas = [];
  t.replace(/(?:\bla|\bnúmero|\bnumero|\bproyecto|#)\s*(\d{1,4})\b/g, (m, n, pos) => {
    if (proyectos.some((p) => Number(p.num) === +n)) marcas.push({ pos, num: +n, len: m.length });
    return m;
  });
  proyectos.forEach((p) => {
    const n = nombreCliente(p);
    if (n.length < 3) return;
    let i = t.indexOf(n);
    while (i >= 0) {
      if (!marcas.some((m) => Math.abs(m.pos - i) < 25)) marcas.push({ pos: i, num: Number(p.num), len: n.length });
      i = t.indexOf(n, i + 1);
    }
  });
  marcas.sort((a, b) => a.pos - b.pos);

  const porNum = new Map();
  marcas.forEach((m, mi) => {
    const p = proyectos.find((x) => Number(x.num) === m.num);
    if (!p) return;
    const modelo = modeloDe(p);
    const nc = nombreCliente(p);
    let seg = t.slice(m.pos + m.len, mi + 1 < marcas.length ? marcas[mi + 1].pos : t.length);
    if (nc) seg = seg.replace(new RegExp("^[\\s,:.!-]*" + escRegex(nc)), "");
    seg = seg.replace(/^[\s,:.!-]+/, "");
    const frases = seg
      .split(/(?<=[.;])\s+|,\s*|\s+y\s+(?=(?:la|el|le|me|mand|termin|cobr|ejecut|carg|dediq|pas|empec|arranc)\w*)/)
      .map((s) => s.replace(/[.;\s]+$/, "").trim())
      .filter((s) => s.length > 3);

    const cambios = porNum.get(m.num) || [];
    const cobros = p.cobros || [];
    frases.forEach((f) => {
      // Horas
      const hm = f.match(/(\d+(?:[.,]\d+)?|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\s+horas?/);
      if (hm) {
        const n = parseFloat(String(NUMW[hm[1]] || hm[1]).replace(",", "."));
        const det = f
          .replace(/^(cargá|carga|cargar|le dediqué|dediqué|trabajé|metí)\s*/, "")
          .replace(hm[0], "")
          .replace(/^\s*(de|al|a la|en)\s+/, "")
          .trim();
        cambios.push({ tipo: "horas", on: true, h: n, d: cap(det || "Horas de trabajo"), f: relISO(0) });
        return;
      }
      // Ejecución (agencia)
      if (modelo === "agencia") {
        const em = f.match(/ejecut\w*\s+(?:usd\s*)?([\d.,]+)\s*(mil)?/);
        if (em) {
          let v = parseFloat(em[1].replace(/\./g, "").replace(",", "."));
          if (em[2]) v *= 1000;
          if (!isNaN(v)) { cambios.push({ tipo: "ejec", on: true, mes: mesEn(f) || mesKey(0), monto: Math.round(v) }); return; }
        }
      }
      // Cobros / pagos
      if (/(cobr|pag[oóa]|pagaron|abon)/.test(f)) {
        if (modelo === "cuotas") {
          let mes = mesEn(f);
          const o = Object.keys(ORD).find((w) => f.includes(w));
          if (!mes && o !== undefined && p.inicio) mes = mesSumar(p.inicio, ORD[o]);
          cambios.push({ tipo: "cuota", on: true, mes: mes || mesKey(0) });
          return;
        }
        if (modelo === "agencia") {
          cambios.push({ tipo: "pago", on: true, ejecMes: mesEn(f) || mesKey(-1) });
          return;
        }
        if (modelo === "propio") {
          const o = Object.keys(ORD).find((w) => f.includes(w));
          let idx = o !== undefined ? ORD[o] : cobros.findIndex((c) => !c.ok);
          const mes = mesEn(f);
          if (mes) { const j = cobros.findIndex((c) => c.mes === mes); if (j >= 0) idx = j; }
          if (idx >= 0 && cobros[idx]) cambios.push({ tipo: "cobro", on: true, idx });
          return;
        }
      }
      // Hitos
      const hi = hitoEn(p, f);
      if (hi !== null) {
        const fecha = fechaDe(f);
        if (fecha && /(pasa|mueve|movemos|cambia|para el|al |posterg|adelant|reprogram)/.test(f)) cambios.push({ tipo: "fecha", on: true, hi, f: fecha });
        else if (/(termin|list[oa]|complet|finaliz|entregu|mand[eé]|envi[eé]|hech[oa]|cerramos|aprob)/.test(f)) cambios.push({ tipo: "hito", on: true, hi, e: "hecho" });
        else if (/(empez|arranc|comenz|inici)/.test(f)) cambios.push({ tipo: "hito", on: true, hi, e: "en_curso" });
      }
    });
    porNum.set(m.num, cambios);
  });

  return [...porNum.entries()].map(([num, cambios]) => ({ num, cambios })).filter((x) => x.cambios.length);
}
