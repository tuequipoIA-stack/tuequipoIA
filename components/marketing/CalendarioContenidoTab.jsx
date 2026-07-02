"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Plus, Trash2 } from "lucide-react";
import { BRAND, TIPOS_PUBLICACION, DIAS_SEMANA, MESES, colorTipo } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid, fechaISO, getGrillaMes } from "@/lib/helpers";

export default function CalendarioContenidoTab() {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const hoy = new Date();
  const [publicaciones, setPublicaciones] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [mesActual, setMesActual] = useState({ year: hoy.getFullYear(), month: hoy.getMonth() });
  const [diaSeleccionado, setDiaSeleccionado] = useState(fechaISO(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  const [form, setForm] = useState({ tipo: TIPOS_PUBLICACION[0], copy: "", link: "" });
  const [arrastrando, setArrastrando] = useState(null);

  useEffect(() => {
    if (!unidadId) return;
    loadData("marketing-calendario", []).then((d) => { setPublicaciones(d); setLoaded(true); });
  }, [unidadId]);

  const agregar = async () => {
    if (!diaSeleccionado) return;
    const nueva = { id: uid(), fecha: diaSeleccionado, ...form };
    const actualizado = [...publicaciones, nueva];
    setPublicaciones(actualizado);
    await saveData("marketing-calendario", actualizado);
    setForm({ tipo: TIPOS_PUBLICACION[0], copy: "", link: "" });
  };

  const eliminar = async (id) => {
    const actualizado = publicaciones.filter((p) => p.id !== id);
    setPublicaciones(actualizado);
    await saveData("marketing-calendario", actualizado);
  };

  const moverPublicacion = async (id, nuevaFecha) => {
    const actualizado = publicaciones.map((p) => (p.id === id ? { ...p, fecha: nuevaFecha } : p));
    setPublicaciones(actualizado);
    await saveData("marketing-calendario", actualizado);
  };

  const cambiarMes = (delta) => {
    setMesActual((m) => {
      const nuevo = new Date(m.year, m.month + delta, 1);
      return { year: nuevo.getFullYear(), month: nuevo.getMonth() };
    });
  };

  const celdas = getGrillaMes(mesActual.year, mesActual.month);
  const porFecha = {};
  publicaciones.forEach((p) => {
    if (!porFecha[p.fecha]) porFecha[p.fecha] = [];
    porFecha[p.fecha].push(p);
  });
  const hoyISO = fechaISO(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const publicacionesDelDia = diaSeleccionado ? (porFecha[diaSeleccionado] || []) : [];

  return (
    <div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">Planificá qué vas a publicar, y cuándo. Tocá un día para agregar o ver tarjetas, y arrastralas para moverlas.</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={() => cambiarMes(-1)} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "#eee9dd", color: BRAND.navy }}>
          <ArrowLeft size={14} />
        </button>
        <span style={{ color: BRAND.navy }} className="text-sm font-semibold capitalize">{MESES[mesActual.month]} {mesActual.year}</span>
        <button onClick={() => cambiarMes(1)} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "#eee9dd", color: BRAND.navy }}>
          <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_SEMANA.map((d) => (
          <div key={d} style={{ color: "#a89f88" }} className="text-[10px] font-semibold uppercase text-center py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-5">
        {celdas.map((dia, i) => {
          if (!dia) return <div key={i} />;
          const fecha = fechaISO(mesActual.year, mesActual.month, dia);
          const items = porFecha[fecha] || [];
          const esHoy = fecha === hoyISO;
          const esSeleccionado = fecha === diaSeleccionado;
          return (
            <button
              key={i}
              onClick={() => setDiaSeleccionado(fecha)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => arrastrando && moverPublicacion(arrastrando, fecha)}
              className="rounded-lg p-1.5 text-left flex flex-col items-start"
              style={{
                minHeight: "58px",
                background: esSeleccionado ? "#eef7f6" : "#ffffff",
                border: esSeleccionado ? `1.5px solid ${BRAND.teal}` : "1px solid #e4dfd3",
              }}
            >
              <span style={{ color: esHoy ? BRAND.teal : BRAND.navy }} className="text-xs font-semibold mb-1">{dia}</span>
              <div className="flex flex-col gap-0.5 w-full">
                {items.slice(0, 2).map((p) => (
                  <div key={p.id} draggable
                    onDragStart={(e) => { e.stopPropagation(); setArrastrando(p.id); }}
                    onDragEnd={() => setArrastrando(null)}
                    className="text-[9px] px-1 py-0.5 rounded truncate cursor-grab" style={{ background: colorTipo(p.tipo).bg, color: colorTipo(p.tipo).text }}>
                    {p.tipo}
                  </div>
                ))}
                {items.length > 2 && (
                  <span style={{ color: "#a89f88" }} className="text-[9px]">+{items.length - 2} más</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {diaSeleccionado && (
        <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <span style={{ color: BRAND.navy }} className="text-sm font-semibold capitalize block mb-3">
            {new Date(diaSeleccionado + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </span>

          <div className="space-y-2 mb-4">
            {publicacionesDelDia.map((p) => (
              <div key={p.id} className="rounded-lg p-3" style={{ background: "#faf8f4", border: "1px solid #f0ece2" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: colorTipo(p.tipo).bg, color: colorTipo(p.tipo).text }}>
                    {p.tipo}
                  </span>
                  <button onClick={() => eliminar(p.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
                </div>
                {p.copy && <p style={{ color: "#4a4740" }} className="text-sm mb-2 whitespace-pre-wrap">{p.copy}</p>}
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs" style={{ color: "#127a79" }}>
                    <ExternalLink size={11} /> Ver creativo
                  </a>
                )}
              </div>
            ))}
            {loaded && publicacionesDelDia.length === 0 && (
              <p style={{ color: "#a89f88" }} className="text-xs">Sin tarjetas este día. Agregá una abajo.</p>
            )}
          </div>

          <div className="pt-3" style={{ borderTop: "1px solid #f0ece2" }}>
            <div className="flex gap-2 mb-2">
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="rounded-lg px-3 py-2 text-sm outline-none flex-1" style={{ border: "1px solid #e4dfd3" }}>
                {TIPOS_PUBLICACION.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <textarea value={form.copy} onChange={(e) => setForm({ ...form, copy: e.target.value })} rows={3}
              placeholder="Copy que vas a usar..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none mb-2" style={{ border: "1px solid #e4dfd3" }} />
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="Link al creativo (Drive, Canva, etc.)"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
            <button onClick={agregar} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ background: BRAND.teal, color: BRAND.navy }}>
              <Plus size={14} /> Agregar tarjeta a este día
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
