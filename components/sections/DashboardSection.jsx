"use client";

import { useEffect, useState } from "react";
import { ListChecks, Megaphone, Compass, Trophy, Lightbulb, Check } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { isThisMonth, money, calcularPlanNumeros } from "@/lib/helpers";
import { createClient } from "@/lib/supabase/client";
import AudioAyuda from "@/components/AudioAyuda";
import { AUDIO_GUIONES, AUDIO_ARCHIVOS } from "@/lib/audioGuiones";

const hoyISO = () => new Date().toISOString().slice(0, 10);

export default function DashboardSection({ business }) {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [calendario, setCalendario] = useState([]);
  const [estrategia, setEstrategia] = useState({ vision: "", objetivos: [] });
  const [plan, setPlan] = useState(null);
  const [metaDiaria, setMetaDiaria] = useState(null);
  const [ultimoHack, setUltimoHack] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!unidadId) return;
    setLoaded(false);
    const supabase = createClient();
    Promise.all([
      loadData("ventas-registro", []),
      loadData("gastos-registro", []),
      loadData("tablero-tareas", []),
      loadData("marketing-calendario", []),
      loadData("estrategia-data", { vision: "", objetivos: [] }),
      loadData("plan-negocio", null),
      loadData("dashboard-meta-diaria", null),
      supabase
        .from("recursos")
        .select("titulo, descripcion, categoria, publicar_en, created_at")
        .eq("tipo", "hack")
        .lte("publicar_en", new Date().toISOString())
        .order("publicar_en", { ascending: false })
        .limit(1),
    ]).then(([v, g, t, c, e, p, md, hackRes]) => {
      setVentas(v); setGastos(g); setTareas(t); setCalendario(c); setEstrategia(e); setPlan(p);
      setMetaDiaria(md);
      setUltimoHack(hackRes?.data?.[0] || null);
      setLoaded(true);
    });
  }, [unidadId]);

  const ventasMes = ventas.filter((v) => isThisMonth(v.fecha)).reduce((s, v) => s + Number(v.precio || 0) * Number(v.cantidad || 1), 0);
  const gastosMes = gastos.filter((g) => isThisMonth(g.fecha)).reduce((s, g) => s + Number(g.monto || 0), 0);
  const ganancia = ventasMes - gastosMes;
  const unidadesVendidasMes = ventas.filter((v) => isThisMonth(v.fecha)).reduce((s, v) => s + Number(v.cantidad || 1), 0);

  const tareasHoy = tareas.filter((t) => t.columna === "hoy");
  const tareasPendientes = tareas.filter((t) => t.columna !== "hecho").length;

  const hoy = hoyISO();
  const proximasPublicaciones = calendario
    .filter((p) => p.fecha >= hoy)
    .sort((a, b) => (a.fecha > b.fecha ? 1 : -1))
    .slice(0, 3);

  const objetivosActivos = (estrategia.objetivos || []).filter((o) => !o.completado).slice(0, 4);

  // progreso del plan de negocio (mensual, ya existente)
  const numeros = calcularPlanNumeros(plan?.form);
  const { puedeCalcular, unidadesPorMes: unidadesPorMesObjetivo, unidadesPorDia, precioVenta, sueldoObjetivo } = numeros;
  const progresoPlan = puedeCalcular ? Math.min(100, Math.round((unidadesVendidasMes / unidadesPorMesObjetivo) * 100)) : 0;

  // meta de venta de hoy, bajada del plan de negocio (Estrategia > Plan de negocio)
  const metaHoyMonto = puedeCalcular ? unidadesPorDia * precioVenta : 0;
  const ventasHoy = ventas.filter((v) => v.fecha === hoy);
  const vendidoHoy = ventasHoy.reduce((s, v) => s + Number(v.precio || 0) * Number(v.cantidad || 1), 0);
  const progresoHoy = metaHoyMonto > 0 ? Math.min(100, Math.round((vendidoHoy / metaHoyMonto) * 100)) : 0;
  const logradoHoy = metaDiaria?.fecha === hoy ? !!metaDiaria.logrado : false;

  const toggleLogradoHoy = async () => {
    const nuevo = { fecha: hoy, logrado: !logradoHoy };
    setMetaDiaria(nuevo);
    await saveData("dashboard-meta-diaria", nuevo);
  };

  // ranking de los 3 productos/servicios más vendidos de los últimos 3 meses
  const tresMesesAtras = new Date();
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
  const cortefecha = tresMesesAtras.toISOString().slice(0, 10);
  const ventasUlt3Meses = ventas.filter((v) => v.fecha >= cortefecha);
  const porProducto = {};
  ventasUlt3Meses.forEach((v) => {
    const nombre = v.producto || "Sin nombre";
    if (!porProducto[nombre]) porProducto[nombre] = { unidades: 0, ingresos: 0 };
    porProducto[nombre].unidades += Number(v.cantidad || 1);
    porProducto[nombre].ingresos += Number(v.precio || 0) * Number(v.cantidad || 1);
  });
  const rankingTop3 = Object.entries(porProducto)
    .sort((a, b) => b[1].unidades - a[1].unidades)
    .slice(0, 3)
    .map(([nombre, datos]) => ({ nombre, ...datos }));
  const medallas = ["#FAC775", "#D3D1C7", "#F0997B"];
  const medallasTexto = ["#412402", "#2C2C2A", "#4A1B0C"];

  if (!loaded) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold">
          {business?.nombre ? `Hola, ${business.nombre}` : "Dashboard"}
        </h2>
        <AudioAyuda texto={AUDIO_GUIONES.dashboard} audioSrc={AUDIO_ARCHIVOS.dashboard} />
      </div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">Todo lo importante de tu negocio, de un vistazo.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
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

      {/* Meta de venta de hoy, bajada del Plan de negocio */}
      {puedeCalcular ? (
        <div className="rounded-xl p-4 mb-5" style={{ background: BRAND.teal }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span style={{ color: "#0b2a24" }} className="text-xs font-medium opacity-80">Meta de venta de hoy</span>
              <div style={{ color: "#0b2a24" }} className="text-2xl font-semibold mt-0.5">{money(metaHoyMonto)}</div>
              <p style={{ color: "#0b2a24" }} className="text-xs mt-0.5 opacity-80">
                Según tu plan de negocio ({unidadesPorDia} un./día) · se reinicia todos los días
              </p>
            </div>
            <button onClick={toggleLogradoHoy}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold shrink-0"
              style={{ background: "rgba(11,42,36,0.12)", color: "#0b2a24" }}>
              <span className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                style={logradoHoy ? { background: "#0b2a24" } : { border: "1.5px solid #0b2a24" }}>
                {logradoHoy && <Check size={11} color={BRAND.teal} />}
              </span>
              ¿Se logró hoy?
            </button>
          </div>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: "rgba(11,42,36,0.18)" }}>
            <div className="h-full rounded-full" style={{ width: `${progresoHoy}%`, background: "#0b2a24" }} />
          </div>
          <p style={{ color: "#0b2a24" }} className="text-xs mt-1.5 opacity-80">{money(vendidoHoy)} vendido hasta ahora</p>
        </div>
      ) : (
        <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px dashed #d8d2c3" }}>
          <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Meta de venta de hoy</span>
          <p style={{ color: "#a89f88" }} className="text-xs mt-1">
            Completá costo, margen y sueldo objetivo en Estrategia → Plan de negocio para ver acá cuánto tenés que vender hoy.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Ranking top 3 */}
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex items-center gap-2 mb-0.5">
            <Trophy size={15} color="#c98a1f" />
            <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Top 3 más vendidos</span>
          </div>
          <p style={{ color: "#a89f88" }} className="text-xs mb-3">Últimos 3 meses</p>
          <div className="space-y-2.5">
            {rankingTop3.map((item, i) => (
              <div key={item.nombre} className="flex items-center gap-2.5">
                <span className="w-5.5 h-5.5 rounded-full text-xs font-semibold flex items-center justify-center shrink-0"
                  style={{ background: medallas[i], color: medallasTexto[i], width: 22, height: 22 }}>{i + 1}</span>
                <span style={{ color: "#4a4740" }} className="text-xs flex-1 truncate">{item.nombre}</span>
                <span style={{ color: BRAND.navy }} className="text-xs font-semibold shrink-0">{item.unidades} uds</span>
              </div>
            ))}
            {rankingTop3.length === 0 && (
              <p style={{ color: "#a89f88" }} className="text-xs">Sin ventas registradas en los últimos 3 meses.</p>
            )}
          </div>
        </div>

        {/* Último hack publicado */}
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex items-center gap-2 mb-0.5">
            <Lightbulb size={15} color={BRAND.teal} />
            <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Último hack</span>
          </div>
          {ultimoHack ? (
            <>
              <p style={{ color: "#a89f88" }} className="text-xs mb-3">
                Publicado el {new Date(ultimoHack.publicar_en || ultimoHack.created_at).toLocaleDateString("es-AR")}
              </p>
              <p style={{ color: "#4a4740" }} className="text-xs leading-relaxed">{ultimoHack.titulo}</p>
            </>
          ) : (
            <p style={{ color: "#a89f88" }} className="text-xs mt-3">Sin hacks publicados todavía.</p>
          )}
        </div>
      </div>

      {puedeCalcular && (
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
