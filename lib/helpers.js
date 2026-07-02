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
