"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { money } from "@/lib/helpers";

export default function PrecioMembresiaCard() {
  const [precio, setPrecio] = useState(null);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

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
    </div>
  );
}
