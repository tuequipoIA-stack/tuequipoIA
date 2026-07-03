"use client";

import { useState } from "react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { BRAND, DATOS_TRANSFERENCIA, EMAIL_CONTACTO, WHATSAPP_LINK, WHATSAPP_NUMERO } from "@/lib/constants";

// Datos bancarios para pagar por transferencia. La activación no es
// automática: hay que avisar por WhatsApp o mail y se activa a mano desde
// Admin → "Activar manualmente" (ya existe esa función).
export default function TransferenciaBancaria({ dark = false }) {
  const [copiado, setCopiado] = useState("");

  const copiar = (label, valor) => {
    navigator.clipboard?.writeText(valor);
    setCopiado(label);
    setTimeout(() => setCopiado(""), 1500);
  };

  const colorLabel = dark ? "#8b8b9a" : "#8a8578";
  const colorValor = dark ? BRAND.cream : "#1A1A2E";
  const colorBorde = dark ? "#35354f" : "#e4dfd3";

  return (
    <div>
      <div className="rounded-lg overflow-hidden mb-3" style={{ border: `1px solid ${colorBorde}` }}>
        {DATOS_TRANSFERENCIA.map((d, i) => (
          <div key={d.label} className="flex items-center justify-between px-3 py-2"
            style={{ borderTop: i > 0 ? `1px solid ${colorBorde}` : "none" }}>
            <div className="min-w-0">
              <div style={{ color: colorLabel }} className="text-[10px] uppercase tracking-wide">{d.label}</div>
              <div style={{ color: colorValor }} className="text-sm font-medium truncate">{d.valor}</div>
            </div>
            <button onClick={() => copiar(d.label, d.valor)} className="shrink-0 ml-2" style={{ color: BRAND.teal }}>
              {copiado === d.label ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        ))}
      </div>

      <p style={{ color: colorLabel }} className="text-xs mb-2">
        Una vez que hagas la transferencia, avisanos para activarte la cuenta:
      </p>
      <div className="flex flex-wrap gap-2">
        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
          style={{ background: "#e9f6ec", color: "#2f7a45" }}>
          <MessageCircle size={13} /> WhatsApp {WHATSAPP_NUMERO}
        </a>
        <a href={`mailto:${EMAIL_CONTACTO}`}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
          style={{ background: "#eef7f6", color: "#127a79" }}>
          <Mail size={13} /> {EMAIL_CONTACTO}
        </a>
      </div>
    </div>
  );
}
