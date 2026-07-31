"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";
import { MARCAS } from "@/lib/panel/constants";
import { contactosApi, segmentosApi } from "@/lib/panel/api";
import PanelHoy from "@/components/sections/panel/PanelHoy";
import PanelSegmentos from "@/components/sections/panel/PanelSegmentos";
import PanelEnvios from "@/components/sections/panel/PanelEnvios";
import PanelContactos from "@/components/sections/panel/PanelContactos";

// Punto de entrada único del Panel de Prospección (CRM interno de Marisa).
// Solo se monta cuando isAdmin === true (ver app/page.js). Reemplaza al
// viejo Panel de Comunicación (proyectos/leads/cobros/listas/checklist).
// Modelo: segmentos (industria + puesto + marca) agrupan contactos; cada
// segmento tiene un mensaje generado por IA que se reutiliza para todos
// sus contactos, personalizado con fillTemplate().

function Toast({ mensaje }) {
  if (!mensaje) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg" style={{ background: BRAND.navy }}>
      {mensaje}
    </div>
  );
}

function CargandoIndicador({ visible }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white shadow-lg" style={{ background: BRAND.navy }}>
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: BRAND.teal, animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: BRAND.teal, animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: BRAND.teal, animationDelay: "300ms" }} />
      </span>
      Procesando...
    </div>
  );
}

export default function PanelSection({ vista }) {
  const [contactos, setContactos] = useState(null);
  const [segmentos, setSegmentos] = useState(null);
  const [marcaFiltro, setMarcaFiltro] = useState("todas");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const cargarTodo = () => {
    Promise.all([contactosApi.list(), segmentosApi.list()])
      .then(([cs, ss]) => {
        setContactos(cs);
        setSegmentos(ss);
      })
      .catch((e) => setError(e.message || "No se pudo cargar el panel."));
  };

  useEffect(() => { cargarTodo(); }, []);

  const cargando = contactos === null || segmentos === null;

  if (error) {
    return <p style={{ color: "#b3453f" }} className="text-sm">{error}</p>;
  }
  if (cargando) {
    return <p style={{ color: "#8a8578" }} className="text-sm">Cargando panel...</p>;
  }

  const contactosFiltrados = marcaFiltro === "todas" ? contactos : contactos.filter((c) => c.marca_origen === marcaFiltro);
  const segmentosFiltrados = marcaFiltro === "todas" ? segmentos : segmentos.filter((s) => s.marca_origen === marcaFiltro);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: "#8a8578" }} className="text-xs">Marca:</span>
        <button
          onClick={() => setMarcaFiltro("todas")}
          className="text-xs px-3 py-1 rounded-full font-semibold"
          style={marcaFiltro === "todas" ? { background: BRAND.navy, color: "#fff" } : { background: "#f1efe8", color: "#4a4740" }}
        >
          Todas
        </button>
        {MARCAS.map((m) => (
          <button
            key={m}
            onClick={() => setMarcaFiltro(m)}
            className="text-xs px-3 py-1 rounded-full font-semibold"
            style={marcaFiltro === m ? { background: BRAND.navy, color: "#fff" } : { background: "#f1efe8", color: "#4a4740" }}
          >
            {m}
          </button>
        ))}
      </div>

      {vista === "panel-hoy" && (
        <PanelHoy
          contactos={contactosFiltrados}
          segmentos={segmentosFiltrados}
          onAbrirContacto={() => showToast("Abrí ese contacto desde la pestaña Contactos")}
        />
      )}
      {vista === "panel-segmentos" && (
        <PanelSegmentos
          segmentos={segmentosFiltrados}
          contactos={contactosFiltrados}
          marcaFiltro={marcaFiltro}
          recargar={cargarTodo}
          showToast={showToast}
        />
      )}
      {vista === "panel-envios" && (
        <PanelEnvios
          segmentos={segmentosFiltrados}
          contactos={contactosFiltrados}
          marcaFiltro={marcaFiltro}
          recargar={cargarTodo}
          showToast={showToast}
        />
      )}

      {vista === "panel-contactos" && (
        <PanelContactos
          contactos={contactosFiltrados}
          segmentos={segmentosFiltrados}
          marcaFiltro={marcaFiltro}
          recargar={cargarTodo}
          showToast={showToast}
        />
      )}

      <Toast mensaje={toast} />
      <CargandoIndicador visible={false} />
    </div>
  );
}
