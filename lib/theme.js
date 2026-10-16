// Paleta "crema" de la app (fondo, tarjetas, bordes y textos secundarios).
// Usar estos valores en vez de blancos puros, así toda la app mantiene
// el mismo tono cálido que se eligió en los mockups.
export const C = {
  bg: "#e8e2d5",      // fondo general
  card: "#f6f2ea",    // tarjetas
  panel: "#efe9dd",   // barras, cabeceras de tabla, formularios
  line: "#d9d1bf",    // bordes
  chip: "#e2dbcc",    // chips / botones secundarios
  ink: "#1A1A2E",     // texto principal
  muted: "#6b6759",   // texto secundario
  soft: "#958b74",    // texto terciario / hints
  danger: "#c25a54",
  warn: "#b7791f",
  ok: "#2f7a45",
  tealDark: "#127a79",
};

// Colores de columnas del tablero (Organización), tono crema.
export const COL = {
  semana: { bg: "#f1e1c8", border: "#e5cfa9", header: "#a8732f" },
  hoy: { bg: "#d9e5f1", border: "#c3d5ea", header: "#335f8f" },
  hecho: { bg: "#d9eadc", border: "#c2dcc7", header: "#357a49" },
  extra: { bg: "#ece6da", border: "#d9d1bf", header: "#6b6759" },
};

// Agrega transparencia a un color hex (#rrggbb) — ej: tint("#d9485f", 0.15)
export function tint(hex, a) {
  return hex + Math.round(a * 255).toString(16).padStart(2, "0");
}
