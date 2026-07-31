"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
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

// Lee la primera hoja de un .xlsx/.xls y la devuelve como filas de texto
// (mismo formato que parseCSV: array de arrays, primera fila = encabezados).
function parseXLSX(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
  return rows
    .map((r) => r.map((c) => (c === null || c === undefined ? "" : String(c).trim())))
    .filter((r) => r.some((c) => c && c.trim().length));
}

// "apellido" no es un campo propio de contactos: se junta con "nombre" al
// armar el contacto (ver confirmar()). Se lista igual para que el usuario
// pueda mapear la columna de apellido de exports como los de Apollo.
const CAMPO_GUESS = {
  nombre: ["nombre", "name", "first_name", "first name"],
  apellido: ["apellido", "last_name", "last name", "surname"],
  empresa: ["empresa", "company", "organizacion", "organización", "company name"],
  puesto: ["puesto", "cargo", "role", "title"],
  industria: ["industria", "industry", "rubro", "sector"],
  email: ["email", "mail", "correo", "e-mail"],
  telefono: ["telefono", "teléfono", "phone", "celular", "whatsapp", "corporate phone", "mobile phone", "work direct phone"],
  pais: ["pais", "país", "country", "company country", "person country"],
};
const CAMPOS_APP = [["nombre", "Nombre"], ["apellido", "Apellido"], ["empresa", "Empresa"], ["puesto", "Puesto"], ["industria", "Industria"], ["email", "Email"], ["telefono", "Teléfono"], ["pais", "País"], ["", "(ignorar)"]];

function adivinar(header) {
  const h = (header || "").toLowerCase().trim();
  for (const key in CAMPO_GUESS) if (CAMPO_GUESS[key].includes(h)) return key;
  return "";
}

function ImportarCSV({ marca, setMarca, onImportado, showToast }) {
  const [headers, setHeaders] = useState(null);
  const [rows, setRows] = useState([]);
  const [mapa, setMapa] = useState({});
  const [importando, setImportando] = useState(false);

  const cargarFilas = (parsed) => {
    const hs = parsed[0];
    setHeaders(hs);
    setRows(parsed.slice(1));
    const m = {};
    hs.forEach((h) => { m[h] = adivinar(h); });
    setMapa(m);
  };

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const esExcel = /\.(xlsx|xls)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = esExcel ? parseXLSX(reader.result) : parseCSV(reader.result);
      cargarFilas(parsed);
    };
    if (esExcel) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  };

  const confirmar = async () => {
    setImportando(true);
    const colIndex = {};
    headers.forEach((h, i) => { if (mapa[h]) colIndex[mapa[h]] = i; });
    const contactos = rows.map((r) => {
      const get = (k) => (colIndex[k] !== undefined ? (r[colIndex[k]] || "").trim() : "");
      const nombreCompleto = [get("nombre"), get("apellido")].filter(Boolean).join(" ").trim();
      return { nombre: nombreCompleto, empresa: get("empresa"), puesto: get("puesto"), industria: get("industria"), email: get("email"), telefono: get("telefono"), pais: get("pais") };
    }).filter((c) => c.nombre);

    if (!contactos.length) {
      showToast("Ninguna fila tiene 'Nombre' asignado — revisá el mapeo de columnas arriba del archivo");
      setImportando(false);
      return;
    }

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
      <h3 style={{ color: BRAND.navy }} className="text-sm font-semibold mb-2">Cargar contactos (CSV o Excel)</h3>
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <label className="cursor-pointer text-sm font-semibold px-4 py-2 rounded-md text-white" style={{ background: BRAND.navy }}>
          Cargar archivo
          <input type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={onFile} className="hidden" />
        </label>
        <a
          href="/plantilla-contactos.csv"
          download
          className="text-sm font-semibold px-4 py-2 rounded-md"
          style={{ border: `1px solid ${BRAND.navy}`, color: BRAND.navy }}
        >
          Descargar plantilla
        </a>
        <label className="flex items-center gap-1.5 text-xs" style={{ color: "#8a8578" }}>
          Se importan a:
          <select value={marca} onChange={(e) => setMarca(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
            {MARCAS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ color: "#8a8578" }} className="text-xs">Soporta .csv, .xlsx y .xls (incluye exports de Apollo). Descargá la plantilla si no sabés qué columnas usar. Revisá el mapeo de columnas antes de confirmar. Duplicados por email se actualizan.</span>
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

function CampoEditable({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-xs" style={{ color: "#8a8578" }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "—"}
        className="text-sm rounded-md p-1.5"
        style={{ border: "1px solid #ddd" }}
      />
    </label>
  );
}

function DetalleContacto({ contacto, segmentos, onCerrar, onActualizado, showToast }) {
  const [nombre, setNombre] = useState(contacto.nombre || "");
  const [empresa, setEmpresa] = useState(contacto.empresa || "");
  const [puesto, setPuesto] = useState(contacto.puesto || "");
  const [industria, setIndustria] = useState(contacto.industria || "");
  const [pais, setPais] = useState(contacto.pais || "");
  const [email, setEmail] = useState(contacto.email || "");
  const [telefono, setTelefono] = useState(contacto.telefono || "");
  const [observaciones, setObservaciones] = useState(contacto.observaciones || "");
  const [estado, setEstado] = useState(contacto.estado);
  const [canal, setCanal] = useState(contacto.canal_preferido || "");
  const [proximo, setProximo] = useState(contacto.proximo_seguimiento ? contacto.proximo_seguimiento.slice(0, 16) : "");
  const [interacciones, setInteracciones] = useState(null);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);

  useState(() => {
    interaccionesApi.list(contacto.id).then(setInteracciones).catch(() => setInteracciones([]));
  }, []);

  const seg = segmentos.find((s) => s.id === contacto.segmento_id);

  const guardar = async () => {
    setGuardando(true);
    try {
      await contactosApi.update(contacto.id, {
        nombre: nombre.trim(),
        empresa: empresa.trim() || null,
        puesto: puesto.trim() || null,
        industria: industria.trim() || null,
        pais: pais.trim() || null,
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        observaciones: observaciones.trim() || null,
        estado,
        canal_preferido: canal || null,
        proximo_seguimiento: proximo ? new Date(proximo).toISOString() : null,
      });
      showToast("Guardado");
      onActualizado();
    } catch (e) {
      showToast("Error al guardar: " + e.message);
    }
    setGuardando(false);
  };

  const agregarNota = async () => {
    if (!nota.trim()) return;
    const ins = await interaccionesApi.create({ contacto_id: contacto.id, canal: "email", tipo: "nota_manual", contenido: nota.trim() });
    setInteracciones((prev) => [ins, ...(prev || [])]);
    setNota("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{ background: "rgba(20, 20, 30, 0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
    <div className="rounded-xl p-4 w-full max-w-2xl my-4" style={{ background: "#faf9f6", border: "1px solid #e4dfd3", boxShadow: "0 10px 40px rgba(0,0,0,0.25)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 style={{ color: BRAND.navy }} className="text-base font-semibold">{contacto.nombre}</h3>
        <button onClick={onCerrar} className="text-xs px-2 py-1 rounded-md" style={{ color: "#4a4740", background: "#f1efe8" }}>Cerrar ✕</button>
      </div>

      <div className="rounded-lg p-3 mb-3" style={{ background: "#ffffff", border: "1px solid #eee7d8" }}>
        <strong className="text-xs" style={{ color: "#8a8578" }}>Datos del contacto</strong>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <CampoEditable label="Nombre" value={nombre} onChange={setNombre} />
          <CampoEditable label="Empresa" value={empresa} onChange={setEmpresa} />
          <CampoEditable label="Puesto" value={puesto} onChange={setPuesto} />
          <CampoEditable label="Industria" value={industria} onChange={setIndustria} />
          <CampoEditable label="País" value={pais} onChange={setPais} />
          <CampoEditable label="Email" value={email} onChange={setEmail} type="email" />
          <CampoEditable label="Teléfono" value={telefono} onChange={setTelefono} />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs" style={{ color: "#8a8578" }}>Segmento</span>
            <span className="text-sm p-1.5">{seg ? segNombre(seg) : "sin asignar"}</span>
          </div>
        </div>
      </div>

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
      </div>

      <div className="rounded-lg p-3 mb-3" style={{ background: "#ffffff", border: "1px solid #eee7d8" }}>
        <label className="flex flex-col gap-0.5">
          <span className="text-xs" style={{ color: "#8a8578" }}>Observaciones</span>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas generales sobre este contacto..."
            rows={3}
            className="text-sm rounded-md p-1.5 resize-y"
            style={{ border: "1px solid #ddd" }}
          />
        </label>
      </div>

      <button disabled={guardando} onClick={guardar} className="text-xs px-3 py-1.5 rounded-md text-white mb-3" style={{ background: BRAND.navy }}>
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>

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
    </div>
  );
}

export default function PanelContactos({ contactos, segmentos, marcaFiltro, recargar, showToast }) {
  const [marcaImport, setMarcaImport] = useState(
    marcaFiltro && marcaFiltro !== "todas" ? marcaFiltro : MARCAS[0]
  );
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [abiertoId, setAbiertoId] = useState(null);

  // La pestaña "Marca:" de arriba filtra qué contactos se ven. Si el
  // selector de importación no sigue esa misma marca, es fácil subir un
  // archivo pensando que va a una marca y que termine en otra (los
  // contactos se importan igual, solo que no aparecen en la pestaña que
  // se está mirando). Lo mantenemos sincronizado con la pestaña activa.
  useEffect(() => {
    if (marcaFiltro && marcaFiltro !== "todas") setMarcaImport(marcaFiltro);
  }, [marcaFiltro]);

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
