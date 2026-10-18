// Respaldo local (sin IA) para "dictar tareas" en Organización.
// Parte el texto en frases, detecta la empresa por nombre o por palabras
// clave y si la tarea es para hoy o para la semana.
// Devuelve el mismo formato que /api/audio-interpretar:
//   [{ texto, empresa, columna: "hoy" | "semana", on: true }]

import { hoyISO } from "@/lib/fechas";

const CLAVES_DEFAULT = {
  adspot: ["adspot", "ad spot", "dooh", "vía pública", "via publica", "campaña", "farmacias", "dove", "alemán", "aleman", "cheetos"],
  gprosoft: ["gprosoft", "gpro", "erp", "delpack", "riojana", "implementación", "implementacion", "blue sky", "pleno"],
  tuequipo: ["tu equipo", "tuequipo", "equipo ia", "instagram", "reel", "landing", "mails", "casos de uso", "viandas"],
};

const escRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function interpretarOrganizacion(texto, empresas = []) {
  if (!texto || !texto.trim()) return [];
  const lista = empresas.map((e) => ({
    id: e.id,
    nombre: String(e.nombre || "").toLowerCase(),
    claves: [...(CLAVES_DEFAULT[e.id] || []), ...(e.claves || [])].map((k) => k.toLowerCase()),
  }));

  const frases = texto
    .split(/(?<=[.;])\s+|\s+y\s+(?=para\s)|,?\s+y\s+(?=[a-záéí]+(?:ar|er|ir)(?:le|les|lo|la)?\s)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  // "para GproSoft," / "para Tu Equipo IA" al principio de la frase
  const nombres = [...new Set([...lista.map((e) => e.nombre).filter(Boolean), "tu equipo ia", "tu equipo"])]
    .sort((a, b) => b.length - a.length)
    .map(escRegex);
  const prefijo = nombres.length ? new RegExp(`^(y\\s+)?(para\\s+(${nombres.join("|")})\\s*,?\\s*)`, "i") : null;

  let empresaPrevia = null;
  return frases
    .map((f) => {
      const low = f.toLowerCase();
      const encontrada = lista.find((e) => (e.nombre && low.includes(e.nombre)) || e.claves.some((k) => low.includes(k)));
      const empresa = encontrada ? encontrada.id : empresaPrevia;
      empresaPrevia = empresa;
      const columna = /\bhoy\b/.test(low) ? "hoy" : "semana";
      let t = f;
      if (prefijo) t = t.replace(prefijo, "");
      t = t
        .replace(/^y\s+/i, "")
        .replace(/\b(hoy|esta semana)\b\s*,?/gi, "")
        .replace(/^\s*(tengo que|tengo|hay que|necesito)\s+/i, "")
        .replace(/[.;]+$/, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      t = t.charAt(0).toUpperCase() + t.slice(1);
      return { texto: t, empresa: empresa || null, columna, fecha: columna === "hoy" ? hoyISO() : null, on: true };
    })
    .filter((p) => p.texto);
}
