"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Pencil } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { money } from "@/lib/helpers";

export default function PrecioMembresiaCard() {
  const [precio, setPrecio] = useState(null);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [pasoAplicar, setPasoAplicar] = useState(0); // 0 = nada, 1 = confirmando, 2 = resultado
  const [cantidadAfectada, setCantidadAfectada] = useState(null);
  const [aplicando, setAplicando] = useState(false);
  const [resultadoAplicar, setResultadoAplicar] = useState(null);
  const [errorAplicar, setErrorAplicar] = useState("");

  const cargar = () => {
    fetch("/api/admin/config/precio")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setPrecio(d.precio); });
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    setError("");
    setGuardando(true);
    const res = await fetch("/api/admin/config/precio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ precio: Number(valor) }),
    });
    const data = await res.json();
    setGuardando(false);
    if (data.error) { setError(data.error); return; }
    setPrecio(data.precio);
    setEditando(false);
    setMensaje("Precio actualizado ✓");
    setTimeout(() => setMensaje(""), 2500);
  };

  const iniciarAplicar = async () => {
    setErrorAplicar("");
    const res = await fetch("/api/admin/config/precio/aplicar-existentes");
    const data = await res.json();
    if (data.error) { setErrorAplicar(data.error); return; }
    setCantidadAfectada(data.cantidad);
    setPasoAplicar(1);
  };

  const confirmarAplicar = async () => {
    setAplicando(true);
    setErrorAplicar("");
    const res = await fetch("/api/admin/config/precio/aplicar-existentes", { method: "POST" });
    const data = await res.json();
    setAplicando(false);
    if (data.error) { setErrorAplicar(data.error); return; }
    setResultadoAplicar(data);
    setPasoAplicar(2);
  };

  return (
    <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
      <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-1">Precio de la membresía</div>
      <p style={{ color: "#8a8578" }} className="text-xs mb-3">
        Se aplica a las suscripciones nuevas que se creen de acá en adelante. No modifica lo que ya le cobra
        MercadoPago a alguien que ya está suscripto — ese monto queda fijo desde que se suscribió.
      </p>

      {!editando ? (
        <div className="flex items-center gap-3">
          <div style={{ color: BRAND.teal }} className="text-2xl font-semibold">
            {precio !== null ? `${money(precio)}/mes` : "Cargando..."}
          </div>
          {precio !== null && (
            <button onClick={() => { setValor(String(precio)); setEditando(true); }}
              className="flex items-center gap-1 text-xs font-medium" style={{ color: "#127a79" }}>
              <Pencil size={12} /> Editar
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <input type="number" min="1" value={valor} onChange={(e) => setValor(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none w-32" style={{ border: "1px solid #e4dfd3" }} />
          <button onClick={guardar} disabled={guardando || !valor || Number(valor) <= 0}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
            style={{ background: BRAND.teal, color: BRAND.navy }}>
            {guardando && <Loader2 size={12} className="animate-spin" />}
            Guardar
          </button>
          <button onClick={() => { setEditando(false); setError(""); }}
            className="rounded-lg px-3 py-2 text-xs font-medium" style={{ color: "#6b6759" }}>
            Cancelar
          </button>
        </div>
      )}
      {mensaje && <p className="text-xs mt-2" style={{ color: "#127a79" }}>{mensaje}</p>}
      {error && <p className="text-xs mt-2" style={{ color: "#b3453f" }}>{error}</p>}

      <div className="mt-4 pt-4" style={{ borderTop: "1px solid #f0ece2" }}>
        {pasoAplicar === 0 && (
          <button onClick={iniciarAplicar} className="text-xs font-medium" style={{ color: "#b3703f" }}>
            Aplicar este precio a suscriptores activos existentes
          </button>
        )}

        {pasoAplicar === 1 && (
          <div className="rounded-lg p-3" style={{ background: "#fdf0e6" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle size={13} color="#b3703f" />
              <span style={{ color: "#b3703f" }} className="text-xs font-semibold">Confirmar cambio de monto</span>
            </div>
            <p style={{ color: "#8a5a2a" }} className="text-xs mb-2">
              Esto va a cambiar, en MercadoPago, el monto que se le va a cobrar en su próxima fecha de pago a{" "}
              <b>{cantidadAfectada}</b> {cantidadAfectada === 1 ? "suscriptor activo" : "suscriptores activos"} —
              al precio actual ({precio !== null ? money(precio) : "..."}). No se les avisa automáticamente del cambio.
            </p>
            <div className="flex gap-2">
              <button onClick={confirmarAplicar} disabled={aplicando}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                style={{ background: "#b3703f", color: "#ffffff" }}>
                {aplicando && <Loader2 size={12} className="animate-spin" />}
                {aplicando ? "Aplicando..." : "Sí, aplicar"}
              </button>
              <button onClick={() => setPasoAplicar(0)} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ color: "#8a5a2a" }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {pasoAplicar === 2 && resultadoAplicar && (
          <div className="rounded-lg p-3" style={{ background: "#eef7f6" }}>
            <p style={{ color: "#127a79" }} className="text-xs font-semibold mb-1">
              Listo: {resultadoAplicar.exitosos}/{resultadoAplicar.total} actualizados a {money(resultadoAplicar.precio)}.
            </p>
            {resultadoAplicar.resultados.filter((r) => !r.ok).map((r) => (
              <p key={r.email} style={{ color: "#b3453f" }} className="text-[11px]">{r.email}: {r.error}</p>
            ))}
            <button onClick={() => setPasoAplicar(0)} className="text-xs font-medium mt-2" style={{ color: "#127a79" }}>
              Cerrar
            </button>
          </div>
        )}

        {errorAplicar && <p className="text-xs mt-2" style={{ color: "#b3453f" }}>{errorAplicar}</p>}
      </div>
    </div>
  );
}
