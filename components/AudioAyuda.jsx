"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, Play, Pause } from "lucide-react";
import { BRAND } from "@/lib/constants";

// Ícono de audio-ayuda: se ubica al lado del título de cada sección (y de
// cada pestaña, cuando la sección tiene más de una). Al pasar el mouse
// muestra el globito "Escuchá esto"; al hacer clic despliega un mini
// reproductor que lee el texto en voz alta con la voz del navegador
// (Web Speech API) — no depende de ningún servicio externo de audio.
export default function AudioAyuda({ texto }) {
  const [abierto, setAbierto] = useState(false);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [tiempo, setTiempo] = useState("0:00");
  const [verTranscripcion, setVerTranscripcion] = useState(false);
  const ref = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const cerrarSiClickAfuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrarSiClickAfuera);
    return () => document.removeEventListener("mousedown", cerrarSiClickAfuera);
  }, []);

  // Si cambia el texto (por ejemplo, cambiaste de pestaña) cortamos
  // cualquier audio en curso para no leer contenido de otra pestaña.
  useEffect(() => {
    detener();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const detener = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    setReproduciendo(false);
    setProgreso(0);
    setTiempo("0:00");
  };

  const reproducir = () => {
    if (reproduciendo) {
      detener();
      return;
    }
    if (typeof window === "undefined" || !window.speechSynthesis || !texto) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = "es-ES";
    utter.rate = 1;
    const palabras = texto.split(" ").length;
    const duracionEstimada = Math.max(4, palabras / 2.3);
    let elapsed = 0;
    setReproduciendo(true);
    timerRef.current = setInterval(() => {
      elapsed += 0.2;
      setProgreso(Math.min(100, (elapsed / duracionEstimada) * 100));
      const m = Math.floor(elapsed / 60);
      const s = Math.floor(elapsed % 60);
      setTiempo(`${m}:${s < 10 ? "0" : ""}${s}`);
      if (elapsed >= duracionEstimada) clearInterval(timerRef.current);
    }, 200);
    utter.onend = detener;
    utter.onerror = detener;
    window.speechSynthesis.speak(utter);
  };

  if (!texto) return null;

  return (
    <div ref={ref} className="relative inline-block group">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Escuchar qué es esta sección"
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors"
        style={
          reproduciendo
            ? { background: BRAND.teal, color: "#ffffff" }
            : { background: "#eef2fc", color: "#127a79", border: "1px solid #e4dfd3" }
        }
      >
        <Volume2 size={14} />
      </button>

      <span
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity z-20"
        style={{ background: BRAND.navy, color: "#ffffff" }}
      >
        Escuchá esto
      </span>

      {abierto && (
        <div
          className="absolute left-0 mt-2 w-72 rounded-xl p-3 z-30"
          style={{ background: "#fafbfc", border: "1px solid #e4dfd3", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={reproducir}
              aria-label={reproduciendo ? "Pausar" : "Reproducir"}
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#127a79", color: "#ffffff" }}
            >
              {reproduciendo ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#e4dfd3" }}>
              <div className="h-full" style={{ width: `${progreso}%`, background: "#127a79" }} />
            </div>
            <span className="text-[11px] w-8 text-right shrink-0" style={{ color: "#8a8578" }}>{tiempo}</span>
          </div>

          <button
            type="button"
            onClick={() => setVerTranscripcion((v) => !v)}
            className="text-[11px] mt-2"
            style={{ color: "#127a79" }}
          >
            {verTranscripcion ? "Ocultar transcripción" : "Ver transcripción"}
          </button>

          {verTranscripcion && (
            <p
              className="text-[12px] mt-1.5 pt-1.5 leading-relaxed"
              style={{ color: "#6b6759", borderTop: "1px solid #e4dfd3" }}
            >
              {texto}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
