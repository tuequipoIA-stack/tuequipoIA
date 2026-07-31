// Base de conocimiento del "Sistema de Cold Email" (ver documento
// sistema-cold-email-ia-interna.md). Perfiles de marca + matriz
// marca × industria × puesto -> dolor, para inferir automáticamente qué
// dolor mencionar en un mail de prospección según quién escribe y a
// quién le escribe. Se usa tanto en el servidor (para armar el prompt
// de la IA) como en el cliente (para mostrar un preview antes de
// generar). Solo cubre las marcas que hoy tienen contactos en este
// panel: LiftyFive y Tu Equipo IA.

export const PERFILES_MARCA = {
  "LiftyFive": {
    que_vende: "Gestión de campañas 360 en retail media / ecommerce con agentes de IA (desde USD 1.500)",
    a_quien: "Directores/as de Marketing de marcas de consumo masivo (CPG) y CEOs de agencias sin equipo de retail media",
    tono: "estratégico, ejecutivo, demuestra expertise — nunca explica lo básico",
    cta_tipico: "10 minutos para mostrar cómo lo mide una marca o agencia similar",
  },
  "Tu Equipo IA": {
    que_vende: "Suscripción a plataforma de gestión para emprendedores (Organización, Estrategia, Marketing, Ventas, Clientes, Finanzas)",
    a_quien: "CEOs/fundadores de empresas early-stage sin sistemas ni procesos ordenados",
    tono: "cercano, directo, rioplatense, sin golpe de venta agresivo",
    cta_tipico: "implementación de CRM gratis a cambio de dejarlo documentar como caso de estudio",
  },
};

// Cada fila: a qué industria/puesto aplica (por palabras clave, no exactas
// porque los datos importados de Apollo vienen en texto libre) y el dolor
// que esa marca puntual puede resolver. Cuando ninguna fila matchea, se
// usa el dolor "fallback" de la marca y se lo marca como inferido por
// analogía (igual que indica el documento fuente).
const MATRIZ_DOLOR = {
  "LiftyFive": [
    {
      industria: ["cpg", "consumo masivo", "food", "beverage", "bebida", "aliment", "fmcg", "dairy", "lácte", "apparel", "fashion", "moda"],
      puesto: ["director de marketing", "directora de marketing", "marketing manager", "gerente de marketing", "gerenta de marketing", "head of marketing", "jefe de marketing", "jefa de marketing", "cmo"],
      dolor: "Tiene presupuesto de medios pero no sabe operar ni medir el canal retail / ecommerce.",
    },
    {
      industria: [],
      puesto: ["trade marketing"],
      dolor: "No sabe qué retailer rinde mejor ni cómo justificar el gasto en punto de venta digital.",
    },
    {
      industria: ["agencia", "agency", "publicidad", "advertising"],
      puesto: ["ceo", "ceo &", "director general", "directora general", "gerente general", "founder", "fundador", "fundadora"],
      dolor: "Su cliente CPG le pide retail media y no lo puede ofrecer sin subcontratar.",
    },
    {
      industria: ["retail", "cadena", "supermercado", "department store", "tienda"],
      puesto: ["director comercial", "directora comercial", "gerente comercial", "gerenta comercial"],
      dolor: "No sabe qué punto de venta rinde mejor ni por qué.",
    },
  ],
  "Tu Equipo IA": [
    {
      industria: [],
      puesto: ["founder", "fundador", "fundadora", "ceo", "dueño", "dueña"],
      dolor: "Crecimiento sin estructura: ventas, finanzas y operación sin proceso definido, todo depende de una sola cabeza.",
    },
    {
      industria: ["servicios profesionales", "consultora", "consultoría", "estudio", "legal", "contable"],
      puesto: ["socio", "socia", "partner"],
      dolor: "Todo el conocimiento comercial está en su cabeza, no hay CRM ni seguimiento estructurado de leads.",
    },
    {
      industria: ["comercio", "retail", "emprendimiento"],
      puesto: ["dueño", "dueña", "gerente"],
      dolor: "No tiene tablero de control del negocio, decide a ciego mes a mes.",
    },
  ],
};

const FALLBACK_DOLOR = {
  "LiftyFive": "No tiene forma clara de operar ni medir sus campañas de retail media / ecommerce.",
  "Tu Equipo IA": "Opera sin procesos ni tablero de control, dependiendo de una sola persona para sostener el negocio.",
};

function normalizar(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Devuelve { dolor, inferido } — inferido:false si matcheó una fila exacta
// de la matriz, inferido:true si se usó el dolor genérico de la marca por
// no encontrar coincidencia (el manual pide revisarlo antes de enviar).
export function inferirDolor(marca, industria, puesto) {
  const filas = MATRIZ_DOLOR[marca] || [];
  const ind = normalizar(industria);
  const pue = normalizar(puesto);
  for (const fila of filas) {
    const industriaOk = fila.industria.length === 0 || fila.industria.some((k) => ind.includes(k));
    const puestoOk = fila.puesto.length === 0 || fila.puesto.some((k) => pue.includes(k));
    if (industriaOk && puestoOk && (fila.industria.length || fila.puesto.length)) {
      return { dolor: fila.dolor, inferido: false };
    }
  }
  return { dolor: FALLBACK_DOLOR[marca] || "No se pudo inferir un dolor específico — revisar manualmente.", inferido: true };
}
