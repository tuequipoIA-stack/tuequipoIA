"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, TrendingUp, Users, Wallet } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { money } from "@/lib/helpers";

function Stat({ label, valor, color, fondo }) {
  return (
    <div className="rounded-xl p-4" style={{ background: fondo || "#ffffff", border: fondo ? "none" : "1px solid #e4dfd3" }}>
      <span style={{ color: fondo ? "#8b8b9a" : "#8a8578" }} className="text-xs">{label}</span>
      <div style={{ color: color || BRAND.navy }} className="text-2xl font-semibold">{valor}</div>
    </div>
  );
}

export default function MetricasAdmin() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/metricas")
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setDatos(d); });
  }, []);

  if (error) return <p style={{ color: "#b3453f" }} className="text-sm">{error}</p>;
  if (!datos) return <p style={{ color: "#8a8578" }} className="text-sm">Cargando métricas...</p>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} color={BRAND.navy} />
        <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Suscriptores</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Stat label="Total" valor={datos.totalSuscriptores} fondo={BRAND.navy} color={BRAND.teal} />
        <Stat label="Activos" valor={datos.activos} color="#127a79" />
        <Stat label="En prueba" valor={datos.enPrueba} />
        <Stat label="Prueba vencida" valor={datos.pruebaVencida} color="#b3703f" />
        <Stat label="Pago vencido / cancelado" valor={datos.pagoVencido + datos.cancelados} color="#b3453f" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Wallet size={16} color={BRAND.navy} />
        <span style={{ color: BRAND.navy }} className="text-sm font-semibold">Ingresos</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={13} color="#127a79" />
            <span style={{ color: "#8a8578" }} className="text-xs">Estimado a cobrar el próximo mes</span>
          </div>
          <div style={{ color: "#127a79" }} className="text-2xl font-semibold">{money(datos.proximoMesEstimado)}</div>
          {datos.activosManuales > 0 && (
            <p style={{ color: "#a89f88" }} className="text-[11px] mt-1">
              Incluye {datos.activosManuales} {datos.activosManuales === 1 ? "cuenta activada" : "cuentas activadas"} a mano
              (efectivo/transferencia), estimadas al precio vigente ({money(datos.precioVigente)}).
            </p>
          )}
        </div>
        <div className="rounded-xl p-4" style={{ background: BRAND.navy }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet size={13} color={BRAND.teal} />
            <span style={{ color: "#8b8b9a" }} className="text-xs">Total ingresado hasta ahora (vía MercadoPago)</span>
          </div>
          <div style={{ color: BRAND.teal }} className="text-2xl font-semibold">{money(datos.totalHistorico)}</div>
        </div>
      </div>

      <p style={{ color: "#a89f88" }} className="text-[11px]">
        El total histórico solo incluye lo cobrado por MercadoPago. Los pagos en efectivo o transferencia que activaste
        manualmente no quedan registrados acá porque no hay forma de saber cuánto ni cuándo se cobraron.
      </p>
      {datos.usuariosConErrorMp > 0 && (
        <div className="flex items-center gap-1.5 mt-2" style={{ color: "#b3703f" }}>
          <AlertTriangle size={12} />
          <p className="text-[11px]">
            No se pudo consultar el estado en MercadoPago de {datos.usuariosConErrorMp}{" "}
            {datos.usuariosConErrorMp === 1 ? "suscriptor" : "suscriptores"} — los números de arriba no los incluyen.
          </p>
        </div>
      )}
    </div>
  );
}
