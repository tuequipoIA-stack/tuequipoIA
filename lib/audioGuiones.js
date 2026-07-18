// Guiones de audio-ayuda: un texto por sección (o por pestaña, cuando la
// sección tiene más de una). Los lee el componente AudioAyuda con la voz
// del navegador (Web Speech API). Se centralizan acá para poder ajustar el
// texto sin tocar cada sección.

export const AUDIO_GUIONES = {
  dashboard:
    "Este es tu Dashboard. Acá ves de un vistazo cómo viene tu negocio: las ventas, los gastos y la ganancia del mes, tus tareas de hoy, tus próximas publicaciones y tus objetivos activos.",

  "tablero:bajados":
    "Esta es la vista de Objetivos bajados a tierra. Acá organizás tus tareas en columnas: de la semana, de hoy, y hechas. Arrastrá las tarjetas entre columnas a medida que avanzás, o usá los botones si estás desde el celular.",
  "tablero:grandes":
    "Esta es la vista de Grandes objetivos. Acá definís tus objetivos grandes, les asignás un mes, y los desglosás en tareas concretas que después vas a ver reflejadas en Objetivos bajados a tierra.",

  "estrategia:guia":
    "Esta es la pestaña Tu guía. Acá tenés resumido todo lo que definiste en Definir oferta de negocio y en Plan de negocio: tu cliente ideal, tu oferta de valor, los dolores que resolvés, y tu hoja de ruta a 3 meses, 6 meses, 1, 3 y 5 años.",
  "estrategia:oferta":
    "Esta es la pestaña Definir oferta de negocio. Acá definís las bases: quién es tu cliente ideal, qué le ofrecés, y qué dolores le resolvés. Sin esto, cualquier estrategia tira para cualquier lado.",
  "estrategia:plan":
    "Esta es la pestaña Plan de negocio. Acá armás tu plan concreto: tu costo, tu margen y tu objetivo de sueldo, para saber cuántas unidades necesitás vender por mes.",

  "marketing:calendario":
    "Esta es la pestaña de Calendario de contenido. Acá planificás qué vas a publicar y cuándo. Tocá cualquier día para agregar o ver tarjetas, y arrastralas para moverlas entre fechas.",
  "marketing:pilares":
    "Esta es la pestaña de Pilares de contenido. Son los cinco pilares que sostienen un calendario que funciona: educativo, inspiracional, prueba social, oferta directa, y un pilar transversal interactivo. Usalos como guía para no quedarte solo vendiendo, ni solo educando.",

  ventas:
    "Esta es la sección de Ventas. Acá cargás cada producto vendido, día por día, y ves el total vendido y el margen real del mes.",

  "finanzas:movimientos":
    "Esta es la pestaña de Movimientos. Acá ves tus ventas, tus gastos y tu ganancia, todo junto. Cargá cada gasto nuevo con su fecha, su categoría, y si es fijo o variable.",
  "finanzas:costos":
    "Esta es la pestaña de Costos. Acá cargás tus costos fijos mensuales, y armás el costo de cada producto según su receta y sus insumos, para saber tu margen real.",

  recursos:
    "Esta es la sección de Recursos. Acá encontrás documentos, links y hacks accionables que se publican semana a semana. Usá los filtros de arriba para ver solo los de una categoría.",

  perfil:
    "Esta es la sección de Perfil. Acá administrás tu cuenta, tu suscripción, el logo y los datos de tu negocio.",

  "admin:usuarios":
    "Esta es la pestaña de Usuarios, dentro de Admin. Acá ves todos los suscriptores, para ayudarlos o entender cómo usan la app.",
  "admin:metricas":
    "Esta es la pestaña de Métricas. Acá ves cuántos suscriptores tenés, cuántos están activos, en prueba, o con el pago vencido, y tus ingresos estimados y reales.",
  "admin:sugerencias":
    "Esta es la pestaña de Sugerencias. Acá ves los pedidos que te escriben los usuarios desde el botón de Ayuda.",
};
