"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { money } from "@/lib/helpers";
import PasswordInput from "@/components/PasswordInput";

const ESTADO_LABEL = { trial: "Prueba", active: "Activa", past_due: "Vencida", canceled: "Cancelada" };

function Bloque({ titulo, children }) {
  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
      <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-2">{titulo}</div>
      {children}
    </div>
  );
}

function Vacio() {
  return <p style={{ color: "#a89f88" }} className="text-xs">Sin datos cargados.</p>;
}

export default function AdminUserDetail({ userId, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [cambiando, setCambiando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [pasoBorrado, setPasoBorrado] = useState(0); // 0 = nada, 1 = primera confirmación, 2 = pidiendo contraseña
  const [passwordBorrado, setPasswordBorrado] = useState("");
  const [borrando, setBorrando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState("");

  const cargar = () => {
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      });
  };

  useEffect(() => { cargar(); }, [userId]);

  const cambiarEstado = async (status) => {
    setCambiando(true);
    setMensaje("");
    const res = await fetch(`/api/admin/users/${userId}/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const resData = await res.json();
    setCambiando(false);
    if (resData.error) {
      setMensaje(resData.error);
      return;
    }
    setMensaje(`Estado actualizado a "${ESTADO_LABEL[status] || status}" ✓`);
    cargar();
  };

  const eliminarUsuario = async () => {
    if (!passwordBorrado) return;
    setBorrando(true);
    setErrorBorrado("");
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordBorrado }),
    });
    const resData = await res.json();
    setBorrando(false);
    if (resData.error) {
      setErrorBorrado(resData.error);
      return;
    }
    onBack(true);
  };

  if (error) return <p style={{ color: "#b3453f" }} className="text-sm">{error}</p>;
  if (!data) return <p style={{ color: "#8a8578" }} className="text-sm">Cargando...</p>;

  const { profile, datos } = data;
  const perfil = datos["negocio-perfil"] || {};
  const ventas = datos["ventas-registro"] || [];
  const gastos = datos["gastos-registro"] || [];
  const tareas = datos["tablero-tareas"] || [];
  const estrategia = datos["estrategia-data"] || { vision: "", objetivos: [] };
  const clienteIdeal = datos["marketing-cliente"];
  const propuestaValor = datos["marketing-valor"];
  const planNegocio = datos["plan-negocio"];
  const calendario = datos["marketing-calendario"] || [];
  const recursos = datos["recursos-biblioteca"] || [];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs mb-4" style={{ color: "#6b6759" }}>
        <ArrowLeft size={14} /> Volver a la lista
      </button>

      <div className="flex items-center justify-between mb-4">
        <div>
          <div style={{ color: BRAND.navy }} className="text-lg font-semibold">{perfil.nombre || "(sin nombre de negocio)"}</div>
          <div style={{ color: "#8a8578" }} className="text-xs">{profile.email}</div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full font-semibold"
          style={{
            background: profile.subscription_status === "active" ? "#eef7f6" : "#f0ece2",
            color: profile.subscription_status === "active" ? "#127a79" : "#6b6759",
          }}>
          {ESTADO_LABEL[profile.subscription_status] || profile.subscription_status}
        </span>
      </div>

      <Bloque titulo="Suscripción">
        <p style={{ color: "#8a8578" }} className="text-xs mb-3">
          Cambiá el estado a mano si el pago se hizo en efectivo, transferencia, o para destrabar a alguien puntualmente.
          {profile.mercadopago_subscription_id && " Esto no cancela ni modifica la suscripción en MercadoPago, solo el acceso en la app."}
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          <button onClick={() => cambiarEstado("active")} disabled={cambiando}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
            style={{ background: "#eef7f6", color: "#127a79" }}>
            {cambiando && <Loader2 size={12} className="animate-spin" />}
            Activar manualmente
          </button>
          <button onClick={() => cambiarEstado("past_due")} disabled={cambiando}
            className="rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
            style={{ background: "#fdf0e6", color: "#b3703f" }}>
            Marcar como vencida
          </button>
          <button onClick={() => cambiarEstado("canceled")} disabled={cambiando}
            className="rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
            style={{ background: "#fbeceb", color: "#b3453f" }}>
            Cancelar
          </button>
        </div>
        {mensaje && <p className="text-xs" style={{ color: mensaje.includes("✓") ? "#127a79" : "#b3453f" }}>{mensaje}</p>}
      </Bloque>

      <Bloque titulo="Negocio">
        {perfil.nombre ? (
          <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "#4a4740" }}>
            <div><b>Rubro:</b> {perfil.rubro || "—"}</div>
            <div><b>Etapa:</b> {perfil.etapa || "—"}</div>
            <div><b>Tiempo funcionando:</b> {perfil.tiempoFuncionando || "—"}</div>
            <div><b>Facturación:</b> {perfil.facturacionMensual || "—"}</div>
            <div><b>Canal principal:</b> {perfil.canalVenta || "—"}</div>
            <div><b>Desafíos:</b> {(perfil.desafios || []).join(", ") || "—"}</div>
            <div className="col-span-2"><b>Objetivo 3 meses:</b> {perfil.objetivo3Meses || "—"}</div>
          </div>
        ) : <Vacio />}
      </Bloque>

      <Bloque titulo={`Ventas (${ventas.length} registros)`}>
        {ventas.length > 0 ? (
          <div className="space-y-1">
            {ventas.slice(0, 8).map((v) => (
              <div key={v.id} className="flex justify-between text-xs" style={{ color: "#4a4740" }}>
                <span>{v.fecha} · {v.producto} ×{v.cantidad || 1}</span>
                <span>{money(Number(v.precio || 0) * Number(v.cantidad || 1))}</span>
              </div>
            ))}
            {ventas.length > 8 && <p style={{ color: "#a89f88" }} className="text-xs">+{ventas.length - 8} más</p>}
          </div>
        ) : <Vacio />}
      </Bloque>

      <Bloque titulo={`Gastos (${gastos.length} registros)`}>
        {gastos.length > 0 ? (
          <div className="space-y-1">
            {gastos.slice(0, 8).map((g) => (
              <div key={g.id} className="flex justify-between text-xs" style={{ color: "#4a4740" }}>
                <span>{g.fecha} · {g.categoria}{g.nota ? ` (${g.nota})` : ""}</span>
                <span>{money(g.monto)}</span>
              </div>
            ))}
            {gastos.length > 8 && <p style={{ color: "#a89f88" }} className="text-xs">+{gastos.length - 8} más</p>}
          </div>
        ) : <Vacio />}
      </Bloque>

      <Bloque titulo="Visión y objetivos">
        {estrategia.vision || (estrategia.objetivos || []).length > 0 ? (
          <div className="text-xs" style={{ color: "#4a4740" }}>
            {estrategia.vision && <p className="mb-2"><b>Visión:</b> {estrategia.vision}</p>}
            {(estrategia.objetivos || []).map((o) => (
              <div key={o.id} className="flex items-center gap-2 mb-1">
                <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#f0ece2" }}>{o.plazo}</span>
                <span style={{ textDecoration: o.completado ? "line-through" : "none" }}>{o.texto}</span>
              </div>
            ))}
          </div>
        ) : <Vacio />}
      </Bloque>

      <Bloque titulo={`Tareas del tablero (${tareas.length})`}>
        {tareas.length > 0 ? (
          <div className="text-xs space-y-1" style={{ color: "#4a4740" }}>
            {tareas.slice(0, 10).map((t) => (
              <div key={t.id}>[{t.columna}] {t.texto}</div>
            ))}
            {tareas.length > 10 && <p style={{ color: "#a89f88" }}>+{tareas.length - 10} más</p>}
          </div>
        ) : <Vacio />}
      </Bloque>

      <Bloque titulo="Cliente ideal">
        {clienteIdeal?.nombre ? (
          <div className="text-xs" style={{ color: "#4a4740" }}>
            <p><b>{clienteIdeal.nombre}</b></p>
            <p className="mt-1">{clienteIdeal.descripcion}</p>
            {clienteIdeal.dolores && <p className="mt-1"><b>Dolores:</b> {clienteIdeal.dolores}</p>}
          </div>
        ) : <Vacio />}
      </Bloque>

      <Bloque titulo="Propuesta de valor">
        {propuestaValor?.propuesta ? (
          <div className="text-xs" style={{ color: "#4a4740" }}>
            <p>{propuestaValor.propuesta}</p>
            {propuestaValor.diferenciadores?.length > 0 && (
              <p className="mt-1"><b>Diferenciadores:</b> {propuestaValor.diferenciadores.join(", ")}</p>
            )}
          </div>
        ) : <Vacio />}
      </Bloque>

      <Bloque titulo="Plan de negocio">
        {planNegocio?.form?.costoUnitario ? (
          <div className="text-xs" style={{ color: "#4a4740" }}>
            <p><b>Producto:</b> {planNegocio.form.productoPrincipal || "—"}</p>
            <p><b>Costo unitario:</b> {money(planNegocio.form.costoUnitario)} · <b>Margen:</b> {planNegocio.form.margenDeseado}% · <b>Sueldo objetivo:</b> {money(planNegocio.form.sueldoObjetivo)}</p>
          </div>
        ) : <Vacio />}
      </Bloque>

      <Bloque titulo={`Calendario de contenido (${calendario.length}) / Recursos guardados (${recursos.length})`}>
        <p style={{ color: "#8a8578" }} className="text-xs">
          {calendario.length} publicaciones planificadas · {recursos.length} recursos en su biblioteca.
        </p>
      </Bloque>

      <div className="rounded-xl p-4" style={{ background: "#fbeceb", border: "1px solid #f3d5d3" }}>
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle size={14} color="#b3453f" />
          <span style={{ color: "#b3453f" }} className="text-sm font-semibold">Zona de peligro</span>
        </div>

        {pasoBorrado === 0 && (
          <>
            <p style={{ color: "#8a5450" }} className="text-xs mb-3">
              Elimina la cuenta de {profile.email} y todos sus datos (ventas, gastos, tareas, recursos, etc.) para siempre. No se puede deshacer.
            </p>
            <button onClick={() => setPasoBorrado(1)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
              style={{ background: "#b3453f", color: "#ffffff" }}>
              <Trash2 size={12} /> Eliminar usuario
            </button>
          </>
        )}

        {pasoBorrado === 1 && (
          <>
            <p style={{ color: "#8a5450" }} className="text-xs font-semibold mb-3">
              ¿Estás segura? Se van a borrar todos los datos de {profile.email} para siempre. Esto no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPasoBorrado(2)}
                className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: "#b3453f", color: "#ffffff" }}>
                Sí, quiero eliminarlo
              </button>
              <button onClick={() => setPasoBorrado(0)}
                className="rounded-lg px-3 py-2 text-xs font-medium" style={{ color: "#8a5450" }}>
                Cancelar
              </button>
            </div>
          </>
        )}

        {pasoBorrado === 2 && (
          <>
            <p style={{ color: "#8a5450" }} className="text-xs mb-2">
              Para confirmar, ingresá tu contraseña de administradora:
            </p>
            <div className="mb-2 max-w-xs">
              <PasswordInput dark={false} value={passwordBorrado} onChange={(e) => setPasswordBorrado(e.target.value)}
                className="w-full rounded-lg px-3 py-2 pr-11 text-sm outline-none" style={{ border: "1px solid #e4dfd3", background: "#ffffff" }} />
            </div>
            {errorBorrado && <p className="text-xs mb-2" style={{ color: "#b3453f" }}>{errorBorrado}</p>}
            <div className="flex gap-2">
              <button onClick={eliminarUsuario} disabled={borrando || !passwordBorrado}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
                style={{ background: "#b3453f", color: "#ffffff" }}>
                {borrando && <Loader2 size={12} className="animate-spin" />}
                {borrando ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
              <button onClick={() => { setPasoBorrado(0); setPasswordBorrado(""); setErrorBorrado(""); }}
                className="rounded-lg px-3 py-2 text-xs font-medium" style={{ color: "#8a5450" }}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
