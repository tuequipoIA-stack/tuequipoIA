"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { BRAND, TIPOS_NEGOCIO } from "@/lib/constants";
import { useUnidad } from "@/components/UnidadProvider";

export default function UnidadSwitcher({ collapsed }) {
  const { unidades, unidadId, unidadActual, cambiarUnidad, crearUnidad } = useUnidad();
  const [abierto, setAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("productos");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const cerrar = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setAbierto(false); setCreando(false); }
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  const confirmarNueva = async () => {
    if (!nuevoNombre.trim()) return;
    setGuardando(true);
    setError("");
    try {
      await crearUnidad({ nombre: nuevoNombre.trim(), tipoNegocio: nuevoTipo });
      setNuevoNombre("");
      setNuevoTipo("productos");
      setCreando(false);
      setAbierto(false);
    } catch (e) {
      setError(e.message || "No se pudo crear la unidad.");
    } finally {
      setGuardando(false);
    }
  };

  if (unidades.length <= 1 && !abierto) {
    // Con una sola unidad, igual dejamos el botón para poder agregar más.
  }

  return (
    <div ref={ref} className="relative mb-5">
      <button onClick={() => setAbierto((v) => !v)}
        className={`w-full flex items-center rounded-lg text-left transition-colors ${collapsed ? "justify-center px-0 py-2" : "justify-between gap-2 px-2 py-2"}`}
        style={{ background: "#242440" }}>
        {!collapsed ? (
          <>
            <span style={{ color: BRAND.cream }} className="text-xs font-medium truncate">
              {unidadActual?.nombre || "Elegir unidad"}
            </span>
            <ChevronsUpDown size={13} color="#8686a0" className="shrink-0" />
          </>
        ) : (
          <span style={{ color: BRAND.cream }} className="text-xs font-bold">
            {(unidadActual?.nombre || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute left-0 top-full mt-1 w-64 rounded-xl p-2 z-30"
          style={{ background: "#ffffff", border: "1px solid #e4dfd3", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          {!creando ? (
            <>
              <div style={{ color: "#8a8578" }} className="text-[10px] uppercase font-semibold px-2 pb-1.5 pt-1">Tus unidades de negocio</div>
              <div className="max-h-52 overflow-y-auto">
                {unidades.map((u) => (
                  <button key={u.id} onClick={() => { cambiarUnidad(u.id); setAbierto(false); }}
                    className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-sm text-left"
                    style={{ background: u.id === unidadId ? "#eef7f6" : "transparent", color: "#1A1A2E" }}>
                    <span className="truncate">{u.nombre}</span>
                    {u.id === unidadId && <Check size={13} color="#127a79" className="shrink-0" />}
                  </button>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #f0ece2" }} className="mt-1 pt-1">
                <button onClick={() => setCreando(true)}
                  className="w-full flex items-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium"
                  style={{ color: BRAND.teal }}>
                  <Plus size={14} /> Nueva unidad de negocio
                </button>
              </div>
            </>
          ) : (
            <div className="p-1">
              <div style={{ color: "#1A1A2E" }} className="text-xs font-semibold mb-2">Nueva unidad</div>
              <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej: Picadas, Viandas empresariales..."
                className="w-full rounded-lg px-2.5 py-2 text-sm outline-none mb-2" style={{ border: "1px solid #e4dfd3" }} />
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {TIPOS_NEGOCIO.map((t) => (
                  <button key={t.id} onClick={() => setNuevoTipo(t.id)}
                    className="rounded-lg px-2 py-1.5 text-xs font-medium"
                    style={nuevoTipo === t.id ? { background: BRAND.teal, color: BRAND.navy } : { background: "#f0ece2", color: "#6b6759" }}>
                    {t.label}
                  </button>
                ))}
              </div>
              {error && <p className="text-xs mb-2" style={{ color: "#b3453f" }}>{error}</p>}
              <div className="flex gap-1.5">
                <button onClick={confirmarNueva} disabled={guardando || !nuevoNombre.trim()}
                  className="flex-1 rounded-lg py-2 text-xs font-semibold disabled:opacity-50"
                  style={{ background: BRAND.teal, color: BRAND.navy }}>
                  {guardando ? "Creando..." : "Crear"}
                </button>
                <button onClick={() => { setCreando(false); setError(""); }}
                  className="rounded-lg px-3 py-2 text-xs font-medium" style={{ color: "#6b6759" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
