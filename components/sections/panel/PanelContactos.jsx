"use client";

import { useMemo, useState } from "react";
import { BRAND } from "@/lib/constants";
import { ESTADOS, ESTADO_COLOR, MARCAS, labelEstado, segNombre } from "@/lib/panel/constants";
import { contactosApi, interaccionesApi } from "@/lib/panel/api";

function parseCSV(text) {
  text = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c && c.trim().length));
}

const CAMPO_GUESS = {
  nombre: ["nombre", "name", "full_name", "contacto"],
  empresa: ["empresa", "company", "organizacion"],
  puesto: ["puesto", "cargo", "role", "title"],
  industria: ["industria", "industry", "rubro", "sector"],
  email: ["email", "mail", "correo"],
  telefono: ["telefono", "teléfono", "phone", "celular", "whatsapp"],
  pais: ["pais", "país", "country"],
};
const CAMPOS_APP = [["nombre", "Nombre"], ["empresa", "Empresa"], ["puesto", "Puesto"], ["industria", "Industria"], ["email", "Email"], ["telefono", "Teléfono"], ["pais", "País"], ["", "(ignorar)"]];

function adivinar(header) {
  const h = header.toLowerCase().trim();
  for (const key in CAMPO_GUESS) if (CAMPO_GUESS[key].includes(h)) return key;
  return "";
}

function ImportarCSV({ marca, setMarca, onImportado, showToast }) {
  const [headers, setHeaders] = useState(null);
  const [rows, setRows] = useState([]);
  const [mapa, setMapa] = useState({});
  const [importando, setImportando] = useState(false);

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCSV(reader.result);
      const hs = parsed[0];
      setHeaders(hs);
      setRows(parsed.slice(1));
      const m = {};
      hs.forEach((h) => { m[h] = adivinar(h); });
      setMapa(m);
    };
    reader.readAsText(file);
  };

  const confirmar = async () => {
    setImportando(true);
    const colIndex = {};
    headers.forEach((h, i) => { if (mapa[h]) colIndex[mapa[h]] = i; });
    const contactos = rows.map((r) => {
      const get = (k) => (colIndex[k] !== undefined ? (r[colIndex[k]] || "").trim() : "");
      return { nombre: get("nombre"), empresa: get("empresa"), puesto: get("puesto"), industria: get("industria"), email: get("email"), telefono: get("telefono"), pais: get("pais") };
    }).filter((c) => c.nombre);

    try {
      const { importados, omitidos } = await contactosApi.bulkImport(contactos, marca);
      showToast(`${importados} contactos importados${omitidos ? `, ${omitidos} omitidos` : ""}`);
      setHeaders(null); setRows([]);
      onImportado();
    } catch (e) {
      showToast("Error al importar: " + e.message);
    }
    setImportando(false);
  };

  return (
    <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
      <h3 style={{ color: BRAND.navy }} className="text-sm font-semibold mb-2">Cargar contactos (CSV)</h3>
      <div className="flex items-center gap-2 flex-wrap">
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" />
        <select value={marca} onChange={(e) => setMarca(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
          {MARCAS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <span style={{ color: "#8a8578" }} className="text-xs">Columnas: nombre, empresa, puesto, industria, email, telefono, pais. Duplicados por email se actualizan.</span>
      </div>
      {headers && (
        <div className="mt-3">
          <div className="overflow-auto max-h-56 rounded-md" style={{ border: "1px solid #eee" }}>
            <table className="text-xs w-full">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="p-1.5 text-left" style={{ color: "#8a8578" }}>
                      {h}
                      <select value={mapa[h] || ""} onChange={(e) => setMapa({ ...mapa, [h]: e.target.value })} className="block mt-1 text-xs" style={{ border: "1px solid #ddd" }}>
                        {CAMPOS_APP.map((f) => <option key={f[0]} value={f[0]}>{f[1]}</option>)}
                      </select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>{r.map((c, j) => <td key={j} className="p-1.5" style={{ color: "#6b6759" }}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-2">
            <button disabled={importando} onClick={confirmar} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: BRAND.navy }}>
              {importando ? "Importando..." : "Confirmar importación"}
            </button>
            <button onClick={() => { setHeaders(null); setRows([]); }} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "#f1efe8", color: "#4a4740" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetalleContacto({ contacto, segmentos, onCerrar, onActualizado, showToast }) {
  const [estado, setEstado] = useState(contacto.estado);
  const [canal, setCanal] = useState(contacto.canal_preferido || "");
  const [proximo, setProximo] = useState(contacto.proximo_seguimiento ? contacto.proximo_seguimiento.slice(0, 16) : "");
  const [interacciones, setInteracciones] = useState(null);
  const [nota, setNota] = useState("");

  useState(() => {
    interaccionesApi.list(contacto.id).then(setInteracciones).catch(() => setInteracciones([]));
  }, []);

  const seg = segmentos.find((s) => s.id === contacto.segmento_id);

  const guardar = async () => {
    await contactosApi.update(contacto.id, {
      estado,
      canal_preferido: canal || null,
      proximo_seguimiento: proximo ? new Date(proximo).toISOString() : null,
    });
    showToast("Guardado");
    onActualizado();
  };

  const agregarNota = async () => {
    if (!nota.trim()) return;
    const ins = await interaccionesApi.create({ contacto_id: contacto.id, canal: "email", tipo: "nota_manual", contenido: nota.trim() });
    setInteracciones((prev) => [ins, ...(prev || [])]);
    setNota("");
  };

  return (
    <div className="rounded-xl p-4 mt-4" style={{ background: "#faf9f6", border: "1px solid #e4dfd3" }}>
      <div className="flex items-center justify-between mb-2">
        <h3 style={{ color: BRAND.navy }} className="text-base font-semibold">{contacto.nombre}</h3>
        <button onClick={onCerrar} className="text-xs" style={{ color: "#8a8578" }}>Cerrar</button>
      </div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-3">
        {contacto.puesto || "—"} · {contacto.empresa || "—"} · {contacto.industria || "—"} · {contacto.pais || "—"} · {contacto.email || "sin email"} · {contacto.telefono || "sin teléfono"} · segmento: {seg ? segNombre(seg) : "sin asignar"}
      </p>
      <div className="flex gap-2 flex-wrap items-center mb-3">
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
          {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
        </select>
        <select value={canal} onChange={(e) => setCanal(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
          <option value="">Canal preferido: sin definir</option>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <input type="datetime-local" value={proximo} onChange={(e) => setProximo(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }} />
        <button onClick={guardar} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: BRAND.navy }}>Guardar</button>
      </div>
      <div className="rounded-lg p-3" style={{ background: "#ffffff", border: "1px solid #eee7d8" }}>
        <strong className="text-xs" style={{ color: "#8a8578" }}>Historial de interacciones</strong>
        <div className="mt-2 space-y-2">
          {(interacciones || []).length === 0 && <p className="text-xs" style={{ color: "#8a8578" }}>Sin interacciones todavía.</p>}
          {(interacciones || []).map((i) => (
            <div key={i.id} className="text-xs" style={{ color: "#4a4740" }}>
              <span className="font-semibold">{i.canal}</span> · {i.tipo} · {new Date(i.fecha).toLocaleString("es-AR")}
              {i.contenido && <p className="mt-0.5" style={{ color: "#6b6759" }}>{i.contenido}</p>}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Agregar nota manual" className="flex-1 text-xs rounded-md p-1.5" style={{ border: "1px solid #ddd" }} />
          <button onClick={agregarNota} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "#f1efe8", color: "#4a4740" }}>Agregar</button>
        </div>
      </div>
    </div>
  );
}

export default function PanelContactos({ contactos, segmentos, recargar, showToast }) {
  const [marcaImport, setMarcaImport] = useState(MARCAS[0]);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [abiertoId, setAbiertoId] = useState(null);

  const filtrados = useMemo(() => {
    let f = contactos;
    if (busqueda) {
      const b = busqueda.toLowerCase();
      f = f.filter((c) => (c.nombre || "").toLowerCase().includes(b) || (c.empresa || "").toLowerCase().includes(b));
    }
    if (estadoFiltro) f = f.filter((c) => c.estado === estadoFiltro);
    return f;
  }, [contactos, busqueda, estadoFiltro]);

  const abierto = contactos.find((c) => c.id === abiertoId);

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Contactos</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">Todos los contactos, de todas las marcas y segmentos.</p>

      <ImportarCSV marca={marcaImport} setMarca={setMarcaImport} onImportado={recargar} showToast={showToast} />

      <div className="flex gap-2 mb-3 flex-wrap">
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar nombre o empresa" className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }} />
        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
        </select>
      </div>

      <div className="overflow-auto rounded-xl" style={{ border: "1px solid #e4dfd3" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#faf9f6" }}>
              {["Nombre", "Empresa", "Puesto", "Marca", "Estado", "Próx. seguimiento"].map((h) => (
                <th key={h} className="text-left p-2 text-xs" style={{ color: "#8a8578" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-sm" style={{ color: "#8a8578" }}>Sin contactos todavía. Cargá un CSV arriba.</td></tr>
            )}
            {filtrados.map((c) => {
              const col = ESTADO_COLOR[c.estado] || ESTADO_COLOR.nuevo;
              return (
                <tr key={c.id} onClick={() => setAbiertoId(c.id)} className="cursor-pointer" style={{ borderTop: "1px solid #f0ece2", background: abiertoId === c.id ? "#faf9f6" : undefined }}>
                  <td className="p-2">{c.nombre}</td>
                  <td className="p-2" style={{ color: "#6b6759" }}>{c.empresa}</td>
                  <td className="p-2" style={{ color: "#6b6759" }}>{c.puesto}</td>
                  <td className="p-2" style={{ color: "#6b6759" }}>{c.marca_origen}</td>
                  <td className="p-2"><span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: col.bg, color: col.text }}>{labelEstado(c.estado)}</span></td>
                  <td className="p-2 text-xs" style={{ color: "#8a8578" }}>{c.proximo_seguimiento ? new Date(c.proximo_seguimiento).toLocaleString("es-AR") : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {abierto && (
        <DetalleContacto
          contacto={abierto}
          segmentos={segmentos}
          onCerrar={() => setAbiertoId(null)}
          onActualizado={recargar}
          showToast={showToast}
        />
      )}
    </div>
  );
}
