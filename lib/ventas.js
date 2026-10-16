import { relISO, mesKey } from "@/lib/fechas";

// Hitos típicos según cómo trabaja cada empresa (modelo de ganancia).
// Las fechas arrancan relativas a hoy y se ajustan después en Ventas → Operativa.
export function hitosPorModelo(modelo) {
  const H = (n, dias) => ({ n, f: relISO(dias), estado: "pendiente" });
  if (modelo === "propio") {
    return [H("Mockup aprobado", 3), H("Primer entregable", 10), H("Pruebas y ajustes", 14), H("Entrega del sistema", 17), H("Fin acompañamiento", 31)];
  }
  if (modelo === "agencia") {
    return [H("Recepción de piezas", 5), H("Salida al aire", 10), H("Reporte mensual", 40), H("Fin de campaña", 60)];
  }
  if (modelo === "cuotas") {
    return [H("Kickoff", 7), H("Relevamiento", 21), H("Implementación", 60), H("Capacitación", 80), H("Go-live / entrega", 95)];
  }
  return [H("Inicio", 7), H("Entrega", 30)];
}

// Proyecto de Ventas a partir de una oportunidad ganada en el CRM.
// Conserva el mismo número (num) para que el audio y los reportes coincidan.
export function proyectoDesdeOportunidad(op, empresa) {
  const modelo = empresa?.modelo || "ninguno";
  const base = {
    num: op.num,
    empresa: op.empresa || null,
    cliente: op.cliente,
    desc: op.rubro || "",
    moneda: op.moneda || (modelo === "agencia" ? "USD" : "ARS"),
    creadoEn: relISO(0),
    hitos: hitosPorModelo(modelo),
    horas: [],
  };
  const valor = Number(op.valor) || 0;
  if (modelo === "cuotas") return { ...base, venta: valor, cuotas: 6, inicio: mesKey(1), cobradas: [] };
  if (modelo === "agencia") return { ...base, ejecucion: [{ mes: mesKey(0), monto: valor }], pagadas: [], agencia: null };
  if (modelo === "propio") return { ...base, precio: valor, cobros: [{ mes: mesKey(0), monto: valor, ok: false }], otros: [] };
  return base;
}

// Agrega el proyecto a "ventas-proyectos" si todavía no existe uno con ese número.
export async function asegurarProyectoVenta({ loadData, saveData }, op, empresa) {
  const lista = await loadData("ventas-proyectos", []);
  if (lista.some((p) => p.num === op.num)) return false;
  await saveData("ventas-proyectos", [...lista, proyectoDesdeOportunidad(op, empresa)]);
  return true;
}
