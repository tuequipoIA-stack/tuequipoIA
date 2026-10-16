// Respaldo local (sin IA) para "actualizar por audio" en el CRM.
// Detecta cada oportunidad por número ("la 5", "número cinco", "#5") o por el
// nombre del cliente, y arma los cambios: conversación, etapa, próximo contacto
// y tareas. Devuelve el mismo formato que /api/audio-interpretar:
//   [{ num | null, cambios: [{ tipo: "conv", f, c, r, on } | { tipo: "etapa", e, on }
//                            | { tipo: "proximo", f, m, on } | { tipo: "tarea", t, c, on }] }]

import { hoy0, aISO, relISO } from "@/lib/fechas";

const NUMS = { uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciséis: 16, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20 };
const DIAS_N = { domingo: 0, lunes: 1, martes: 2, "miércoles": 3, miercoles: 3, jueves: 4, viernes: 5, "sábado": 6, sabado: 6 };

const escRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function fechaDe(t) {
  if (/pasado mañana/.test(t)) return relISO(2);
  if (/\bmañana\b/.test(t)) return relISO(1);
  if (/\bhoy\b/.test(t) && /(llamar|reun|contact|volver|mandar)/.test(t)) return relISO(0);
  if (/semana que viene|próxima semana|proxima semana/.test(t)) {
    const d = hoy0();
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    return aISO(d);
  }
  for (const [n, i] of Object.entries(DIAS_N)) {
    if (new RegExp("(^|[^a-záéíóúñ])" + n + "($|[^a-záéíóúñ])").test(t)) {
      const d = hoy0();
      let k = (i - d.getDay() + 7) % 7;
      if (k === 0) k = 7;
      d.setDate(d.getDate() + k);
      return aISO(d);
    }
  }
  return null;
}

const limpiarFecha = (s) =>
  s
    .replace(/(^|\s)(el|este|esta|la)?\s*(pasado mañana|mañana|hoy|semana que viene|próxima semana|proxima semana|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)(?=$|[\s,.;])/gi, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s,]+$/, "")
    .trim();

export function interpretarCrm(raw, oportunidades = []) {
  if (!raw || !raw.trim()) return [];
  const ops = (oportunidades || []).filter((o) => o && o.num != null);
  const palabrasNum = Object.keys(NUMS).join("|");
  let t = raw
    .toLowerCase()
    .replace(new RegExp(`\\b(la|número|numero|oportunidad)\\s+(${palabrasNum})(?![a-záéíóúñ])`, "g"), (m, a, b) => `${a} ${NUMS[b]}`);

  // Marcas: "la 5", "número 5", "#5" o el nombre de un cliente
  const marcas = [];
  t.replace(/(?:\bla|número|\bnumero|\boportunidad|#)\s*(\d{1,4})\b/g, (m, n, pos) => {
    if (ops.some((o) => o.num === +n) || !ops.length) marcas.push({ pos, num: +n, len: m.length });
    return m;
  });
  ops.forEach((o) => {
    const n = String(o.cliente || "").toLowerCase().trim();
    if (n.length < 3) return;
    let i = t.indexOf(n);
    while (i >= 0) {
      if (!marcas.some((m) => Math.abs(m.pos - i) < 25)) marcas.push({ pos: i, num: o.num, len: n.length });
      i = t.indexOf(n, i + 1);
    }
  });
  marcas.sort((a, b) => a.pos - b.pos);
  if (!marcas.length) marcas.push({ pos: 0, num: null, len: 0 });

  return marcas
    .map((m, i) => {
      let seg = t.slice(m.pos + m.len, i + 1 < marcas.length ? marcas[i + 1].pos : t.length);
      const o = ops.find((x) => x.num === m.num);
      if (o && o.cliente) seg = seg.replace(new RegExp("^[\\s,:.-]*" + escRegex(String(o.cliente).toLowerCase())), "");
      seg = seg.replace(/^[\s,:.-]+/, "");
      const frases = seg
        .split(/(?<=[.;])\s+|,\s*(?=(?:volver|llamar|mandar|enviar|armar|preparar|pedir|reunirnos|quedamos)\b)/)
        .map((s) => s.replace(/[.;,\s]+$/, "").trim())
        .filter((s) => s.length > 3);
      const cambios = [];
      const convF = [];
      let canal = "Llamada";
      if (/whats/.test(seg)) canal = "WhatsApp";
      else if (/videollamada|meet|zoom/.test(seg)) canal = "Videollamada";
      else if (/reuni[oó]n|nos reunimos|visita/.test(seg)) canal = "Reunión";
      else if (/mail|correo/.test(seg)) canal = "Mail";

      frases.forEach((f) => {
        const fecha = fechaDe(f);
        if (fecha && /(reun|llam|volver|contact|quedamos|ver(nos)?\b|mostrar|presentar)/.test(f)) {
          cambios.push({ tipo: "proximo", on: true, f: fecha, m: cap(limpiarFecha(f.replace(/^quedamos en\s+/, ""))) });
        } else if (/^(mandar|enviar|armar|preparar|pedir|hacer|pasar|actualizar|cotizar)\b/.test(f)) {
          cambios.push({ tipo: "tarea", on: true, t: cap(f), c: /\bhoy\b/.test(f) ? "hoy" : "semana" });
        } else convF.push(f);
      });

      let etapa = null;
      if (/negociaci/.test(seg)) etapa = "negociacion";
      else if (/(mand[eé]|envi[eé]|enviamos|mandamos) (la )?propuesta|propuesta enviada/.test(seg)) etapa = "propuesta_enviada";
      else if (/cerramos|firmaron|ganamos|lo ganamos/.test(seg)) etapa = "ganado";
      else if (/perdimos|no van a avanzar|descartaron|no sigue/.test(seg)) etapa = "perdido";
      if (etapa && (!o || o.etapa !== etapa)) cambios.unshift({ tipo: "etapa", on: true, e: etapa });
      if (convF.length) {
        cambios.unshift({ tipo: "conv", on: true, f: relISO(0), c: canal, r: cap(convF.join(". ").replace(/^hoy\s+/, "")) + "." });
      }
      return { num: o ? o.num : null, cambios };
    })
    .filter((p) => p.cambios.length);
}
