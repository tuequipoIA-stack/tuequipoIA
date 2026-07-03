"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { BRAND } from "@/lib/constants";

const MP_SDK_SRC = "https://sdk.mercadopago.com/js/v2";

function cargarScriptMercadoPago() {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve();
    const existente = document.querySelector(`script[src="${MP_SDK_SRC}"]`);
    if (existente) {
      existente.addEventListener("load", () => resolve());
      existente.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = MP_SDK_SRC;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

const inputStyle = {
  border: "1px solid #e4dfd3",
  borderRadius: "0.5rem",
  padding: "0.5rem 0.75rem",
  fontSize: "0.875rem",
  height: "38px",
  width: "100%",
  background: "#ffffff",
};

export default function CambiarTarjetaForm({ onSuccess, onCancel }) {
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const cardFormRef = useRef(null);
  const inicializado = useRef(false);

  useEffect(() => {
    if (inicializado.current) return;
    inicializado.current = true;

    let cancelado = false;

    Promise.all([
      cargarScriptMercadoPago(),
      fetch("/api/config/precio").then((r) => r.json()).catch(() => ({ precio: 10000 })),
    ])
      .then(([, precioData]) => {
        if (cancelado) return;
        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
        const mp = new window.MercadoPago(publicKey, { locale: "es-AR" });

        cardFormRef.current = mp.cardForm({
          amount: String(precioData.precio || 10000),
          iframe: true,
          form: {
            id: "form-cambiar-tarjeta",
            cardNumber: { id: "cardNumber", placeholder: "Número de tarjeta" },
            expirationDate: { id: "expirationDate", placeholder: "MM/YY" },
            securityCode: { id: "securityCode", placeholder: "Código de seguridad" },
            cardholderName: { id: "cardholderName", placeholder: "Titular de la tarjeta" },
            issuer: { id: "issuer", placeholder: "Banco emisor" },
            installments: { id: "installments", placeholder: "Cuotas" },
            identificationType: { id: "identificationType", placeholder: "Tipo de documento" },
            identificationNumber: { id: "identificationNumber", placeholder: "Número de documento" },
            cardholderEmail: { id: "cardholderEmail", placeholder: "E-mail" },
          },
          callbacks: {
            onFormMounted: (err) => {
              if (err) {
                setError("No se pudo cargar el formulario de tarjeta. Recargá la página y probá de nuevo.");
                return;
              }
              setListo(true);
            },
            onSubmit: (event) => {
              event.preventDefault();
              setError("");
              setEnviando(true);
              const { token } = cardFormRef.current.getCardFormData();
              if (!token) {
                setError("No se pudo procesar la tarjeta. Revisá los datos e intentá de nuevo.");
                setEnviando(false);
                return;
              }
              fetch("/api/mercadopago/update-card", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
              })
                .then((r) => r.json())
                .then((data) => {
                  if (data.error) {
                    setError(data.error);
                    setEnviando(false);
                    return;
                  }
                  onSuccess?.();
                })
                .catch(() => {
                  setError("Hubo un error de conexión. Probá de nuevo.");
                  setEnviando(false);
                });
            },
          },
        });
      })
      .catch(() => {
        setError("No se pudo cargar el formulario seguro de MercadoPago. Revisá tu conexión y recargá.");
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div>
      {!listo && !error && (
        <p style={{ color: "#8a8578" }} className="text-xs mb-3">Cargando formulario seguro de MercadoPago...</p>
      )}
      <form id="form-cambiar-tarjeta" className="space-y-2">
        <div id="cardNumber" style={inputStyle} />
        <div className="grid grid-cols-2 gap-2">
          <div id="expirationDate" style={inputStyle} />
          <div id="securityCode" style={inputStyle} />
        </div>
        <input id="cardholderName" placeholder="Titular de la tarjeta" style={inputStyle} />
        <select id="issuer" style={inputStyle} />
        <select id="installments" style={inputStyle} />
        <div className="grid grid-cols-2 gap-2">
          <select id="identificationType" style={inputStyle} />
          <input id="identificationNumber" placeholder="Número de documento" style={inputStyle} />
        </div>
        <input id="cardholderEmail" type="email" placeholder="Email" style={inputStyle} />

        {error && <p className="text-xs" style={{ color: "#b3453f" }}>{error}</p>}

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={!listo || enviando}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ background: BRAND.teal, color: BRAND.navy }}>
            {enviando && <Loader2 size={14} className="animate-spin" />}
            {enviando ? "Guardando..." : "Guardar tarjeta"}
          </button>
          <button type="button" onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium" style={{ color: "#6b6759" }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
