// Casos de uso que se muestran en la landing (sección "Casos de uso") y que
// tienen su propia ruta en /casos/[slug].
//
// Para agregar un caso nuevo hacen falta tres cosas:
//   1. una entrada en este array,
//   2. la miniatura en /public/casos/<slug>.svg (o .png/.jpg),
//   3. la demo en /public/casos/<slug>.html — un HTML autocontenido, con su
//      propio CSS y JS adentro. Se reemplaza pisando el archivo, no hay que
//      tocar código.
//
// Mientras la demo no exista, dejar `disponible: false`: la tarjeta se muestra
// igual pero apagada, sin link, con la leyenda "Demo en preparación".

export const CASOS_DE_USO = [
  {
    slug: "costeo-alimentos",
    rubro: "Fábricas de alimentos",
    titulo: "Software de costeo y trazabilidad",
    texto:
      "Calcula el costo real de cada lote con la merma medida, no estimada, y deja cada producto atado a la compra que lo originó.",
    meta: "Fábrica de mermeladas, seis personas",
    miniatura: "/casos/costeo-alimentos.svg",
    disponible: true,
  },
  {
    slug: "seguimiento-clientes",
    rubro: "Servicios y comercios",
    titulo: "Seguimiento de clientes",
    texto:
      "Quién te compró, a quién hay que volver a llamar esta semana y cuánto se cerró en el mes, sin depender de la memoria.",
    meta: "Estudio contable, cuatro personas",
    miniatura: "/casos/seguimiento-clientes.svg",
    disponible: false,
  },
  {
    slug: "turnos",
    rubro: "Consultorios y estudios",
    titulo: "Registro de turnos",
    texto:
      "La agenda del día, el recordatorio que sale solo y el historial de cada persona en un lugar que no es un cuaderno.",
    meta: "Consultorio con dos profesionales",
    miniatura: "/casos/turnos.svg",
    disponible: false,
  },
  {
    slug: "mensajeria",
    rubro: "Logística y reparto",
    titulo: "Control de servicios de mensajería",
    texto:
      "Cada envío con su chofer, su estado y lo que se le factura al cliente cuando cierra el mes.",
    meta: "Mensajería con seis repartidores",
    miniatura: "/casos/mensajeria.svg",
    disponible: false,
  },
];

// Ruta de la página que enmarca la demo dentro del sitio.
export function urlCaso(caso) {
  return `/casos/${caso.slug}`;
}

// Ruta del HTML estático que se muestra adentro de esa página.
export function urlDemo(caso) {
  return `/casos/${caso.slug}.html`;
}

export function getCaso(slug) {
  return CASOS_DE_USO.find((c) => c.slug === slug) || null;
}

export function casosDisponibles() {
  return CASOS_DE_USO.filter((c) => c.disponible);
}
