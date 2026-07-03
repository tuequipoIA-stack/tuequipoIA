"use client";

import { BRAND } from "@/lib/constants";

const PILARES = [
  {
    numero: "01",
    porcentaje: "25%",
    etiqueta: "Atracción",
    titulo: "Educativo",
    texto: "Enseñás algo útil de tu mundo. No vendés. Generás autoridad y guardados — la métrica que más valora el algoritmo en 2026. Tutoriales, mitos, errores comunes, datos.",
  },
  {
    numero: "02",
    porcentaje: "25%",
    etiqueta: "Conexión",
    titulo: "Inspiracional",
    texto: "Mostrás tu por qué, tu historia, tu detrás de escena, tus valores. Convierte seguidores fríos en comunidad. Reduce la fricción para que después te compren.",
  },
  {
    numero: "03",
    porcentaje: "20%",
    etiqueta: "Autoridad",
    titulo: "Prueba social",
    texto: "Resultados, testimonios, antes y después, casos. Es el pilar que más convierte en negocios chicos. Mostrás que lo que ofrecés ya funciona.",
  },
  {
    numero: "04",
    porcentaje: "20%",
    etiqueta: "Venta",
    titulo: "Oferta directa",
    texto: "Mostrás producto, servicio, precio, beneficio. Sin culpa. Si no vendés explícitamente, nadie compra. La gente necesita que le digas qué hacer.",
  },
];

const REGLA_FILAS = [
  { pilar: "Educativo", frecuencia: "4 piezas", formato: "Reel o carrusel", objetivo: "Alcance + Guardado" },
  { pilar: "Inspiracional", frecuencia: "3 piezas", formato: "Reel POV o foto + caption largo", objetivo: "Conexión + Comentario" },
  { pilar: "Prueba social", frecuencia: "2 piezas", formato: "Reel testimonial o screenshot", objetivo: "Confianza + Compartido" },
  { pilar: "Venta", frecuencia: "1 pieza fuerte", formato: "Reel demostrativo o carrusel oferta", objetivo: "Click + Mensaje" },
  { pilar: "Interactivo", frecuencia: "3–5 stories diarias", formato: "Stickers de pregunta y encuesta", objetivo: "Conversación + Vista de perfil" },
];

const RITMO = [
  { valor: "3–5", label: "Reels", sub: "por semana" },
  { valor: "2–3", label: "Carruseles", sub: "o posts feed" },
  { valor: "3–5", label: "Stories", sub: "por día" },
];

export default function PilaresContenidoTab() {
  return (
    <div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">
        Los 5 pilares que sostienen un calendario de contenido que funciona. Usalos como guía para no quedarte solo vendiendo, ni solo educando.
      </p>

      {/* 4 pilares principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {PILARES.map((p) => (
          <div key={p.numero} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
            <div className="flex items-start justify-between mb-2">
              <span style={{ color: "#d8d2c3" }} className="text-2xl font-bold leading-none">{p.numero}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full"
                style={{ background: "#eef7f6", color: "#127a79" }}>
                {p.porcentaje} · {p.etiqueta}
              </span>
            </div>
            <div style={{ color: BRAND.navy }} className="text-base font-semibold mb-1.5">{p.titulo}</div>
            <p style={{ color: "#6b6759" }} className="text-xs leading-relaxed">{p.texto}</p>
          </div>
        ))}
      </div>

      {/* 5to pilar, transversal */}
      <div className="rounded-xl p-4 mb-6" style={{ background: BRAND.navy }}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
          <span style={{ color: "#8b8b9a" }} className="text-[10px] font-semibold uppercase tracking-wide">Pilar 5 · Transversal</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: BRAND.teal, color: BRAND.navy }}>
            10% · Interactivo
          </span>
        </div>
        <p style={{ color: "#c7c7d6" }} className="text-xs leading-relaxed">
          Stickers de pregunta, encuestas, quizes, sorteos, "esto o lo otro". No es un día separado: lo agregás a stories durante
          toda la semana. Le dice al algoritmo que tu cuenta genera conversación — eso lo empuja en el alcance orgánico. Es el
          pilar que más se descuida y más rápido mueve la aguja.
        </p>
      </div>

      {/* La regla del 4-3-2-1 */}
      <div className="rounded-xl p-5 mb-6" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <span style={{ color: "#a89f88" }} className="text-[10px] font-semibold uppercase tracking-widest">Cómo se distribuye en la semana</span>
        <h3 style={{ color: BRAND.navy }} className="text-xl font-bold mt-1 mb-2">
          La regla del <span style={{ color: "#127a79" }}>4-3-2-1</span>.
        </h3>
        <p style={{ color: "#6b6759" }} className="text-sm mb-4">
          En una semana ideal de 10 piezas (combinando posts, reels y carruseles), así se reparte la atención. Es la fórmula
          que aplicamos en este calendario.
        </p>

        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-left text-xs min-w-[520px]">
            <thead>
              <tr style={{ borderBottom: "1px solid #e4dfd3" }}>
                <th className="px-1 pb-2" style={{ color: "#8a8578" }}>Pilar</th>
                <th className="px-1 pb-2" style={{ color: "#8a8578" }}>Frecuencia semanal</th>
                <th className="px-1 pb-2" style={{ color: "#8a8578" }}>Mejor formato 2026</th>
                <th className="px-1 pb-2" style={{ color: "#8a8578" }}>Objetivo</th>
              </tr>
            </thead>
            <tbody>
              {REGLA_FILAS.map((f) => (
                <tr key={f.pilar} style={{ borderBottom: "1px solid #f0ece2" }}>
                  <td className="px-1 py-2.5 font-semibold" style={{ color: BRAND.navy }}>{f.pilar}</td>
                  <td className="px-1 py-2.5" style={{ color: "#4a4740" }}>{f.frecuencia}</td>
                  <td className="px-1 py-2.5" style={{ color: "#4a4740" }}>{f.formato}</td>
                  <td className="px-1 py-2.5" style={{ color: "#4a4740" }}>{f.objetivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ritmo de publicación */}
      <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <span style={{ color: BRAND.navy }} className="text-sm font-semibold block mb-4">El ritmo de publicación que recomendamos</span>
        <div className="grid grid-cols-3 gap-3">
          {RITMO.map((r) => (
            <div key={r.label} className="text-center">
              <div style={{ color: "#127a79" }} className="text-3xl font-bold">{r.valor}</div>
              <div style={{ color: BRAND.navy }} className="text-[11px] font-semibold uppercase tracking-wide mt-1">{r.label}</div>
              <div style={{ color: "#a89f88" }} className="text-[10px] uppercase tracking-wide">{r.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
