"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown, ChevronRight, ArrowLeft, X, Pencil, Trash2, Check,
  MessageCircle, ExternalLink,
} from "lucide-react";
import { BRAND, TIPOS_PUBLICACION, MESES, colorTipo, PILARES_CONTENIDO, AGENTE_MARKETING_URL } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid } from "@/lib/helpers";

const ETIQUETAS = ["Tipo", "T[ií]tulo", "Copy", "Link"];

function extraerCampo(bloque, etiqueta, otrasEtiquetas) {
  const inicio = new RegExp("(^|\\n)\\s*" + etiqueta + "\\s*:\\s*", "i");
  const m = bloque.match(inicio);
  if (!m) return "";
  const desde = bloque.slice(m.index + m[0].length);
  let fin = desde.length;
  otrasEtiquetas.forEach((et) => {
    const r = new RegExp("\\n\\s*" + et + "\\s*:", "i");
    const mm = desde.match(r);
    if (mm && mm.index < fin) fin = mm.index;
  });
  return desde.slice(0, fin).trim();
}

function parsearBloque(bloque) {
  const tipo = extraerCampo(bloque, "Tipo", ETIQUETAS.filter((e) => e !== "Tipo"));
  const titulo = extraerCampo(bloque, "T[ií]tulo", ETIQUETAS.filter((e) => e !== "T[ií]tulo"));
  const copy = extraerCampo(bloque, "Copy", ETIQUETAS.filter((e) => e !== "Copy"));
  const link = extraerCampo(bloque, "Link", ETIQUETAS.filter((e) => e !== "Link"));
  if (!tipo && !titulo && !copy) return null;
  return { tipo, titulo, copy, link };
}

function fechaCorta(fechaISO) {
  if (!fechaISO) return "";
  return new Date(fechaISO + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export default function ComunicacionMensualTab({ focoPiezaId, onLimpiarFoco }) {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const hoy = new Date();
  const mesActualKey = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  const [piezas, setPiezas] = useState([]);
  const [calendario, setCalendario] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [mesesAbiertos, setMesesAbiertos] = useState({ [mesActualKey]: true });
  const [detalle, setDetalle] = useState(null); // { mesKey, pilarId }
  const [formAbierto, setFormAbierto] = useState(false);
  const [pegado, setPegado] = useState("");
  const [form, setForm] = useState({ tipo: TIPOS_PUBLICACION[0], titulo: "", copy: "", link: "" });
  const [programarAbierto, setProgramarAbierto] = useState(null);
  const [programarValores, setProgramarValores] = useState({ fecha: hoyISO, hora: "09:00" });
  const [editandoId, setEditandoId] = useState(null);
  const [editValores, setEditValores] = useState({});
  const [destacadaId, setDestacadaId] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!unidadId) return;
    Promise.all([
      loadData("marketing-comunicacion", []),
      loadData("marketing-calendario", []),
    ]).then(([p, c]) => {
      setPiezas(p);
      setCalendario(c);
      setLoaded(true);
    });
  }, [unidadId]);

  // Si venimos de "Ver origen" desde el Calendario de contenido, abrimos
  // directo el mes y el pilar de esa pieza, y le hacemos scroll + resalte.
  // Deliberadamente solo reacciona a focoPiezaId/loaded (no a piezas/onLimpiarFoco):
  // es una sincronización puntual disparada por el padre, no algo que deba
  // repetirse cada vez que cambian las piezas.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!focoPiezaId || !loaded) return;
    const pieza = piezas.find((p) => p.id === focoPiezaId);
    if (pieza) {
      setMesesAbiertos((prev) => ({ ...prev, [pieza.mes]: true }));
      setDetalle({ mesKey: pieza.mes, pilarId: pieza.pilar });
      setDestacadaId(focoPiezaId);
      setTimeout(() => {
        const el = document.querySelector(`[data-pieza-id="${focoPiezaId}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      setTimeout(() => setDestacadaId(null), 1800);
    }
    onLimpiarFoco?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focoPiezaId, loaded]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const mostrarToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2600); };

  const persistirPiezas = async (nuevas) => { setPiezas(nuevas); await saveData("marketing-comunicacion", nuevas); };
  const persistirCalendario = async (nuevo) => { setCalendario(nuevo); await saveData("marketing-calendario", nuevo); };

  const labelMes = (key) => { const [y, m] = key.split("-").map(Number); return `${MESES[m - 1]} ${y}`; };
  const mesesPresentes = Array.from(new Set([mesActualKey, ...piezas.map((p) => p.mes)])).sort().reverse();

  const abrirDetalle = (mesKey, pilarId) => {
    setDestacadaId(null);
    setDetalle({ mesKey, pilarId });
    setFormAbierto(false);
    setPegado("");
  };

  const copiarFormato = (pilarId) => {
    const p = PILARES_CONTENIDO.find((x) => x.id === pilarId);
    const contexto = p
      ? `Pilar: ${p.titulo} (${p.porcentaje} — ${p.etiqueta})\nSobre este pilar: ${p.texto}`
      : "Pilar: [elegí uno: Educativo / Inspiracional / Prueba social / Oferta directa]";
    const texto = `Quiero contenido para difundir mi negocio en redes.
Devolveme cada publicación con este formato exacto, una debajo de la otra y separadas por una línea en blanco:

Tipo: [uno de estos exactos: ${TIPOS_PUBLICACION.filter((t) => t !== "Otro").join(" / ")}]
Título: [título o hook de la pieza]
Copy: [texto completo: guion, caption o descripción]
Link: [opcional]

${contexto}
Cantidad de publicaciones: 4
Tema que quiero tocar: [completá acá qué querés comunicar]`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(texto)
        .then(() => mostrarToast("Formato copiado ✓ — pegalo en el chat con Vera"))
        .catch(() => mostrarToast("No se pudo copiar — seleccioná el texto manualmente"));
    }
  };

  const interpretarPegado = (pilarId, mesKey) => {
    const texto = pegado.trim();
    if (!texto) { mostrarToast("Pegá primero la respuesta de Vera"); return; }
    const bloques = texto.split(/\n\s*\n(?=\s*Tipo\s*:)/i).map((b) => b.trim()).filter(Boolean);
    const parseados = bloques.map(parsearBloque).filter(Boolean);
    if (parseados.length === 0) {
      mostrarToast("No reconocí el formato — revisá que tenga los campos Tipo / Título / Copy");
      return;
    }
    const nuevas = parseados.map((d) => {
      const tipoMatch = TIPOS_PUBLICACION.find((t) => t.toLowerCase() === (d.tipo || "").toLowerCase()) || "Otro";
      return { id: uid(), mes: mesKey, pilar: pilarId, tipo: tipoMatch, titulo: d.titulo || "(sin título)", copy: d.copy || "", link: d.link || "", calendarioId: null };
    });
    persistirPiezas([...piezas, ...nuevas]);
    setPegado("");
    setFormAbierto(false);
    mostrarToast(parseados.length === 1 ? "Publicación cargada ✓" : `Se agregaron ${parseados.length} publicaciones ✓`);
  };

  const agregarManual = (pilarId, mesKey) => {
    const nueva = { id: uid(), mes: mesKey, pilar: pilarId, tipo: form.tipo, titulo: form.titulo.trim() || "(sin título)", copy: form.copy.trim(), link: form.link.trim(), calendarioId: null };
    persistirPiezas([...piezas, nueva]);
    setForm({ tipo: TIPOS_PUBLICACION[0], titulo: "", copy: "", link: "" });
    setFormAbierto(false);
  };

  const eliminarPieza = async (pieza) => {
    if (pieza.calendarioId) {
      await persistirCalendario(calendario.filter((c) => c.id !== pieza.calendarioId));
    }
    await persistirPiezas(piezas.filter((p) => p.id !== pieza.id));
  };

  const empezarEdicion = (pz) => {
    setEditandoId(pz.id);
    setEditValores({ tipo: pz.tipo, titulo: pz.titulo, copy: pz.copy, link: pz.link || "" });
  };
  const guardarEdicion = (id) => {
    persistirPiezas(piezas.map((p) => (p.id === id ? { ...p, ...editValores } : p)));
    setEditandoId(null);
  };

  const toggleProgramar = (pieza) => {
    if (programarAbierto === pieza.id) { setProgramarAbierto(null); return; }
    const actual = calendario.find((c) => c.id === pieza.calendarioId);
    setProgramarValores({ fecha: actual?.fecha || hoyISO, hora: actual?.hora || "09:00" });
    setProgramarAbierto(pieza.id);
  };

  const confirmarProgramacion = async (pieza) => {
    if (!programarValores.fecha) { mostrarToast("Elegí una fecha"); return; }
    const base = {
      fecha: programarValores.fecha, hora: programarValores.hora, tipo: pieza.tipo,
      copy: pieza.titulo ? `${pieza.titulo}\n\n${pieza.copy}` : pieza.copy,
      link: pieza.link, origenPiezaId: pieza.id,
    };
    if (pieza.calendarioId) {
      await persistirCalendario(calendario.map((c) => (c.id === pieza.calendarioId ? { ...c, ...base } : c)));
    } else {
      const nuevaId = uid();
      await persistirCalendario([...calendario, { id: nuevaId, ...base }]);
      await persistirPiezas(piezas.map((p) => (p.id === pieza.id ? { ...p, calendarioId: nuevaId } : p)));
    }
    setProgramarAbierto(null);
    mostrarToast("Publicación programada ✓ — ya aparece en el Calendario de contenido");
  };

  const quitarProgramacion = async (pieza) => {
    await persistirCalendario(calendario.filter((c) => c.id !== pieza.calendarioId));
    await persistirPiezas(piezas.map((p) => (p.id === pieza.id ? { ...p, calendarioId: null } : p)));
  };

  return (
    <div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">
        Vas volcando acá el contenido que armás mes a mes, agrupado por pilar. Tocá un mes para desplegarlo, y una tarjeta de pilar para ver todas las piezas en pantalla completa.
      </p>

      {/* Pedile a Vera */}
      <div className="rounded-xl p-4 mb-5 flex items-center justify-between gap-3 flex-wrap" style={{ background: "#eef7f6", border: "1px solid #cfe9e7" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#ffffff" }}>
            <MessageCircle size={15} color="#127a79" />
          </div>
          <div className="min-w-0">
            <div style={{ color: BRAND.navy }} className="text-[13px] font-bold">¿Te quedaste sin ideas?</div>
            <div style={{ color: "#6b6759" }} className="text-xs">Pedile contenido a Vera y pegá su respuesta acá directo — sin retipear nada.</div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => copiarFormato(null)} className="text-xs font-bold px-3.5 py-2 rounded-lg" style={{ background: "#ffffff", border: `1px solid ${BRAND.teal}`, color: "#127a79" }}>
            Copiar formato para Vera
          </button>
          <a href={AGENTE_MARKETING_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-3.5 py-2 rounded-lg" style={{ background: BRAND.teal, color: BRAND.navy }}>
            Abrir a Vera ↗
          </a>
        </div>
      </div>

      {/* Franjas de mes */}
      {mesesPresentes.map((mesKey) => {
        const abierto = !!mesesAbiertos[mesKey];
        const totalMes = piezas.filter((p) => p.mes === mesKey).length;
        return (
          <div key={mesKey} className="rounded-2xl mb-3.5 overflow-hidden" style={{ background: BRAND.navy }}>
            <button onClick={() => setMesesAbiertos((prev) => ({ ...prev, [mesKey]: !prev[mesKey] }))} className="w-full flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span style={{ color: BRAND.cream }} className="text-sm font-bold">Comunicación {labelMes(mesKey)}</span>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ color: "#9a9ab0", background: "rgba(255,255,255,0.06)" }}>{totalMes} piezas</span>
              </div>
              <ChevronDown size={16} color={BRAND.teal} style={{ transform: abierto ? "rotate(180deg)" : "none", transition: "transform .18s ease" }} />
            </button>
            {abierto && (
              <div className="p-4" style={{ background: BRAND.cream }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PILARES_CONTENIDO.map((p) => {
                    const piezasPilar = piezas.filter((z) => z.mes === mesKey && z.pilar === p.id);
                    return (
                      <button key={p.id} onClick={() => abrirDetalle(mesKey, p.id)} className="text-left rounded-xl p-4 flex flex-col" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-2xl font-bold leading-none" style={{ color: "#e4dfd3" }}>{p.numero}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: "#eef7f6", color: "#127a79" }}>
                            {p.porcentaje} · {p.etiqueta}
                          </span>
                        </div>
                        <div style={{ color: BRAND.navy }} className="text-[15px] font-bold mb-1">{p.titulo}</div>
                        <p style={{ color: "#6b6759" }} className="text-xs leading-relaxed mb-3 flex-1">{p.texto}</p>
                        <div className="flex items-center justify-between pt-2.5" style={{ borderTop: "1px solid #f0ece2" }}>
                          <span className="text-[11px] font-semibold" style={{ color: "#8a8578" }}>
                            {piezasPilar.length} {piezasPilar.length === 1 ? "pieza" : "piezas"} este mes
                          </span>
                          <div className="flex items-center gap-1">
                            {piezasPilar.slice(0, 5).map((z, i) => (
                              <span key={i} className="w-2 h-2 rounded-full" style={{ background: colorTipo(z.tipo).bg }} />
                            ))}
                            <ChevronRight size={13} color="#a89f88" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {toast && (
        <div className="fixed left-1/2 z-[60] px-4 py-2.5 rounded-full text-sm font-semibold" style={{ bottom: 24, transform: "translateX(-50%)", background: BRAND.navy, color: BRAND.cream }}>
          {toast}
        </div>
      )}

      {/* Overlay a pantalla completa con las piezas del pilar */}
      {detalle && (() => {
        const p = PILARES_CONTENIDO.find((x) => x.id === detalle.pilarId);
        const piezasPilar = piezas.filter((z) => z.mes === detalle.mesKey && z.pilar === detalle.pilarId);
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: BRAND.cream }}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ background: BRAND.cream, borderBottom: "1px solid #e4dfd3" }}>
              <button onClick={() => setDetalle(null)} className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#6b6759" }}>
                <ArrowLeft size={15} /> Volver a {labelMes(detalle.mesKey)}
              </button>
              <button onClick={() => setDetalle(null)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                <X size={15} color="#6b6759" />
              </button>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-6 pb-16">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-3xl font-extrabold leading-none" style={{ color: "#e4dfd3" }}>{p.numero}</span>
                <span style={{ color: BRAND.navy }} className="text-xl font-bold">{p.titulo}</span>
              </div>
              <p style={{ color: "#6b6759" }} className="text-sm leading-relaxed mb-6 max-w-lg">{p.texto}</p>

              {piezasPilar.map((pz) => {
                const c = colorTipo(pz.tipo);
                const editando = editandoId === pz.id;
                const progAbierto = programarAbierto === pz.id;
                const calEntry = calendario.find((cc) => cc.id === pz.calendarioId);
                return (
                  <div key={pz.id} data-pieza-id={pz.id} className="rounded-xl p-4 mb-3 group"
                    style={{ background: "#ffffff", border: "1px solid #e4dfd3", boxShadow: pz.id === destacadaId ? `0 0 0 3px ${BRAND.teal}66` : "none", transition: "box-shadow .3s ease" }}>
                    <div className="flex items-center justify-between mb-2.5">
                      {editando ? (
                        <select value={editValores.tipo} onChange={(e) => setEditValores({ ...editValores, tipo: e.target.value })}
                          className="text-xs rounded-lg px-2 py-1 outline-none" style={{ border: "1px solid #e4dfd3" }}>
                          {TIPOS_PUBLICACION.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: c.bg, color: c.text }}>{pz.tipo}</span>
                      )}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editando ? (
                          <button onClick={() => guardarEdicion(pz.id)} style={{ color: "#127a79" }}><Check size={14} /></button>
                        ) : (
                          <button onClick={() => empezarEdicion(pz)} style={{ color: "#a89f88" }}><Pencil size={13} /></button>
                        )}
                        <button onClick={() => eliminarPieza(pz)} style={{ color: "#a89f88" }}><Trash2 size={13} /></button>
                      </div>
                    </div>

                    {editando ? (
                      <>
                        <input value={editValores.titulo} onChange={(e) => setEditValores({ ...editValores, titulo: e.target.value })}
                          className="w-full text-sm font-bold rounded-lg px-2.5 py-1.5 outline-none mb-2" style={{ color: BRAND.navy, border: "1px solid #e4dfd3" }} />
                        <textarea value={editValores.copy} onChange={(e) => setEditValores({ ...editValores, copy: e.target.value })} rows={3}
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 outline-none resize-none mb-2" style={{ border: "1px solid #e4dfd3" }} />
                        <input value={editValores.link} onChange={(e) => setEditValores({ ...editValores, link: e.target.value })} placeholder="Link (opcional)"
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 outline-none" style={{ border: "1px solid #e4dfd3" }} />
                      </>
                    ) : (
                      <>
                        <div style={{ color: BRAND.navy }} className="text-sm font-bold mb-1.5 leading-snug">{pz.titulo}</div>
                        {pz.copy && <p style={{ color: "#6b6759" }} className="text-xs leading-relaxed whitespace-pre-wrap mb-2">{pz.copy}</p>}
                        {pz.link && (
                          <a href={pz.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#127a79" }}>
                            <ExternalLink size={11} /> Ver enlace
                          </a>
                        )}
                      </>
                    )}

                    <div className="flex items-center gap-2.5 flex-wrap mt-2.5 pt-2.5" style={{ borderTop: "1px solid #f0ece2" }}>
                      {calEntry ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ color: BRAND.navy, background: "#ffffff", border: `1.5px solid ${c.bg}` }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.bg }} /> Programado: {fechaCorta(calEntry.fecha)} · {calEntry.hora}
                          </span>
                          <button onClick={() => quitarProgramacion(pz)} className="text-[11px] font-semibold underline" style={{ color: "#a89f88" }}>Quitar</button>
                        </>
                      ) : (
                        <button onClick={() => toggleProgramar(pz)} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "#ffffff", border: "1px solid #e4dfd3", color: "#6b6759" }}>
                          📅 Programar
                        </button>
                      )}
                    </div>

                    {progAbierto && (
                      <div className="flex items-center gap-2 flex-wrap mt-2.5">
                        <input type="date" value={programarValores.fecha} onChange={(e) => setProgramarValores({ ...programarValores, fecha: e.target.value })}
                          className="text-xs rounded-lg px-2.5 py-1.5 outline-none" style={{ border: "1px solid #e4dfd3", color: BRAND.navy }} />
                        <input type="time" value={programarValores.hora} onChange={(e) => setProgramarValores({ ...programarValores, hora: e.target.value })}
                          className="text-xs rounded-lg px-2.5 py-1.5 outline-none" style={{ border: "1px solid #e4dfd3", color: BRAND.navy }} />
                        <button onClick={() => confirmarProgramacion(pz)} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: BRAND.teal, color: BRAND.navy }}>Confirmar</button>
                        <button onClick={() => setProgramarAbierto(null)} className="text-xs font-semibold px-2 py-1.5" style={{ color: "#8a8578" }}>Cancelar</button>
                      </div>
                    )}
                  </div>
                );
              })}
              {loaded && piezasPilar.length === 0 && (
                <p className="text-xs text-center py-6" style={{ color: "#a89f88" }}>Todavía no hay piezas cargadas para este pilar.</p>
              )}

              <div className="rounded-xl p-4 mb-3 flex items-center justify-between gap-3 flex-wrap" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                <span className="text-xs max-w-sm leading-relaxed" style={{ color: "#6b6759" }}>
                  Pedile a Vera ideas de contenido para este pilar y pegá la respuesta abajo, en “+ Agregar publicación”.
                </span>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => copiarFormato(p.id)} className="text-xs font-bold px-3.5 py-2 rounded-lg" style={{ background: "#ffffff", border: `1px solid ${BRAND.teal}`, color: "#127a79" }}>
                    Copiar formato para Vera
                  </button>
                  <a href={AGENTE_MARKETING_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-3.5 py-2 rounded-lg" style={{ background: BRAND.teal, color: BRAND.navy }}>
                    Abrir a Vera ↗
                  </a>
                </div>
              </div>

              {!formAbierto && (
                <button onClick={() => setFormAbierto(true)} className="w-full text-center text-sm font-semibold py-3.5 rounded-xl" style={{ border: "1.5px dashed #d8d2c3", color: "#8a8578" }}>
                  + Agregar publicación
                </button>
              )}
              {formAbierto && (
                <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: "#8a8578" }}>Pegá acá la respuesta de Vera (opcional)</label>
                  <textarea value={pegado} onChange={(e) => setPegado(e.target.value)} rows={3} placeholder={"Tipo: Reel\nTítulo: ...\nCopy: ...\nLink: ..."}
                    className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none mb-2" style={{ border: "1px solid #e4dfd3" }} />
                  <button onClick={() => interpretarPegado(detalle.pilarId, detalle.mesKey)} className="text-xs font-bold px-3.5 py-2 rounded-lg mb-3" style={{ background: BRAND.navy, color: BRAND.teal }}>
                    Interpretar y completar
                  </button>
                  <div className="text-center text-[10px] font-bold uppercase tracking-wide mb-3" style={{ color: "#a89f88" }}>— o completá manualmente —</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }}>
                      {TIPOS_PUBLICACION.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título / hook"
                      className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
                  </div>
                  <textarea value={form.copy} onChange={(e) => setForm({ ...form, copy: e.target.value })} rows={3} placeholder="Copy / guion..."
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none mb-2" style={{ border: "1px solid #e4dfd3" }} />
                  <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="Link (opcional)"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
                  <div className="flex gap-2">
                    <button onClick={() => agregarManual(detalle.pilarId, detalle.mesKey)} className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: BRAND.teal, color: BRAND.navy }}>
                      Agregar
                    </button>
                    <button onClick={() => { setFormAbierto(false); setPegado(""); }} className="text-sm font-semibold px-3 py-2" style={{ color: "#8a8578" }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
