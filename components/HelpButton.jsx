"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, Mail, MessageCircle, Send, X } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const EMAIL_CONTACTO = "tuequipoia@gmail.com";
const WHATSAPP_NUMERO = "2617268115";
// Formato para el link de WhatsApp en Argentina: 54 9 + código de área + número.
const WHATSAPP_LINK = `https://wa.me/549${WHATSAPP_NUMERO}`;

export default function HelpButton() {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const cerrarSiClickAfuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrarSiClickAfuera);
    return () => document.removeEventListener("mousedown", cerrarSiClickAfuera);
  }, []);

  const enviarSugerencia = async () => {
    if (!mensaje.trim()) return;
    setEnviando(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("sugerencias").insert({
      user_id: user?.id,
      email: user?.email,
      mensaje: mensaje.trim(),
    });
    setEnviando(false);
    if (insertError) {
      setError("No se pudo enviar. Probá de nuevo.");
      return;
    }
    setMensaje("");
    setEnviado(true);
    setTimeout(() => setEnviado(false), 2500);
  };

  return (
    <div ref={ref} className="absolute top-0 right-0 z-20">
      <button onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
        style={{ background: "#ffffff", color: BRAND.navy, border: "1px solid #e4dfd3" }}>
        <HelpCircle size={14} />
        Ayuda
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl p-4 z-30"
          style={{ background: "#ffffff", border: "1px solid #e4dfd3", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: BRAND.navy }} className="text-sm font-semibold">¿Necesitás una mano?</span>
            <button onClick={() => setAbierto(false)} style={{ color: "#a89f88" }}><X size={14} /></button>
          </div>

          <a href={`mailto:${EMAIL_CONTACTO}`}
            className="flex items-center gap-2 text-xs mb-2 rounded-lg px-2.5 py-2" style={{ background: "#faf8f4", color: "#4a4740" }}>
            <Mail size={14} color={BRAND.teal} />
            {EMAIL_CONTACTO}
          </a>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs mb-3 rounded-lg px-2.5 py-2" style={{ background: "#faf8f4", color: "#4a4740" }}>
            <MessageCircle size={14} color={BRAND.teal} />
            WhatsApp: {WHATSAPP_NUMERO}
          </a>

          <div style={{ borderTop: "1px solid #f0ece2" }} className="pt-3">
            <span style={{ color: "#8a8578" }} className="text-xs block mb-2">¿Sugerencias o pedidos? Escribinos:</span>
            <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3}
              placeholder="Contanos qué necesitás o qué te gustaría que agreguemos..."
              className="w-full rounded-lg px-2.5 py-2 text-xs outline-none resize-none mb-2" style={{ border: "1px solid #e4dfd3" }} />
            {error && <p className="text-xs mb-2" style={{ color: "#b3453f" }}>{error}</p>}
            <button onClick={enviarSugerencia} disabled={enviando || !mensaje.trim()}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
              style={{ background: BRAND.teal, color: BRAND.navy }}>
              <Send size={12} />
              {enviado ? "Enviado ✓" : enviando ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
