"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { money, isThisMonth, calcularPlanNumeros } from "@/lib/helpers";

const ETAPAS_EMBUDO = [
  { id: "contacto_inicial", label: "Contacto inicial" },
  { id: "calificado", label: "Calificado" },
  { id: "propuesta_enviada", label: "Propuesta enviada" },
  { id: "negociacion", label: "Negociación" },
  { id: "ganado", label: "Ganado" },
];

const ETAPAS_PROYECTO_EJECUTADO = ["cobrado", "en_mantenimiento"];

function StatCard({ label, valor, color, sub }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
      <div style={{ color: "#8a8578" }} className="text-xs mb-1">{label}</div>
      <div style={{ color: color || BRAND.navy }} className="text-xl font-semibold">{valor}</div>
      {sub && <div style={{ color: "#a89f88" }} className="text-[11px] mt-0.5">{sub}</div>}
    </div>
  );
}

// Dashboard del CRM: KPIs y embudo calculados directamente de crm_prospectos
// y ventas_proyectos — sin IA todavía (eso es el motor de razonamiento,
// un paso aparte). El embudo es una foto del estado actual de cada etapa,
// no conversión de cohortes reales (todavía no se registra crm_prospecto_historial).
export default function CrmDashboard({ unidadId }) {
  const { loadData } = useUnidadStorage();
  const [prospectos, setProspectos] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [plan, setPlan] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!unidadId) return;
    setCargando(true);
    Promise.all([
      fetch(`/api/crm/prospectos?unidadId=${encodeURIComponent(unidadId)}`).then((r) => r.json()),
      fetch(`/api/crm/proyectos?unidadId=${encodeURIComponent(unidadId)}`).then((r) => r.json()),
      loadData("plan-negocio", null),
    ]).then(([p, pr, plan]) => {
      setProspectos(p.prospectos || []);
      setProyectos(pr.proyectos || []);
      setPlan(plan);
      setCargando(false);
    });
  }, [unidadId]);

  if (cargando) return <p style={{ color: "#8a8578" }} className="text-sm">Cargando...</p>;

  // KPIs de prospectos
  const cotizaciones = prospectos.filter((p) => Number(p.valor_estimado) > 0).length;
  const propuestasEnviadas = prospectos.filter((p) => p.etapa === "propuesta_enviada").length;
  const cotizados = prospectos.filter((p) => ["propuesta_enviada", "negociacion", "ganado", "perdido"].includes(p.etapa));
  const ganados = prospectos.filter((p) => p.etapa === "ganado").length;
  const conversionPropuestaGanado = cotizados.length > 0 ? Math.round((ganados / cotizados.length) * 100) : 0;

  // KPIs de proyectos
  const facturado = proyectos.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const proyectosEjecutados = proyectos.filter((p) => ETAPAS_PROYECTO_EJECUTADO.includes(p.etapa_seguimiento));
  const cobrado = proyectosEjecutados.reduce((acc, p) => acc + Number(p.monto || 0), 0);

  // Objetivo de facturación del mes (plan de negocio) vs. lo facturado este mes
  const numerosPlan = calcularPlanNumeros(plan?.form);
  const facturadoEsteMes = proyectos
    .filter((p) => isThisMonth(p.fecha_inicio || p.created_at))
    .reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const progresoMeta = numerosPlan.puedeCalcular
    ? Math.min(100, Math.round((facturadoEsteMes / numerosPlan.facturacionMensual) * 100))
    : 0;

  // Embudo: distribución actual de prospectos por etapa (sin "perdido", es una salida lateral)
  const embudo = ETAPAS_EMBUDO.map((e) => ({ ...e, cantidad: prospectos.filter((p) => p.etapa === e.id).length }));
  const maxEmbudo = Math.max(1, ...embudo.map((e) => e.cantidad));

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <StatCard label="Cotizaciones" valor={cotizaciones} />
        <StatCard label="Propuestas enviadas" valor={propuestasEnviadas} />
        <StatCard label="% conversión propuesta → ganado" valor={`${conversionPropuestaGanado}%`} color={BRAND.teal} />
        <StatCard label="Facturado" valor={money(facturado)} />
        <StatCard label="Cobrado" valor={money(cobrado)} color={BRAND.teal} />
        <StatCard label="Proyectos ejecutados" valor={proyectosEjecutados.length} />
      </div>

      {numerosPlan.puedeCalcular ? (
        <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Objetivo de facturación del mes</span>
            <span style={{ color: "#6b6759" }} className="text-xs">{money(facturadoEsteMes)} / {money(numerosPlan.facturacionMensual)}</span>
          </div>
          <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ background: "#f0ece2" }}>
            <div className="h-full rounded-full" style={{ width: `${progresoMeta}%`, background: BRAND.teal }} />
          </div>
          <p style={{ color: "#8a8578" }} className="text-xs mt-2">{progresoMeta}% de la meta, según tu Plan de negocio (Estrategia)</p>
        </div>
      ) : (
        <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px dashed #d8d2c3" }}>
          <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Objetivo de facturación del mes</span>
          <p style={{ color: "#a89f88" }} className="text-xs mt-1">
            Completá tu Plan de negocio en Estrategia para ver acá la meta de facturación.
          </p>
        </div>
      )}

      <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Embudo del Pipeline</span>
        <p style={{ color: "#a89f88" }} className="text-xs mb-3">Foto actual de cuántos prospectos hay en cada etapa.</p>
        <div className="space-y-2.5">
          {embudo.map((e, i) => {
            const anterior = i > 0 ? embudo[i - 1].cantidad : null;
            // Es una foto del momento, no conversión de cohortes reales: si en
            // esta etapa hay más prospectos que en la anterior (puede pasar),
            // mostrar "% avanza" sería engañoso — se omite en ese caso.
            const conversionCruda = anterior && anterior > 0 ? (e.cantidad / anterior) * 100 : null;
            const conversion = conversionCruda !== null && conversionCruda <= 100 ? Math.round(conversionCruda) : null;
            return (
              <div key={e.id}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: "#4a4740" }} className="text-xs">{e.label}</span>
                  <span style={{ color: BRAND.navy }} className="text-xs font-semibold">
                    {e.cantidad}{conversion !== null && <span style={{ color: "#a89f88" }} className="font-normal"> · {conversion}% avanza desde {embudo[i - 1].label.toLowerCase()}</span>}
                  </span>
                </div>
                <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: "#f0ece2" }}>
                  <div className="h-full rounded-full" style={{ width: `${(e.cantidad / maxEmbudo) * 100}%`, background: BRAND.teal }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
