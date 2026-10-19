"use client";

import { useEffect, useState, useCallback } from "react";
import { useUnidadStorage } from "@/lib/useUnidadStorage";

// Empresas para las que trabaja el usuario (AdSpot, GproSoft, Tu Equipo IA...).
// Se comparten entre Organización, CRM y Ventas (key "empresas" en app_data).
//
// Cada empresa tiene un "modelo" que define cómo se calcula la ganancia propia
// en Ventas → Ganancias:
//  - "cuotas":  comisión `pct`% de cada cuota que paga el cliente (ej. GproSoft 10%)
//  - "agencia": comisión `pct`% sobre la facturación neta de la comisión de
//               agencia (`agencia`%, editable por cliente); se cobra el mes
//               siguiente al ejecutado (ej. AdSpot 3% / agencia 25%)
//  - "propio":  desarrollos propios: precio al cliente − horas × `hora` − otros costos
//  - "compraventa": comprás un producto, lo arreglás y lo vendés:
//               ganancia = venta − compra − arreglos, con días de rotación
//  - "ninguno": sin cálculo de ganancia

export const PALETA_EMPRESAS = ["#d9485f", "#2f6fd6", "#1AABAA", "#e08a1e", "#5b4fc4", "#7a8f2b", "#c2477f", "#8a8578"];

export const MODELOS_GANANCIA = [
  { id: "cuotas", label: "Comisión por cuota cobrada" },
  { id: "agencia", label: "Comisión sobre facturación neta de agencia (cobro a mes siguiente)" },
  { id: "propio", label: "Desarrollo propio (precio − horas − costos)" },
  { id: "compraventa", label: "Compraventa (compro, arreglo y vendo)" },
  { id: "ninguno", label: "Sin cálculo de ganancia" },
];

export const EMPRESAS_DEFAULT = [
  { id: "adspot", nombre: "AdSpot", color: "#d9485f", modelo: "agencia", pct: 3, agencia: 25 },
  { id: "gprosoft", nombre: "GproSoft", color: "#2f6fd6", modelo: "cuotas", pct: 10 },
  { id: "tuequipo", nombre: "Tu Equipo IA", color: "#1AABAA", modelo: "propio", hora: 20000 },
];

export function useEmpresas() {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [empresas, setEmpresas] = useState(EMPRESAS_DEFAULT);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    if (!unidadId) return;
    loadData("empresas", null).then((e) => {
      if (Array.isArray(e) && e.length) setEmpresas(e);
      else {
        setEmpresas(EMPRESAS_DEFAULT);
        saveData("empresas", EMPRESAS_DEFAULT);
      }
      setCargado(true);
    });
  }, [unidadId]);

  const guardar = useCallback(
    async (lista) => {
      setEmpresas(lista);
      await saveData("empresas", lista);
    },
    [unidadId]
  );

  const crear = async ({ nombre, color, modelo = "ninguno", pct, agencia, hora }) => {
    const nueva = { id: `e${Date.now()}`, nombre: nombre.trim(), color, modelo, pct, agencia, hora };
    await guardar([...empresas, nueva]);
    return nueva;
  };
  const actualizar = async (id, cambios) => guardar(empresas.map((e) => (e.id === id ? { ...e, ...cambios } : e)));
  const eliminar = async (id) => guardar(empresas.filter((e) => e.id !== id));

  const porId = (id) => empresas.find((e) => e.id === id) || null;

  return { empresas, cargado, crear, actualizar, eliminar, porId };
}
