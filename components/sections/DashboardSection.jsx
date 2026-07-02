"use client";

import { useEffect, useState } from "react";
import { ListChecks, Megaphone, Compass } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { isThisMonth, money } from "@/lib/helpers";

export default function DashboardSection({ business }) {
  const { loadData, unidadId } = useUnidadStorage();
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [calendario, setCalendario] = useState([]);
  const [estrategia, setEstrategia] = useState({ vision: "", objetivos: [] });
  const [plan, setPlan] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!unidadId) return;
    setLoaded(false);
    Promise.all([
      loadData("ventas-registro", []),
      loadData("gastos-registro", []),
      loadData("tablero-tareas", []),
      loadData("marketing-calendario", []),
      loadData("estrategia-data", { vision: "", objetivos: [] }),
      loadData("plan-negocio", null),
    ]).then(([v, g, t, c, e, p]) => {
      setVentas(v); setGastos(g); setTareas(t); setCalendario(c); setEstrategia(e); setPlan(p);
      setLoaded(true);
    });
  }, [unidadId]);

  const ventasMes = ventas.filter((v) => isThisMonth(v.fecha)).reduce((s, v) => s + Number(v.precio || 0) * Number(v.cantidad || 1), 0);
  const gastosMes = gastos.filter((g) => isThisMonth(g.fecha)).reduce((s, g) => s + Number(g.monto || 0), 0);
  const ganancia = ventasMes - gastosMes;
  const unidadesVendidasMes = ventas.filter((v) => isThisMonth(v.fecha)).reduce((s, v) => s + Number(v.cantidad || 1), 0);

  const tareasHoy = tareas.filter((t) => t.columna === "hoy");
  const tareasPendientes = tareas.filter((t) => t.columna !== "hecho").length;

  const hoyISO = new Date().toISOString().slice(0, 10);
  const proximasPublicaciones = calendario
    .filter((p) => p.fecha >= hoyISO)
    .sort((a, b) => (a.fecha > b.fecha ? 1 : -1))
    .slice(0, 3);

  const objetivosActivos = (estrategia.objetivos || []).filter((o) => !o.completado).slice(0, 4);

  // progreso del plan de negocio
  const form = plan?.form;
  const costo = Number(form?.costoUnitario) || 0;
  const margen = Number(form?.margenDeseado) || 0;
  const sueldoObjetivo = Number(form?.sueldoObjetivo) || 0;
  const precioVenta = margen > 0 && margen < 100 && costo > 0 ? costo / (1 - margen / 100) : 0;
  const gananciaUnidad = precioVenta - costo;
  const unidadesPorMesObjetivo = gananciaUnidad > 0 ? Math.ceil(sueldoObjetivo / gananciaUnidad) : 0;
  const tienePlan = unidadesPorMesObjetivo > 0;
  const progresoPlan = tienePlan ? Math.min(100, Math.round((unidadesVendidasMes / unidadesPorMesObjetivo) * 100)) : 0;

  if (!loaded) return null;

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">
        {business?.nombre ? `Hola, ${business.nombre}` : "Dashboard"}
      </h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">Todo lo importante de tu negocio, de un vistazo.</p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <span style={{ color: "#8a8578" }} className="text-xs">Ventas del mes</span>
          <div style={{ color: BRAND.navy }} className="text-lg font-semibold">{money(ventasMes)}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <span style={{ color: "#8a8578" }} className="text-xs">Gastos del mes</span>
          <div style={{ color: "#b3453f" }} className="text-lg font-semibold">{money(gastosMes)}</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: BRAND.navy }}>
          <span style={{ color: "#8b8b9a" }} className="text-xs">Ganancia del mes</span>
          <div style={{ color: ganancia >= 0 ? BRAND.teal : "#e08a86" }} className="text-lg font-semibold">{money(ganancia)}</div>
        </div>
      </div>

      {tienePlan && (
        <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Progreso hacia tu objetivo de sueldo</span>
            <span style={{ color: "#6b6759" }} className="text-xs">{unidadesVendidasMes} / {unidadesPorMesObjetivo} unidades</span>
          </div>
          <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ background: "#f0ece2" }}>
            <div className="h-full rounded-full" style={{ width: `${progresoPlan}%`, background: BRAND.teal }} />
          </div>
          <p style={{ color: "#8a8578" }} className="text-xs mt-2">{progresoPlan}% del camino hacia {money(sueldoObjetivo)}/mes</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Tareas */}
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex items-center gap-2 mb-3">
            <ListChecks size={15} color={BRAND.navy} />
            <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Tareas de hoy ({tareasHoy.length})</span>
          </div>
          <div className="space-y-1.5">
            {tareasHoy.slice(0, 5).map((t) => (
              <div key={t.id} style={{ color: "#4a4740" }} className="text-xs">• {t.texto}</div>
            ))}
            {tareasHoy.length === 0 && <p style={{ color: "#a89f88" }} className="text-xs">Sin tareas para hoy.</p>}
          </div>
          <p style={{ color: "#8a8578" }} className="text-xs mt-3">{tareasPendientes} tareas pendientes en total</p>
        </div>

        {/* Marketing */}
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex items-center gap-2 mb-3">
            <Megaphone size={15} color={BRAND.navy} />
            <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Próximas publicaciones</span>
          </div>
          <div className="space-y-1.5">
            {proximasPublicaciones.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <span style={{ color: "#8a8578" }}>{p.fecha}</span>
                <span style={{ color: BRAND.navy }}>{p.tipo}</span>
              </div>
            ))}
            {proximasPublicaciones.length === 0 && <p style={{ color: "#a89f88" }} className="text-xs">Sin publicaciones planificadas.</p>}
          </div>
        </div>
      </div>

      {/* Objetivos */}
      <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div className="flex items-center gap-2 mb-3">
          <Compass size={15} color={BRAND.navy} />
          <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Objetivos activos</span>
        </div>
        <div className="space-y-1.5">
          {objetivosActivos.map((o) => (
            <div key={o.id} className="flex items-center gap-2 text-xs">
              <span className="px-1.5 py-0.5 rounded" style={{ background: "#f0ece2", color: "#6b6759" }}>{o.plazo}</span>
              <span style={{ color: "#4a4740" }}>{o.texto}</span>
            </div>
          ))}
          {objetivosActivos.length === 0 && <p style={{ color: "#a89f88" }} className="text-xs">Sin objetivos cargados todavía.</p>}
        </div>
      </div>
    </div>
  );
}
