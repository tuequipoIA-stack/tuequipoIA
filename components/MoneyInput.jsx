"use client";

import { useEffect, useState } from "react";

// Formatea lo que se va tipeando con separador de miles "." y decimales con
// ",", como se escriben los números de plata en Argentina (ej: 1234567,5 ->
// "1.234.567,5"). Solo deja pasar dígitos y una coma.
function formatearMientrasEscribe(raw) {
  let limpio = raw.replace(/[^\d,]/g, "");
  const primeraComa = limpio.indexOf(",");
  if (primeraComa !== -1) {
    limpio = limpio.slice(0, primeraComa + 1) + limpio.slice(primeraComa + 1).replace(/,/g, "");
  }
  const [enteroRaw, decimal] = limpio.split(",");
  const entero = (enteroRaw || "").replace(/^0+(?=\d)/, "");
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (decimal !== undefined) return `${conMiles || "0"},${decimal.slice(0, 2)}`;
  return conMiles;
}

// "1.234,5" -> 1234.5 (número real, para guardar y calcular)
function aNumero(formateado) {
  if (!formateado) return "";
  const normalizado = formateado.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(normalizado);
  return Number.isNaN(n) ? "" : n;
}

// 1234.5 -> "1.234,5" (para mostrar un valor que llega ya calculado)
function aTextoFormateado(valor) {
  if (valor === "" || valor === null || valor === undefined) return "";
  const n = Number(valor);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

// Input de texto para montos de dinero: mientras se escribe, va marcando el
// punto de miles y la coma decimal. Por afuera se comporta como un input
// numérico común: `value` es un número (o "") y `onChange` recibe un número.
export default function MoneyInput({ value, onChange, placeholder, className, style, onKeyDown, id, autoFocus }) {
  const [texto, setTexto] = useState(() => aTextoFormateado(value));

  useEffect(() => {
    const actual = aNumero(texto);
    const vacioIgual = actual === "" && (value === "" || value === null || value === undefined);
    if (!vacioIgual && actual !== value) setTexto(aTextoFormateado(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const manejarCambio = (e) => {
    const formateado = formatearMientrasEscribe(e.target.value);
    setTexto(formateado);
    onChange(aNumero(formateado));
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoFocus={autoFocus}
      value={texto}
      onChange={manejarCambio}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={className}
      style={style}
    />
  );
}
