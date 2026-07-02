import { loadData } from "./storage";
import { isThisMonth, money } from "./helpers";

export async function buildBusinessContext(business) {
  const [ventas, gastos, estrategia, tareas, recursos, costos, planNegocio, clienteIdeal, propuestaValor, calendario] = await Promise.all([
    loadData("ventas-registro", []),
    loadData("gastos-registro", []),
    loadData("estrategia-data", { vision: "", objetivos: [] }),
    loadData("tablero-tareas", []),
    loadData("recursos-biblioteca", []),
    loadData("finanzas-costos", { productos: [], fijos: [] }),
    loadData("plan-negocio", null),
    loadData("marketing-cliente", null),
    loadData("marketing-valor", null),
    loadData("marketing-calendario", []),
  ]);

  const ventasMes = ventas.filter((v) => isThisMonth(v.fecha)).reduce((s, v) => s + Number(v.precio || 0) * Number(v.cantidad || 1), 0);
  const gastosMes = gastos.filter((g) => isThisMonth(g.fecha)).reduce((s, g) => s + Number(g.monto || 0), 0);
  const gananciaMes = ventasMes - gastosMes;
  const ultimasVentas = ventas.slice(0, 5).map((v) => `${v.fecha}: ${v.producto} x${v.cantidad || 1} - ${money(v.precio)} c/u`).join(" | ") || "sin registros";
  const objetivosActivos = (estrategia.objetivos || []).filter((o) => !o.completado).slice(0, 5).map((o) => `[${o.plazo}] ${o.texto}`).join(" | ") || "sin objetivos cargados";
  const tareasPendientes = tareas.filter((t) => t.columna !== "hecho").slice(0, 5).map((t) => t.texto).join(" | ") || "sin tareas cargadas";
  const recursosRecientes = recursos.slice(0, 5).map((r) => `[${r.categoria}] ${r.titulo}`).join(" | ") || "sin recursos publicados";
  const totalCostosFijos = (costos.fijos || []).reduce((s, f) => s + Number(f.monto || 0), 0);
  const costosFijosDetalle = (costos.fijos || []).map((f) => `${f.concepto}: ${money(f.monto)}`).join(" | ") || "sin costos fijos cargados";
  const costosProductoDetalle = (costos.productos || []).slice(0, 10).map((p) => `${p.nombre}: costo ${money(p.costo)}, stock ${p.cantidad ?? 1} unidades`).join(" | ") || "sin costos de producto cargados";
  const planForm = planNegocio?.form;
  const planResumen = planForm && planForm.costoUnitario && planForm.margenDeseado
    ? `Producto principal: ${planForm.productoPrincipal || "no especificado"}, costo unitario ${money(planForm.costoUnitario)}, margen deseado ${planForm.margenDeseado}%, sueldo mensual objetivo ${money(planForm.sueldoObjetivo)}`
    : "sin plan de negocio numérico cargado todavía";
  const tareasDiariasPlan = planNegocio?.plan?.diarias?.filter((t) => !t.hecha).map((t) => t.texto).join(" | ") || "sin tareas diarias generadas";
  const clienteIdealResumen = clienteIdeal?.nombre
    ? `${clienteIdeal.nombre} — ${clienteIdeal.descripcion || "sin descripción"}. Dolores/necesidades: ${clienteIdeal.dolores || "no especificados"}`
    : "sin cliente ideal definido todavía";
  const propuestaValorResumen = propuestaValor?.propuesta
    ? `${propuestaValor.propuesta}${propuestaValor.diferenciadores?.length ? " | Diferenciadores: " + propuestaValor.diferenciadores.join(", ") : ""}`
    : "sin propuesta de valor definida todavía";
  const hoy = new Date().toISOString().slice(0, 10);
  const proximasPublicaciones = (calendario || [])
    .filter((p) => p.fecha >= hoy)
    .sort((a, b) => (a.fecha > b.fecha ? 1 : -1))
    .slice(0, 5)
    .map((p) => `${p.fecha}: ${p.tipo}`)
    .join(" | ") || "sin publicaciones planificadas";

  return `DATOS REALES DEL NEGOCIO (usalos para que tu consejo sea específico, no genérico):
- Negocio: ${business?.nombre || "sin nombre"} (${business?.rubro || "rubro no especificado"})
- Etapa: ${business?.etapa || "no especificada"} | Tiempo funcionando: ${business?.tiempoFuncionando || "no especificado"}
- Facturación mensual aproximada: ${business?.facturacionMensual || "no especificada"} | Canal de venta principal: ${business?.canalVenta || "no especificado"}
- Principales desafíos declarados: ${(business?.desafios || []).join(", ") || "no especificados"}
- Objetivo a 3 meses: ${business?.objetivo3Meses || "no especificado"}
- Ventas del mes: ${money(ventasMes)} | Gastos del mes: ${money(gastosMes)} | Ganancia del mes: ${money(gananciaMes)}
- Últimas ventas registradas: ${ultimasVentas}
- Costos fijos mensuales (total ${money(totalCostosFijos)}): ${costosFijosDetalle}
- Costo por producto/variante: ${costosProductoDetalle}
- Plan de negocio numérico: ${planResumen}
- Tareas diarias del plan de negocio (pendientes): ${tareasDiariasPlan}
- Cliente ideal: ${clienteIdealResumen}
- Propuesta de valor: ${propuestaValorResumen}
- Próximas publicaciones planificadas: ${proximasPublicaciones}
- Visión del negocio: ${estrategia.vision || "no cargada todavía"}
- Objetivos activos: ${objetivosActivos}
- Tareas pendientes de esta semana: ${tareasPendientes}
- Recursos publicados recientemente en la app (podés recomendarlos si aplican): ${recursosRecientes}`;
}

export function planSystemPrompt(business, numeros) {
  return `Sos el equipo de Estrategia de "Tu Equipo IA". Tu trabajo es bajar la visión de un emprendedor a un plan de acción concreto, con tareas por frecuencia.
Negocio: ${business?.nombre || "sin nombre"} (${business?.rubro || "no especificado"}), etapa: ${business?.etapa || "no especificada"}.
Visión declarada: "${numeros.vision || "no especificada"}"
Producto/servicio principal para lograrlo: "${numeros.productoPrincipal || "no especificado"}"
Números ya calculados (no los repitas, usalos como base): precio de venta sugerido ${money(numeros.precioVenta)}, ganancia por unidad ${money(numeros.gananciaUnidad)}, necesita vender ${numeros.unidadesPorDia} unidades por día (${numeros.unidadesPorMes} por mes) para alcanzar un sueldo de ${money(numeros.sueldoObjetivo)}/mes.

Generá un plan de acción concreto en 5 frecuencias: diarias, semanales, mensuales, trimestrales, anuales.
Cada tarea debe ser específica y accionable (nunca genérica tipo "hacer marketing"), coherente con el producto y los números de arriba.
- Diarias: 3 a 4 tareas operativas del día a día (producción, venta, registro)
- Semanales: 3 tareas de revisión y ajuste
- Mensuales: 2 a 3 tareas de análisis y crecimiento
- Trimestrales: 2 tareas de evaluación más profunda
- Anuales: 1 a 2 tareas de revisión de visión y expansión
Tono: argentino (rioplatense), directo, sin relleno.

Respondé ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin markdown, con esta forma exacta:
{
  "diarias": ["tarea 1", "tarea 2", "..."],
  "semanales": ["tarea 1", "..."],
  "mensuales": ["tarea 1", "..."],
  "trimestrales": ["tarea 1", "..."],
  "anuales": ["tarea 1", "..."]
}`;
}
