// Descarga una tabla como archivo .csv que Excel abre directo (separador ";"
// y BOM para que respete tildes y ñ).
export function descargarCsv(nombreArchivo, filas) {
  const csv =
    "﻿" +
    filas
      .map((f) => f.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
