"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, X } from "lucide-react";
import { C } from "@/lib/theme";

// Modal de "actualizar por audio", compartido por Organización, CRM y Ventas.
//
// Flujo: grabar (reconocimiento de voz del navegador, gratis) → texto →
// /api/audio-interpretar (Claude arma los cambios) → la sección muestra la
// revisión con renderRevision → onAplicar.
// Si la IA no responde, se usa `respaldo(texto)` (reglas simples locales).
//
// Props:
//  - open, onClose, titulo, intro, ejemplo (texto de ejemplo para probar)
//  - contexto: "organizacion" | "crm" | "ventas"
//  - datos: objeto con el contexto que necesita la IA (empresas, oportunidades...)
//  - respaldo(texto) → propuesta  (mismo formato que devuelve la IA)
//  - renderRevision({ propuesta, setPropuesta }) → JSX de revisión editable
//  - contarCambios(propuesta) → número de cambios marcados
//  - onAplicar(propuesta)
export default function AudioModal({ open, onClose, titulo = "Actualizar por audio", intro, ejemplo, contexto, datos, respaldo, renderRevision, contarCambios, onAplicar }) {
  const [paso, setPaso] = useState("grabar"); // grabar | pensando | revisar
  const [grabando, setGrabando] = useState(false);
  const [texto, setTexto] = useState("");
  const [segs, setSegs] = useState(0);
  const [propuesta, setPropuesta] = useState(null);
  const [aviso, setAviso] = useState("");
  const recRef = useRef(null);
  const timerRef = useRef(null);
  const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  useEffect(() => {
    if (open) { setPaso("grabar"); setTexto(""); setPropuesta(null); setAviso(""); setSegs(0); }
    return () => parar();
  }, [open]);

  if (!open) return null;

  function parar() {
    clearInterval(timerRef.current);
    if (recRef.current) { try { recRef.current.stop(); } catch (_) {} recRef.current = null; }
    setGrabando(false);
  }

  function iniciar() {
    if (!SR) { setAviso("Tu navegador no permite dictar. Escribí el texto abajo o usá Chrome / Safari."); return; }
    setTexto(""); setSegs(0); setAviso("");
    try {
      const rec = new SR();
      rec.lang = "es-AR"; rec.continuous = true; rec.interimResults = true;
      let finales = "";
      rec.onresult = (ev) => {
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          if (r.isFinal) finales += r[0].transcript + ". "; else interim += r[0].transcript;
        }
        setTexto((finales + interim).trim());
      };
      rec.onerror = (e) => { if (e.error === "not-allowed") setAviso("No hay permiso para usar el micrófono."); };
      rec.onend = () => { clearInterval(timerRef.current); setGrabando(false); };
      rec.start();
      recRef.current = rec;
      setGrabando(true);
      timerRef.current = setInterval(() => setSegs((s) => s + 1), 1000);
    } catch (_) {
      setAviso("No se pudo iniciar el micrófono.");
    }
  }

  async function procesar(t) {
    const txt = (t ?? texto).trim();
    if (!txt) return;
    parar();
    setTexto(txt);
    setPaso("pensando");
    let prop = null;
    try {
      const res = await fetch("/api/audio-interpretar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contexto, texto: txt, datos }),
      });
      const data = await res.json();
      if (res.ok && data?.propuesta) prop = data.propuesta;
    } catch (_) {}
    if (!prop) prop = respaldo ? respaldo(txt) : null;
    setPropuesta(prop);
    setPaso("revisar");
  }

  const total = propuesta && contarCambios ? contarCambios(propuesta) : 0;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,20,32,0.55)" }}
      onClick={() => { parar(); onClose(); }}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ background: C.panel }}>
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-semibold" style={{ color: C.ink }}>{titulo}</h3>
          <button onClick={() => { parar(); onClose(); }} style={{ color: C.soft }}><X size={18} /></button>
        </div>
        {intro && <p className="text-xs mb-4 leading-relaxed" style={{ color: C.soft }}>{intro}</p>}

        {paso === "grabar" && (
          <>
            <div className="flex flex-col items-center py-2">
              <button onClick={grabando ? () => { parar(); if (texto) procesar(); } : iniciar}
                className="relative w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: grabando ? "#d9485f" : "#1AABAA", color: grabando ? "#fff" : "#1A1A2E" }}>
                {grabando && <span className="absolute -inset-2 rounded-full animate-ping" style={{ border: "3px solid #d9485f", opacity: 0.5 }} />}
                {grabando ? <Square size={28} fill="currentColor" /> : <Mic size={32} />}
              </button>
              <div className="text-sm font-semibold mt-3 text-center" style={{ color: C.muted }}>
                {grabando ? <>Grabando… {fmt(segs)} · tocá para terminar</> : "Tocá el micrófono y hablá"}
              </div>
              {aviso && <div className="text-xs mt-2 text-center" style={{ color: C.danger }}>{aviso}</div>}
            </div>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3}
              placeholder="Acá aparece lo que dictás. También podés escribirlo o corregirlo."
              className="w-full rounded-xl px-3 py-2.5 text-sm mt-3 outline-none resize-y"
              style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button onClick={() => procesar()} disabled={!texto.trim()} className="rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
                style={{ background: "#1AABAA", color: "#1A1A2E" }}>
                Armar cambios
              </button>
              {ejemplo && (
                <button onClick={() => procesar(ejemplo)} className="text-xs font-semibold px-2" style={{ color: C.tealDark }}>
                  Probar con un ejemplo →
                </button>
              )}
            </div>
            {ejemplo && <p className="text-[11px] mt-2 leading-relaxed" style={{ color: C.soft }}>Ejemplo: “{ejemplo}”</p>}
          </>
        )}

        {paso === "pensando" && (
          <>
            <div className="rounded-xl px-3 py-2.5 text-sm italic" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>“{texto}”</div>
            <div className="flex justify-center gap-1.5 py-5">
              {[0, 1, 2].map((i) => <span key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#1AABAA", animationDelay: `${i * 150}ms` }} />)}
            </div>
            <div className="text-sm font-semibold text-center" style={{ color: C.muted }}>Armando los cambios…</div>
          </>
        )}

        {paso === "revisar" && (
          <>
            <div className="rounded-xl px-3 py-2.5 text-sm italic mb-2" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>“{texto}”</div>
            {propuesta && renderRevision({ propuesta, setPropuesta })}
            {(!propuesta || total === 0) && (
              <p className="text-xs mt-3" style={{ color: C.soft }}>No encontré cambios para aplicar. Probá nombrar cada caso por su número o por el nombre del cliente.</p>
            )}
            <div className="flex items-center gap-3 mt-4">
              <button disabled={!total} onClick={() => { onAplicar(propuesta); onClose(); }}
                className="rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50" style={{ background: "#1AABAA", color: "#1A1A2E" }}>
                Aplicar {total} {total === 1 ? "cambio" : "cambios"}
              </button>
              <button onClick={() => { setPaso("grabar"); setTexto(""); }} className="text-sm font-semibold" style={{ color: C.muted }}>Grabar de nuevo</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Botón para abrir el audio (oscuro, con micrófono)
export function BotonAudio({ onClick, children = "Actualizar por audio", color }) {
  return (
    <button onClick={onClick} className="rounded-lg px-3.5 py-2 text-sm font-bold flex items-center gap-2"
      style={color ? { border: `1.5px solid ${color}`, color, background: "transparent", padding: "5px 11px", fontSize: 12, borderRadius: 999 } : { background: "#1A1A2E", color: "#F4F1EC" }}>
      <Mic size={color ? 13 : 15} /> {children}
    </button>
  );
}
