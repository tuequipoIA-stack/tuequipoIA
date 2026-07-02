"use client";

import { createContext, useContext, useState } from "react";

const UNIDAD_ACTIVA_KEY = "tuequipoia-unidad-activa";

export const UnidadContext = createContext(null);

// Maneja la lista de "unidades de negocio" del usuario (una empresa puede
// tener varias: Picadas, Viandas diarias, Viandas empresariales...) y cuál
// está activa. No toca los datos de cada unidad (eso lo hace useUnidadStorage);
// esto solo sabe qué unidades existen y cuál es la actual.
export function UnidadProvider({ unidadesIniciales, unidadIdInicial, children }) {
  const [unidades, setUnidades] = useState(unidadesIniciales || []);
  const [unidadId, setUnidadId] = useState(unidadIdInicial || unidadesIniciales?.[0]?.id || null);

  const cambiarUnidad = (id) => {
    setUnidadId(id);
    if (typeof window !== "undefined") window.localStorage.setItem(UNIDAD_ACTIVA_KEY, id);
  };

  const crearUnidad = async ({ nombre, rubro, tipoNegocio }) => {
    const res = await fetch("/api/unidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, rubro, tipoNegocio }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setUnidades((prev) => [...prev, data.unidad]);
    cambiarUnidad(data.unidad.id);
    return data.unidad;
  };

  const renombrarUnidad = async (id, cambios) => {
    const res = await fetch(`/api/unidades/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setUnidades((prev) => prev.map((u) => (u.id === id ? data.unidad : u)));
    return data.unidad;
  };

  const eliminarUnidad = async (id) => {
    const res = await fetch(`/api/unidades/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const restantes = unidades.filter((u) => u.id !== id);
    setUnidades(restantes);
    if (unidadId === id) cambiarUnidad(restantes[0]?.id || null);
  };

  const unidadActual = unidades.find((u) => u.id === unidadId) || null;

  return (
    <UnidadContext.Provider value={{ unidades, unidadId, unidadActual, cambiarUnidad, crearUnidad, renombrarUnidad, eliminarUnidad }}>
      {children}
    </UnidadContext.Provider>
  );
}

export function useUnidad() {
  const ctx = useContext(UnidadContext);
  if (!ctx) throw new Error("useUnidad tiene que usarse dentro de un <UnidadProvider>");
  return ctx;
}
