"use client";

import { useUnidad } from "@/components/UnidadProvider";
import * as storage from "./storage";

// Igual firma que loadData/saveData de siempre — cada componente que ya
// las usaba solo necesita cambiar el import por este hook. La unidad de
// negocio activa queda "atada" sola, así los datos nunca se mezclan entre
// distintas unidades (Picadas, Viandas diarias, etc.) del mismo usuario.
export function useUnidadStorage() {
  const { unidadId } = useUnidad();
  return {
    unidadId,
    loadData: (key, fallback) => storage.loadData(key, fallback, unidadId),
    saveData: (key, value) => storage.saveData(key, value, unidadId),
  };
}
