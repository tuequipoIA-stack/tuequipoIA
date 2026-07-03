export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isThisMonth(fechaStr) {
  const d = new Date(fechaStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function money(n) {
  return `$${Number(n || 0).toLocaleString("es-AR")}`;
}

export function fechaISO(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getGrillaMes(year, month) {
  const primerDia = new Date(year, month, 1);
  const inicioSemana = (primerDia.getDay() + 6) % 7; // lunes = 0
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const celdas = [];
  for (let i = 0; i < inicioSemana; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

// migración: mapea nombres viejos de columna a los nuevos
export function migrarColumna(id) {
  if (id === "porhacer") return "semana";
  if (id === "haciendo") return "hoy";
  return id || "semana";
}

// Estado de suscripción "detallado" para el panel de admin: distingue prueba
// vigente de prueba vencida (el subscription_status en la base se queda en
// "trial" hasta que haya un pago o un cambio manual — lo que de verdad
// corta el acceso es la fecha trial_ends_at), y si una activación es vía
// MercadoPago o manual (efectivo/transferencia cargada a mano por el admin).
export function estadoSuscripcion({ subscriptionStatus, trialEndsAt, mercadopagoSubscriptionId }) {
  if (subscriptionStatus === "active") {
    return mercadopagoSubscriptionId
      ? { label: "Activa · MercadoPago", bg: "#eef7f6", text: "#127a79" }
      : { label: "Activa · Manual", bg: "#eef7f6", text: "#127a79" };
  }
  if (subscriptionStatus === "past_due") {
    return { label: "Cortada por falta de pago", bg: "#fdf0e6", text: "#b3703f" };
  }
  if (subscriptionStatus === "canceled") {
    return { label: "Cancelada", bg: "#fbeceb", text: "#b3453f" };
  }
  const trialVencida = trialEndsAt && new Date(trialEndsAt) < new Date();
  if (trialVencida) {
    return { label: "Prueba vencida", bg: "#fdf0e6", text: "#b3703f" };
  }
  return { label: "En prueba", bg: "#f0ece2", text: "#6b6759" };
}

// Texto legible de hace cuánto está suscripto alguien, a partir de la fecha
// en la que pasó a "active" por primera vez. Usado en el panel de admin.
export function tiempoSuscripto(fechaInicioISO) {
  if (!fechaInicioISO) return null;
  const inicio = new Date(fechaInicioISO);
  const ahora = new Date();
  const dias = Math.floor((ahora - inicio) / 86400000);
  if (dias < 1) return "hoy";
  if (dias < 30) return `${dias} ${dias === 1 ? "día" : "días"}`;
  let meses = (ahora.getFullYear() - inicio.getFullYear()) * 12 + (ahora.getMonth() - inicio.getMonth());
  if (ahora.getDate() < inicio.getDate()) meses -= 1;
  meses = Math.max(1, meses);
  if (meses < 12) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  return mesesRestantes === 0
    ? `${anios} ${anios === 1 ? "año" : "años"}`
    : `${anios} ${anios === 1 ? "año" : "años"} y ${mesesRestantes} ${mesesRestantes === 1 ? "mes" : "meses"}`;
}

// Número de semana ISO (1-53), para rotar contenido "de la semana" sin guardar nada.
export function numeroSemanaISO(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const diff = date - firstThursday;
  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}

// Cascada de números del "Plan de negocio" (día/semana/mes/trimestre/semestre/año),
// centralizada acá para que Plan de negocio y Tu guía muestren siempre lo mismo.
export function calcularPlanNumeros(form) {
  const costo = Number(form?.costoUnitario) || 0;
  const margen = Number(form?.margenDeseado) || 0;
  const sueldoObjetivo = Number(form?.sueldoObjetivo) || 0;
  const diasHabiles = Number(form?.diasHabiles) || 24;

  const precioVenta = margen < 100 && costo > 0 ? costo / (1 - margen / 100) : 0;
  const gananciaUnidad = precioVenta - costo;
  const unidadesPorMes = gananciaUnidad > 0 ? Math.ceil(sueldoObjetivo / gananciaUnidad) : 0;
  const unidadesPorDia = diasHabiles > 0 ? Math.ceil(unidadesPorMes / diasHabiles) : 0;
  const unidadesPorSemana = Math.ceil(unidadesPorMes / 4.33);
  const unidadesPorTrimestre = unidadesPorMes * 3;
  const unidadesPorSemestre = unidadesPorMes * 6;
  const unidadesPorAnio = unidadesPorMes * 12;
  const facturacionMensual = unidadesPorMes * precioVenta;
  const puedeCalcular = costo > 0 && margen > 0 && margen < 100 && sueldoObjetivo > 0;

  return {
    costo, margen, sueldoObjetivo, diasHabiles, precioVenta, gananciaUnidad,
    unidadesPorDia, unidadesPorSemana, unidadesPorMes, unidadesPorTrimestre, unidadesPorSemestre, unidadesPorAnio,
    facturacionMensual, puedeCalcular,
  };
}
