"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/constants";

// Desplegable con búsqueda: escribís y filtra en vivo por getLabel(item).
// Pensado para reemplazar <select> comunes cuando la lista puede crecer
// (productos, clientes, etc.). Soporta un ítem fijo de "crear nuevo" al
// final de la lista (createLabel + onCreateNew) y un ítem de "limpiar"
// al principio (clearLabel), útil para filtros tipo "Todos".
export default function SearchableSelect({
  options,
  getId,
  getLabel,
  getSub,
  value,
  placeholder,
  onSelect,
  createLabel,
  onCreateNew,
  clearLabel,
}) {
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const seleccionado = options.find((o) => getId(o) === value);
    setQuery(seleccionado ? getLabel(seleccionado) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options.length]);

  useEffect(() => {
    const cerrarSiClickAfuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrarSiClickAfuera);
    return () => document.removeEventListener("mousedown", cerrarSiClickAfuera);
  }, []);

  const filtrados = options.filter((o) => getLabel(o).toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} className="relative flex-1 min-w-[160px]">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setAbierto(true); }}
        onFocus={() => setAbierto(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="rounded-lg px-3 py-2 text-sm outline-none w-full"
        style={{ border: "1px solid #e4dfd3" }}
      />
      {abierto && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-lg overflow-y-auto z-30"
          style={{ background: "#ffffff", border: "1px solid #e4dfd3", maxHeight: 220, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
        >
          {clearLabel && (
            <div
              onClick={() => { onSelect(null); setQuery(""); setAbierto(false); }}
              className="px-3 py-2 text-sm cursor-pointer"
              style={{ color: "#6b6759", borderBottom: "1px solid #f0ece2" }}
            >
              {clearLabel}
            </div>
          )}
          {filtrados.map((o) => (
            <div
              key={getId(o)}
              onClick={() => { onSelect(o); setQuery(getLabel(o)); setAbierto(false); }}
              className="px-3 py-2 text-sm cursor-pointer"
            >
              <div style={{ color: BRAND.navy }}>{getLabel(o)}</div>
              {getSub && getSub(o) ? <div style={{ color: "#8a8578" }} className="text-[11px]">{getSub(o)}</div> : null}
            </div>
          ))}
          {filtrados.length === 0 && (
            <div className="px-3 py-2 text-xs" style={{ color: "#8a8578" }}>Sin resultados para &quot;{query}&quot;</div>
          )}
          {createLabel && (
            <div
              onClick={() => { onCreateNew(); setAbierto(false); }}
              className="px-3 py-2 text-sm font-semibold cursor-pointer"
              style={{ color: "#127a79", borderTop: "1px solid #f0ece2" }}
            >
              {createLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
