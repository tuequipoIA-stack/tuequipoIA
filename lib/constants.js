import {
  TrendingUp, Target, Package, Compass, Users, BookOpen, ShoppingCart,
  Wallet, ListChecks, Megaphone, LayoutDashboard, UserCircle,
} from "lucide-react";

export const BRAND = { teal: "#1AABAA", navy: "#1A1A2E", cream: "#F4F1EC" };

export const AGENTS = [
  {
    id: "marketing", name: "Vera", rol: "Marketing",
    tagline: "Te hace visible ante quien tiene que verte",
    icon: TrendingUp, color: "#1AABAA",
    system: `Sos Vera, la agente de Marketing de "Tu Equipo IA". Ayudás a emprendedores en etapa temprana que no usan IA como deberían.
Tu foco: posicionamiento, contenido, redes sociales, generación de demanda y visibilidad de marca.
Tono: directo, entusiasta, argentino (rioplatense), cercano pero profesional. Nada de relleno corporativo.
Siempre das accionables concretos, no teoría genérica. Usá los datos reales del negocio que te paso como contexto para que tu consejo no sea genérico.
Cerrá tus respuestas con un próximo paso claro y pequeño que puedan hacer hoy.`,
  },
  {
    id: "ventas", name: "Bruno", rol: "Ventas",
    tagline: "Convierte conversaciones en cierres",
    icon: Target, color: "#1A1A2E",
    system: `Sos Bruno, el agente de Ventas de "Tu Equipo IA". Ayudás a emprendedores en etapa temprana que no usan IA como deberían.
Tu foco: proceso comercial, manejo de objeciones, seguimiento, negociación y cierre.
Tono: directo, práctico, argentino (rioplatense), con la energía de un vendedor experimentado que va al grano.
Siempre das scripts o pasos concretos. Usá los datos reales de ventas que te paso como contexto para hablar con números reales, no en abstracto.
Cerrá tus respuestas con una acción concreta para la próxima conversación de venta.`,
  },
  {
    id: "oferta", name: "Nico", rol: "Oferta",
    tagline: "Diseña lo que la gente no puede rechazar",
    icon: Package, color: "#127a79",
    system: `Sos Nico, el agente de Oferta de "Tu Equipo IA". Ayudás a emprendedores en etapa temprana que no usan IA como deberían.
Tu foco: diseño de producto/servicio, pricing, propuesta de valor, empaquetado de oferta y diferenciación.
Tono: analítico pero cercano, argentino (rioplatense), sin vueltas.
Usá los datos reales de ventas y finanzas que te paso como contexto para opinar sobre precio y oferta con números, no en teoría.
Cerrá tus respuestas con una mejora concreta y aplicable a la oferta actual.`,
  },
  {
    id: "estrategia", name: "Elena", rol: "Estrategia",
    tagline: "Ve el tablero completo",
    icon: Compass, color: "#0d1420",
    system: `Sos Elena, la agente de Estrategia de "Tu Equipo IA". Ayudás a emprendedores en etapa temprana que no usan IA como deberían.
Tu foco: prioridades, foco, modelo de negocio, decisiones de crecimiento y visión de mediano plazo.
Tono: calmo, claro, argentino (rioplatense), con autoridad pero sin ser condescendiente.
Usá la visión, los objetivos y las tareas reales que te paso como contexto para que tu consejo esté alineado con lo que el emprendedor ya definió, no lo ignores.
Cerrá tus respuestas señalando cuál es LA prioridad de esta semana.`,
  },
];

export const RECURSO_CATEGORIAS = [
  { id: "marketing", label: "Marketing", color: "#1AABAA" },
  { id: "ventas", label: "Ventas", color: "#1A1A2E" },
  { id: "oferta", label: "Oferta", color: "#127a79" },
  { id: "estrategia", label: "Estrategia", color: "#0d1420" },
];

export const GASTO_CATEGORIAS = ["Insumos", "Marketing", "Operativo", "Sueldos", "Otro"];

// "Equipo" (chat con los agentes de IA) está oculto momentáneamente hasta
// definir límites de uso por costo (ver lib/constants.js EQUIPO_HABILITADO).
// Para reactivarlo: poner EQUIPO_HABILITADO en true.
export const EQUIPO_HABILITADO = false;

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tablero", label: "Organización", icon: ListChecks },
  { id: "estrategia", label: "Estrategia", icon: Compass },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "ventas", label: "Ventas", icon: ShoppingCart },
  { id: "finanzas", label: "Finanzas", icon: Wallet },
  ...(EQUIPO_HABILITADO ? [{ id: "equipo", label: "Equipo", icon: Users }] : []),
  { id: "recursos", label: "Recursos", icon: BookOpen },
  { id: "perfil", label: "Perfil", icon: UserCircle },
];

export const ETAPAS = ["Recién arrancando", "Ya tengo ventas", "Estoy creciendo", "Consolidado"];
export const TIEMPOS = ["Menos de 6 meses", "6 meses a 1 año", "1 a 3 años", "Más de 3 años"];
export const FACTURACIONES = ["Todavía no facturo", "Menos de $500.000", "$500.000 – $2.000.000", "$2.000.000 – $5.000.000", "Más de $5.000.000"];
export const CANALES = ["Instagram", "WhatsApp", "Local físico", "Página web", "Marketplace", "Otro"];
export const DESAFIOS = [
  { id: "marketing", label: "Visibilidad y marketing" },
  { id: "ventas", label: "Cerrar ventas" },
  { id: "oferta", label: "Definir precio / oferta" },
  { id: "estrategia", label: "Organización y foco" },
];

export const TIPOS_PUBLICACION = ["Post Instagram", "Historia Instagram", "Reel", "Post LinkedIn", "Video TikTok", "Newsletter", "Otro"];

export const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export const TIPO_COLORES = {
  "Post Instagram": { bg: "#E1306C", text: "#ffffff" },
  "Historia Instagram": { bg: "#E1306C", text: "#ffffff" },
  "Reel": { bg: "#C13584", text: "#ffffff" },
  "Post LinkedIn": { bg: "#0A66C2", text: "#ffffff" },
  "Video TikTok": { bg: "#010101", text: "#ffffff" },
  "Newsletter": { bg: "#F5A623", text: BRAND.navy },
  "Otro": { bg: "#8b8b9a", text: "#ffffff" },
};
export const colorTipo = (tipo) => TIPO_COLORES[tipo] || TIPO_COLORES["Otro"];

export const PLAZOS = ["mensual", "trimestral", "semestral", "anual"];
export const CADENCIAS = [
  { id: "diarias", label: "Diarias" },
  { id: "semanales", label: "Semanales" },
  { id: "mensuales", label: "Mensuales" },
  { id: "trimestrales", label: "Trimestrales" },
  { id: "anuales", label: "Anuales" },
];

export const COLUMNAS_BASE = [
  { id: "semana", nombre: "Tareas de la semana", fija: true },
  { id: "hoy", nombre: "Tareas de hoy", fija: true },
  { id: "hecho", nombre: "Tareas hechas", fija: true },
];
export const MAX_COLUMNAS_EXTRA = 2;
